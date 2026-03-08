import { Buffer } from "buffer";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Transaction as Web3Tx,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import { getTreasurySecretKey } from "../utils/ecosystem";
import {
  generateSigner,
  keypairIdentity,
  publicKey as umiPublicKey,
} from "@metaplex-foundation/umi";
import {
  create as createCoreAsset,
  burn as burnCoreAsset,
  fetchAsset,
  fetchAssetsByOwner,
} from "@metaplex-foundation/mpl-core";
import { getUmi } from "../utils/solana";
import { verifiedProjects } from "../data/verified-projects";
import { SOLANA_NETWORK, CC_TOKEN_MINT, EXPLORER_BASE_URL } from "../constants";
import * as anchor from "@coral-xyz/anchor";
import solCarbonIdl from "../data/sol_carbon.json";

// ─── Constants ───────────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey(solCarbonIdl.address);
const CC_DECIMALS = 2;
const CC_BASE_UNITS = 10 ** CC_DECIMALS;

/**
 * Derives the Treasury PDA
 * seeds = [b"treasury", mint.toBuffer()]
 */
const getTreasuryPDA = (mint: PublicKey) => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), mint.toBuffer()],
    PROGRAM_ID,
  );
};

const normalizeCCAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0)
    throw new Error("Amount must be greater than 0");
  return Math.round(amount * CC_BASE_UNITS) / CC_BASE_UNITS;
};

const toCCBaseUnits = (amount: number) => {
  const normalized = normalizeCCAmount(amount);
  return Math.round(normalized * CC_BASE_UNITS);
};

const fromRawCCAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.round(amount * CC_BASE_UNITS) / CC_BASE_UNITS;
};

// ─── Types ───────────────────────────────────────────────────────────────────

/** Callback that asks the connected wallet to sign a transaction. */
export type SignTransaction = (tx: Web3Tx) => Promise<Web3Tx>;

export interface CarbonProject {
  id: string;
  name: string;
  location: string;
  pricePerCC: number;
  availableCC: number;
  type: string;
  image: string;
  description: string;
  verified: boolean;
  rating: number;
  totalSupply: number;
  symbol: string;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  sparkline: number[];
  registry?: string;
  methodology?: string;
  lastAudit?: string;
}

export interface NFTCertificate {
  id: string;
  projectId: string;
  projectName: string;
  purchasingFirm?: string;
  amount: number;
  mintDate: Date;
  tokenId: string;
  uri: string;
  owner: string; // The wallet address that owns this certificate
}

export interface Transaction {
  id: string;
  type: "buy" | "sell" | "retire";
  amount: number;
  pricePerCC: number;
  totalSOL: number;
  projectName: string;
  purchasingFirm?: string;
  timestamp: Date;
  signature: string;
  status: "completed" | "pending" | "failed";
  owner: string; // The wallet address that performed this transaction
  explorerUrl?: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  amount: number;
  pricePerCC: number;
  createdAt: Date;
}

interface BlockchainState {
  carbonCredits: number;
  transactions: Transaction[];
  listings: Listing[];
  isLoading: boolean;
  nftCertificates: NFTCertificate[];

  buyCredits: (
    amount: number,
    pricePerCC: number,
    projectName: string,
    projectId: string,
    image: string,
    walletPublicKey?: string,
    signTransaction?: SignTransaction,
    purchasingFirm?: string,
  ) => Promise<{ signature: string; assetId?: string }>;
  sellCredits: (
    amount: number,
    pricePerCC: number,
    walletPublicKey?: string,
    signTransaction?: SignTransaction,
  ) => Promise<string>;
  retireCredits: (
    certificateId: string,
    walletPublicKey?: string,
    signTransaction?: SignTransaction,
  ) => Promise<string>;
  refreshOnChainData: (walletPublicKey: string) => Promise<void>;
  resetState: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTreasuryKeypair = () =>
  Keypair.fromSecretKey(getTreasurySecretKey());

const getExplorerUrl = (signature: string, type: "tx" | "address" = "tx") =>
  `${EXPLORER_BASE_URL}/${type}/${signature}?cluster=${SOLANA_NETWORK}`;

/** Build a Solana Connection with a slightly higher timeout for stability */
const makeConnection = () =>
  new Connection(clusterApiUrl(SOLANA_NETWORK), {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60_000,
  });

/**
 * Send a transaction and retry up to `retries` times on
 * "blockhash not found" / "node is behind" transient errors.
 */
async function sendWithRetry(
  connection: Connection,
  tx: Web3Tx,
  retries = 3,
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      return sig;
    } catch (e: any) {
      const transient =
        e?.message?.includes("blockhash") ||
        e?.message?.includes("node is behind") ||
        e?.message?.includes("rate limit");
      if (transient && attempt < retries - 1) {
        console.warn(
          `[sendWithRetry] attempt ${attempt + 1} failed, retrying…`,
          e.message,
        );
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      } else {
        throw e;
      }
    }
  }
  throw new Error("sendWithRetry: exhausted retries");
}

/**
 * Fetch a fresh blockhash and stamp it onto the tx.
 * Uses 'finalized' commitment so the blockhash is always valid.
 */
async function stampBlockhash(connection: Connection, tx: Web3Tx) {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("finalized");
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  return { blockhash, lastValidBlockHeight };
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useBlockchainStore = create<BlockchainState>()(
  persist(
    (set, get) => ({
      carbonCredits: 0,
      transactions: [],
      listings: [],
      isLoading: false,
      nftCertificates: [],

      resetState: () => {
        set({
          carbonCredits: 0,
          transactions: [],
          listings: [],
          nftCertificates: [],
        });
      },

      refreshOnChainData: async (walletPublicKey) => {
        if (!walletPublicKey) return;
        console.log("[Sync] Refreshing data for:", walletPublicKey);

        try {
          const umi = getUmi();
          const ownerPk = umiPublicKey(walletPublicKey);

          // 1. Fetch all Metaplex Core assets owned by this wallet
          const assets = await fetchAssetsByOwner(umi, ownerPk);

          // 2. Filter for SolCarbon certificates
          const solCarbonAssets = assets.filter(
            (asset) =>
              asset.name.includes("Carbon Certificate") ||
              (asset as any).plugins?.attributes?.attributeList?.some(
                (attr: any) => attr.key === "Project",
              ),
          );

          console.log(
            `[Sync] Found ${solCarbonAssets.length} SolCarbon assets on-chain.`,
          );

          // 3. Map to our app's NFTCertificate format
          const fetchedCerts: NFTCertificate[] = solCarbonAssets
            .map((asset) => {
              const attributes =
                (asset as any).plugins?.attributes?.attributeList || [];
              const projectName =
                attributes.find((a: any) => a.key === "Project")?.value ||
                asset.name.split(": ")[1] ||
                "Unknown Project";
              const amountStr =
                attributes.find((a: any) => a.key === "Amount")?.value || "0";
              const amount = fromRawCCAmount(parseFloat(amountStr) || 0);
              const purchasingFirm =
                attributes.find((a: any) => a.key === "Purchasing Firm")
                  ?.value || "Unknown";

              // Try to find the matching project to get the ID and image
              const matchingProject = verifiedProjects.find(
                (p) => p.name === projectName,
              );

              return {
                id: asset.publicKey.toString(),
                projectId: matchingProject?.id || "unknown",
                projectName: projectName,
                purchasingFirm: purchasingFirm,
                amount: amount,
                uri: asset.uri || matchingProject?.image || "",
                tokenId: asset.publicKey.toString(),
                mintDate: new Date(), // We don't have exact block time here, using current as fallback
                owner: walletPublicKey,
              };
            })
            .filter((c) => c.amount > 0);

          // 4. Update the store - Merge truth from blockchain with unindexed local certs
          set((state) => {
            const otherWalletCerts = state.nftCertificates.filter(
              (c) => c.owner !== walletPublicKey,
            );
            const currentWalletLocalCerts = state.nftCertificates.filter(
              (c) => c.owner === walletPublicKey,
            );

            // Rule: Keep local certs that are NOT yet on chain IF they are younger than 2 minutes
            // (handles RPC indexing lag while still allowing on-chain truth to eventually take over)
            const now = Date.now();
            const unindexedRecentCerts = currentWalletLocalCerts.filter(
              (local) => {
                const isOnChain = fetchedCerts.some(
                  (f) => f.tokenId === local.tokenId,
                );
                const ageMs =
                  now -
                  (local.mintDate instanceof Date
                    ? local.mintDate.getTime()
                    : new Date(local.mintDate).getTime());
                return !isOnChain && ageMs < 120_000; // 2 minutes grace period
              },
            );

            const finalCerts = [
              ...fetchedCerts,
              ...unindexedRecentCerts,
              ...otherWalletCerts,
            ];

            // Deriving numeric balance from certificates truth
            const activeWalletCerts = finalCerts.filter(
              (c) => c.owner === walletPublicKey,
            );
            const totalCC = activeWalletCerts.reduce(
              (sum, c) => sum + c.amount,
              0,
            );

            return {
              nftCertificates: finalCerts,
              carbonCredits: totalCC,
            };
          });
        } catch (error) {
          console.error("[Sync] Failed to fetch on-chain assets:", error);
        }
      },

      // ── BUY ─────────────────────────────────────────────────────────
      buyCredits: async (
        amount,
        pricePerCC,
        projectName,
        projectId,
        image,
        walletPublicKey,
        signTransaction,
        purchasingFirm = "Individual Collector",
      ) => {
        set({ isLoading: true });
        const safeAmount = normalizeCCAmount(amount);
        const totalSOL = safeAmount * pricePerCC;

        if (walletPublicKey && signTransaction) {
          try {
            const connection = makeConnection();
            const userPubkey = new PublicKey(walletPublicKey);
            const mintPubkey = new PublicKey(CC_TOKEN_MINT);
            const amountBaseUnits = toCCBaseUnits(safeAmount);
            const priceLamportsPerCC = Math.floor(
              pricePerCC * LAMPORTS_PER_SOL,
            );

            // Derivations
            const [treasuryState] = getTreasuryPDA(mintPubkey);
            const userATA = await splToken.getAssociatedTokenAddress(
              mintPubkey,
              userPubkey,
            );

            // ── OPTIMISTIC UPDATE ──
            const tempTxId = `temp-${Date.now()}`;
            const optimisticTx: Transaction = {
              id: tempTxId,
              type: "buy",
              amount: safeAmount,
              pricePerCC,
              totalSOL,
              projectName,
              purchasingFirm,
              timestamp: new Date(),
              signature: "pending...",
              status: "pending",
              owner: walletPublicKey,
            };
            set((state) => ({
              transactions: [optimisticTx, ...state.transactions],
            }));

            // ── Step 1: Initialize Anchor Provider & Program ──
            const wallet = {
              publicKey: userPubkey,
              signTransaction: async (tx: any) => await signTransaction(tx),
              signAllTransactions: async (txs: any[]) => {
                const signed = [];
                for (const tx of txs) {
                  signed.push(await signTransaction(tx));
                }
                return signed;
              },
            };

            const provider = new anchor.AnchorProvider(
              connection,
              wallet as any,
              { commitment: "confirmed" },
            );
            const program = new anchor.Program(solCarbonIdl as any, provider);

            // ── Step 2: Ensure User ATA exists ──
            const ataInfo = await connection.getAccountInfo(userATA);
            if (!ataInfo) {
              console.log("[ATA] Creating user ATA…");
              const ataTx = new Web3Tx().add(
                splToken.createAssociatedTokenAccountInstruction(
                  userPubkey,
                  userATA,
                  userPubkey,
                  mintPubkey,
                ),
              );
              await stampBlockhash(connection, ataTx);
              const signedAtaTx = await signTransaction(ataTx);
              const ataSig = await sendWithRetry(connection, signedAtaTx);
              await connection.confirmTransaction(ataSig, "confirmed");
            }

            // ── DEBUG LOGS ──
            console.log("[Buy] Params:", {
              amount: String(safeAmount),
              amountBaseUnits: String(amountBaseUnits),
              pricePerCC: String(pricePerCC),
              lamportsPerCC: String(priceLamportsPerCC),
            });

            // Safety Checks
            if (!userPubkey || !treasuryState || !mintPubkey || !userATA) {
              throw new Error("One or more required accounts are undefined");
            }
            if (!splToken.TOKEN_PROGRAM_ID || !SystemProgram.programId) {
              throw new Error("Program IDs are undefined");
            }

            // ── Step 3: Anchor Instruction Call ──
            console.log("[Anchor] Calling buy_credits…");
            const buySig = await program.methods
              .buyCredits(
                new anchor.BN(amountBaseUnits.toString()),
                new anchor.BN(priceLamportsPerCC.toString()),
              )
              .accountsStrict({
                user: userPubkey,
                treasuryState: treasuryState,
                mint: mintPubkey,
                userAta: userATA,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
              } as any)
              .rpc();

            console.log("[Anchor] Buy confirmed:", buySig);

            // ── Step 4: Metaplex Core NFT certificate (Off-program for now) ──
            let assetPk = "";
            try {
              const umi = getUmi();
              // We still need the treasury key for Metaplex minting since the program doesn't handle Core yet
              const treasuryKp = getTreasuryKeypair();
              const treasurySigner = keypairIdentity(
                umi.eddsa.createKeypairFromSecretKey(treasuryKp.secretKey),
              );
              umi.use(treasurySigner);

              const assetSigner = generateSigner(umi);
              assetPk = assetSigner.publicKey.toString();
              await createCoreAsset(umi, {
                asset: assetSigner,
                name: `Carbon Certificate: ${projectName}`,
                uri: image,
                owner: umiPublicKey(walletPublicKey),
                plugins: [
                  {
                    type: "Attributes",
                    attributeList: [
                      { key: "Project", value: projectName },
                      { key: "Amount", value: `${safeAmount} CC` },
                      { key: "Minter", value: walletPublicKey || "Unknown" },
                      {
                        key: "Purchasing Firm",
                        value: purchasingFirm || "Individual",
                      },
                    ],
                  },
                ],
              }).sendAndConfirm(umi, { confirm: { commitment: "confirmed" } });
            } catch (nftErr: any) {
              console.warn(
                "[Umi] NFT mint failed (non-fatal):",
                nftErr.message,
              );
            }

            // Commit state
            const txRecord: Transaction = {
              id: Date.now().toString(),
              type: "buy",
              amount: safeAmount,
              pricePerCC,
              totalSOL,
              projectName,
              purchasingFirm,
              timestamp: new Date(),
              signature: buySig,
              status: "completed",
              owner: walletPublicKey,
              explorerUrl: getExplorerUrl(buySig),
            };

            set((state) => {
              const filteredTxs = state.transactions.filter(
                (tx) => tx.id !== tempTxId,
              );
              const finalCerts: NFTCertificate[] = [
                {
                  id: `nft-${Date.now()}`,
                  projectId,
                  projectName,
                  purchasingFirm,
                  amount: safeAmount,
                  uri: image,
                  tokenId: assetPk || buySig,
                  mintDate: new Date(),
                  owner: walletPublicKey,
                },
                ...state.nftCertificates,
              ];
              return {
                nftCertificates: finalCerts,
                transactions: [txRecord, ...filteredTxs],
                carbonCredits: finalCerts
                  .filter((c) => c.owner === walletPublicKey)
                  .reduce((sum, c) => sum + c.amount, 0),
                isLoading: false,
              };
            });

            get().refreshOnChainData(walletPublicKey);
            return { signature: buySig, assetId: assetPk || buySig };
          } catch (e: any) {
            console.error("[Buy] Anchor call failed:", {
              message: e?.message,
              stack: e?.stack,
              logs: e?.logs,
            });
            set({ isLoading: false });
            throw new Error(e.message || "Transaction failed on devnet");
          }
        }
        set({ isLoading: false });
        throw new Error("Wallet not connected.");
      },

      // ── SELL ─────────────────────────────────────────────────────────
      sellCredits: async (
        amount,
        pricePerCC,
        walletPublicKey,
        signTransaction,
      ) => {
        set({ isLoading: true });
        const safeAmount = normalizeCCAmount(amount);
        const amountBaseUnits = toCCBaseUnits(safeAmount);
        const totalSOL = safeAmount * pricePerCC;

        if (walletPublicKey && signTransaction) {
          try {
            const connection = makeConnection();
            const userPubkey = new PublicKey(walletPublicKey);
            const mintPubkey = new PublicKey(CC_TOKEN_MINT);

            // Derivations
            const [treasuryState] = getTreasuryPDA(mintPubkey);
            const userATA = await splToken.getAssociatedTokenAddress(
              mintPubkey,
              userPubkey,
            );
            const treasuryATA = await splToken.getAssociatedTokenAddress(
              mintPubkey,
              treasuryState,
            );

            if (
              !userPubkey ||
              !treasuryState ||
              !mintPubkey ||
              !userATA ||
              !treasuryATA
            ) {
              throw new Error(
                "One or more required sell accounts are undefined",
              );
            }
            if (!splToken.TOKEN_PROGRAM_ID) {
              throw new Error("Token program ID is undefined");
            }

            // ── Step 1: Initialize Anchor Provider & Program ──
            const wallet = {
              publicKey: userPubkey,
              signTransaction: async (tx: any) => await signTransaction(tx),
              signAllTransactions: async (txs: any[]) => {
                const signed = [];
                for (const tx of txs) {
                  signed.push(await signTransaction(tx));
                }
                return signed;
              },
            };

            const provider = new anchor.AnchorProvider(
              connection,
              wallet as any,
              { commitment: "confirmed" },
            );
            const program = new anchor.Program(solCarbonIdl as any, provider);

            console.log("[Anchor] Calling sell_credits…");
            const sellSig = await program.methods
              .sellCredits(
                new anchor.BN(amountBaseUnits.toString()),
                new anchor.BN(
                  Math.floor(pricePerCC * LAMPORTS_PER_SOL).toString(),
                ),
              )
              .accountsStrict({
                user: userPubkey,
                treasuryState: treasuryState,
                mint: mintPubkey,
                userAta: userATA,
                treasuryAta: treasuryATA,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
              } as any)
              .rpc();

            console.log("[Anchor] Sell confirmed:", sellSig);

            set((s) => ({
              transactions: [
                {
                  id: Date.now().toString(),
                  type: "sell",
                  amount: safeAmount,
                  pricePerCC,
                  totalSOL,
                  projectName: "Sold on Marketplace",
                  timestamp: new Date(),
                  signature: sellSig,
                  status: "completed",
                  owner: walletPublicKey,
                  explorerUrl: getExplorerUrl(sellSig),
                },
                ...s.transactions,
              ],
              isLoading: false,
            }));

            get().refreshOnChainData(walletPublicKey);
            return sellSig;
          } catch (e: any) {
            console.error("[Sell] Anchor call failed:", e.message);
            set({ isLoading: false });
            throw new Error(e.message || "Sell transaction failed");
          }
        }
        set({ isLoading: false });
        throw new Error("Wallet not connected.");
      },

      // ── RETIRE ───────────────────────────────────────────────────────
      retireCredits: async (
        certificateId,
        walletPublicKey,
        signTransaction,
      ) => {
        set({ isLoading: true });
        const state = get();
        const cert = state.nftCertificates.find((c) => c.id === certificateId);
        if (!cert) {
          set({ isLoading: false });
          throw new Error("Certificate not found");
        }

        if (walletPublicKey && signTransaction) {
          try {
            const connection = makeConnection();
            const userPubkey = new PublicKey(walletPublicKey);
            const mintPubkey = new PublicKey(CC_TOKEN_MINT);
            const userATA = await splToken.getAssociatedTokenAddress(
              mintPubkey,
              userPubkey,
            );
            const amountBaseUnits = toCCBaseUnits(cert.amount);

            if (!userPubkey || !mintPubkey || !userATA) {
              throw new Error(
                "One or more required retire accounts are undefined",
              );
            }
            if (!splToken.TOKEN_PROGRAM_ID) {
              throw new Error("Token program ID is undefined");
            }

            const wallet = {
              publicKey: userPubkey,
              signTransaction: async (tx: any) => await signTransaction(tx),
              signAllTransactions: async (txs: any[]) => {
                const signed = [];
                for (const tx of txs) {
                  signed.push(await signTransaction(tx));
                }
                return signed;
              },
            };

            const provider = new anchor.AnchorProvider(
              connection,
              wallet as any,
              { commitment: "confirmed" },
            );
            const program = new anchor.Program(solCarbonIdl as any, provider);

            console.log("[Anchor] Calling retire_credits…");
            const retireSig = await program.methods
              .retireCredits(new anchor.BN(amountBaseUnits.toString()))
              .accountsStrict({
                user: userPubkey,
                mint: mintPubkey,
                userAta: userATA,
                tokenProgram: splToken.TOKEN_PROGRAM_ID,
              } as any)
              .rpc();

            console.log("[Anchor] Retirement confirmed:", retireSig);

            // Burn Metaplex Core NFT (Off-program for now)
            if (cert.tokenId && !cert.tokenId.startsWith("spl-")) {
              try {
                const umi = getUmi();
                const treasuryKp = getTreasuryKeypair();
                umi.use(
                  keypairIdentity(
                    umi.eddsa.createKeypairFromSecretKey(treasuryKp.secretKey),
                  ),
                );
                const asset = await fetchAsset(umi, umiPublicKey(cert.tokenId));
                await burnCoreAsset(umi, { asset }).sendAndConfirm(umi, {
                  confirm: { commitment: "confirmed" },
                });
              } catch (nftErr: any) {
                console.warn(
                  "[Retire] NFT burn failed (non-fatal):",
                  nftErr.message,
                );
              }
            }

            set((s) => {
              const finalCerts = s.nftCertificates.filter(
                (c) => c.id !== certificateId,
              );
              return {
                nftCertificates: finalCerts,
                carbonCredits: finalCerts
                  .filter((c) => c.owner === walletPublicKey)
                  .reduce((sum, c) => sum + c.amount, 0),
                transactions: [
                  {
                    id: Date.now().toString(),
                    type: "retire",
                    amount: cert.amount,
                    pricePerCC: 0,
                    totalSOL: 0,
                    projectName: cert.projectName,
                    timestamp: new Date(),
                    signature: retireSig,
                    status: "completed",
                    owner: walletPublicKey,
                    explorerUrl: getExplorerUrl(retireSig),
                  },
                  ...s.transactions,
                ],
                isLoading: false,
              };
            });

            get().refreshOnChainData(walletPublicKey);
            return retireSig;
          } catch (e: any) {
            console.error("[Retire] Anchor call failed:", e.message);
            set({ isLoading: false });
            throw new Error(e.message || "Retirement failed");
          }
        }
        set({ isLoading: false });
        throw new Error("Wallet not connected.");
      },
    }),
    {
      name: "solcarbon-blockchain-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        listings: state.listings,
        nftCertificates: state.nftCertificates,
      }),
    },
  ),
);
