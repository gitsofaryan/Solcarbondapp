import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Connection, PublicKey, clusterApiUrl, Transaction as Web3Tx,
    SystemProgram, LAMPORTS_PER_SOL, Keypair,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    createTransferInstruction,
    createBurnInstruction,
} from '@solana/spl-token';
import { TREASURY_SECRET_KEY, CC_TOKEN_MINT as MINT_ADDRESS } from '../utils/ecosystem';
import { generateSigner, keypairIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { create as createCoreAsset, burn as burnCoreAsset, fetchAsset } from '@metaplex-foundation/mpl-core';
import { getUmi, CC_TOKEN_MINT } from '../utils/solana';
import bs58 from 'bs58';

// ─── Types ───────────────────────────────────────────────────────────────────
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
    type: 'buy' | 'sell' | 'retire';
    amount: number;
    pricePerCC: number;
    totalSOL: number;
    projectName: string;
    purchasingFirm?: string;
    timestamp: Date;
    signature: string;
    status: 'completed' | 'pending' | 'failed';
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

    buyCredits: (amount: number, pricePerCC: number, projectName: string, projectId: string, image: string, walletPublicKey?: string, signTransaction?: any, purchasingFirm?: string) => Promise<{ signature: string; assetId?: string }>;
    sellCredits: (amount: number, pricePerCC: number, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
    retireCredits: (certificateId: string, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
    refreshOnChainData: (walletPublicKey: string) => Promise<void>;
    resetState: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTreasuryKeypair = () => Keypair.fromSecretKey(new Uint8Array(TREASURY_SECRET_KEY));



const getExplorerUrl = (signature: string, type: 'tx' | 'address' = 'tx') => 
    `https://explorer.solana.com/${type}/${signature}?cluster=devnet`;

/** Build a devnet Connection with a slightly higher timeout for stability */
const makeConnection = () => new Connection(clusterApiUrl('devnet'), {
    commitment: 'confirmed',
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
                preflightCommitment: 'confirmed',
                maxRetries: 3,
            });
            return sig;
        } catch (e: any) {
            const transient = e?.message?.includes('blockhash')
                || e?.message?.includes('node is behind')
                || e?.message?.includes('rate limit');
            if (transient && attempt < retries - 1) {
                console.warn(`[sendWithRetry] attempt ${attempt + 1} failed, retrying…`, e.message);
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            } else {
                throw e;
            }
        }
    }
    throw new Error('sendWithRetry: exhausted retries');
}

/**
 * Fetch a fresh blockhash and stamp it onto the tx.
 * Uses 'finalized' commitment so the blockhash is always valid.
 */
async function stampBlockhash(connection: Connection, tx: Web3Tx) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
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
                // We no longer fetch SPL token balance to avoid "ghost" numbers.
                // Portfolio is now derived from NFT certificates in the UI.
                if (!walletPublicKey) return;
                console.log('[Sync] Refreshing data for:', walletPublicKey);
            },

            // ── BUY ─────────────────────────────────────────────────────────
            buyCredits: async (amount, pricePerCC, projectName, projectId, image, walletPublicKey, signTransaction, purchasingFirm = 'Individual Collector') => {
                set({ isLoading: true });

                const totalSOL = amount * pricePerCC;


                // ── REAL ON-CHAIN PATH ──
                if (walletPublicKey && signTransaction) {
                    try {
                        const connection = makeConnection();
                        const treasuryKp = getTreasuryKeypair();
                        const fromPubkey = new PublicKey(walletPublicKey);
                        const toPubkey = treasuryKp.publicKey;

                        // ── Step 1: SOL payment (user → treasury) ──
                        const lamports = Math.floor(totalSOL * LAMPORTS_PER_SOL);
                        if (lamports > 0) {
                            const payTx = new Web3Tx();
                            payTx.feePayer = fromPubkey;
                            payTx.add(SystemProgram.transfer({ fromPubkey, toPubkey, lamports }));
                            await stampBlockhash(connection, payTx);

                            console.log('[Buy] Requesting user signature for SOL payment…');
                            const signedPayTx = await signTransaction(payTx);

                            console.log('[Buy] Sending SOL payment…');
                            const paySig = await sendWithRetry(connection, signedPayTx);
                            await connection.confirmTransaction({
                                signature: paySig,
                                blockhash: payTx.recentBlockhash!,
                                lastValidBlockHeight: (payTx as any).lastValidBlockHeight,
                            }, 'confirmed');
                            console.log('[Buy] SOL payment confirmed:', paySig);
                        }

                        // ── Step 2: SPL CC token mint (treasury → user ATA) ──
                        const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                        const userPubkey = new PublicKey(walletPublicKey);
                        const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);

                        const mintTx = new Web3Tx();
                        mintTx.feePayer = toPubkey; // treasury pays the fee

                        const ataInfo = await connection.getAccountInfo(userATA);
                        if (!ataInfo) {
                            console.log('[SPL] Creating ATA for user…');
                            mintTx.add(createAssociatedTokenAccountInstruction(
                                toPubkey,  // payer
                                userATA,
                                userPubkey,
                                mintPubkey,
                            ));
                        }

                        mintTx.add(createMintToInstruction(
                            mintPubkey,
                            userATA,
                            toPubkey,          // mint authority = treasury
                            amount * 100,      // 2 decimals
                        ));

                        await stampBlockhash(connection, mintTx);
                        // Treasury is the only signer needed here
                        mintTx.sign(treasuryKp);

                        console.log('[SPL] Sending mint transaction…');
                        const mintSig = await sendWithRetry(connection, mintTx);
                        await connection.confirmTransaction({
                            signature: mintSig,
                            blockhash: mintTx.recentBlockhash!,
                            lastValidBlockHeight: (mintTx as any).lastValidBlockHeight,
                        }, 'confirmed');
                        console.log('[SPL] Mint confirmed:', mintSig);

                        // ── Step 3: Metaplex Core NFT certificate ──
                        let umiSig = '';
                        try {
                            const umi = getUmi();
                            const treasurySigner = keypairIdentity(
                                umi.eddsa.createKeypairFromSecretKey(treasuryKp.secretKey),
                            );
                            umi.use(treasurySigner);

                            const assetSigner = generateSigner(umi);
                            console.log('[Umi] Minting Core NFT:', assetSigner.publicKey);

                            const { signature: nftSig } = await createCoreAsset(umi, {
                                asset: assetSigner,
                                name: `Carbon Certificate: ${projectName}`,
                                uri: image,
                                owner: umiPublicKey(walletPublicKey),
                                plugins: [
                                    {
                                        type: 'Attributes',
                                        attributeList: [
                                            { key: 'Project', value: projectName },
                                            { key: 'Amount', value: `${amount} CC` },
                                            { key: 'Minter', value: walletPublicKey || 'Unknown' },
                                            { key: 'Purchasing Firm', value: purchasingFirm || 'Individual' },
                                        ],
                                    },
                                ],
                            }).sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });

                            umiSig = bs58.encode(nftSig);
                            console.log('[Umi] Core NFT confirmed:', umiSig.slice(0, 20) + '…');
                        } catch (nftErr: any) {
                            // NFT mint is non-critical — log and continue with SPL-only purchase
                            console.warn('[Umi] NFT mint failed (non-fatal):', nftErr.message);
                        }

                        // ── Commit to local state ──
                        const txRecord: Transaction = {
                            id: Date.now().toString(),
                            type: 'buy',
                            amount,
                            pricePerCC,
                            totalSOL,
                            projectName,
                            purchasingFirm,
                            timestamp: new Date(),
                            signature: mintSig,
                            status: 'completed',
                            owner: walletPublicKey, // Identity scoping
                            explorerUrl: getExplorerUrl(mintSig),
                        };

                        set(state => ({
                            nftCertificates: [{
                                id: `nft-${Date.now()}`,
                                projectId,
                                projectName,
                                purchasingFirm,
                                amount,
                                uri: image,
                                tokenId: umiSig || mintSig,
                                mintDate: new Date(),
                                owner: walletPublicKey, // Identity scoping
                            }, ...state.nftCertificates],
                            transactions: [txRecord, ...state.transactions],
                            isLoading: false,
                        }));

                        // Sync real balance immediately after
                        get().refreshOnChainData(walletPublicKey);

                        return { signature: mintSig, assetId: umiSig };

                    } catch (e: any) {
                        console.error('[Buy] On-chain transaction failed:', e.message);
                        set({ isLoading: false });
                        throw new Error(e.message || 'Transaction failed on devnet');
                    }
                }

                set({ isLoading: false });
                throw new Error('Wallet not connected. Real Devnet transaction required.');
            },

            // ── SELL ─────────────────────────────────────────────────────────
            sellCredits: async (amount, pricePerCC, walletPublicKey, signTransaction) => {
                set({ isLoading: true });
                const state = get();

                if (amount > state.carbonCredits) {
                    set({ isLoading: false });
                    throw new Error('Insufficient carbon credits');
                }

                const totalSOL = amount * pricePerCC;


                if (walletPublicKey && signTransaction) {
                    try {
                        const connection = makeConnection();
                        const treasuryKp = getTreasuryKeypair();
                        const userPubkey = new PublicKey(walletPublicKey);
                        const toPubkey = treasuryKp.publicKey;

                        // ── Step 1: Transfer CC tokens from user → treasury ──
                        const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                        const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);
                        const treasuryATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);

                        const sellTx = new Web3Tx();
                        sellTx.feePayer = toPubkey; // treasury pays fees on sell too

                        const treasuryATAInfo = await connection.getAccountInfo(treasuryATA);
                        if (!treasuryATAInfo) {
                            sellTx.add(createAssociatedTokenAccountInstruction(
                                toPubkey, treasuryATA, toPubkey, mintPubkey,
                            ));
                        }

                        // User transfers CC to treasury
                        sellTx.add(createTransferInstruction(
                            userATA, treasuryATA, userPubkey, amount * 100,
                        ));

                        await stampBlockhash(connection, sellTx);

                        // User signs to authorize the CC transfer
                        console.log('[Sell] Requesting user signature for CC transfer…');
                        const userSignedTx = await signTransaction(sellTx);

                        // Treasury also needs to sign (it's feePayer + owns destination ATA on inst.)
                        userSignedTx.partialSign(treasuryKp);

                        console.log('[Sell] Sending CC transfer…');
                        const ccSig = await sendWithRetry(connection, userSignedTx);
                        await connection.confirmTransaction({
                            signature: ccSig,
                            blockhash: sellTx.recentBlockhash!,
                            lastValidBlockHeight: (sellTx as any).lastValidBlockHeight,
                        }, 'confirmed');
                        console.log('[Sell] CC transfer confirmed:', ccSig);

                        // ── Step 2: SOL payout from treasury → user ──
                        const lamports = Math.floor(totalSOL * LAMPORTS_PER_SOL);
                        if (lamports > 0) {
                            const payoutTx = new Web3Tx();
                            payoutTx.feePayer = toPubkey;
                            payoutTx.add(SystemProgram.transfer({
                                fromPubkey: toPubkey,
                                toPubkey: userPubkey,
                                lamports,
                            }));
                            await stampBlockhash(connection, payoutTx);
                            payoutTx.sign(treasuryKp);

                            console.log('[Sell] Sending SOL payout…');
                            const payoutSig = await sendWithRetry(connection, payoutTx);
                            await connection.confirmTransaction({
                                signature: payoutSig,
                                blockhash: payoutTx.recentBlockhash!,
                                lastValidBlockHeight: (payoutTx as any).lastValidBlockHeight,
                            }, 'confirmed');
                            console.log('[Sell] Payout confirmed:', payoutSig);
                        }

                        const listing: Listing = {
                            id: Date.now().toString(),
                            sellerId: walletPublicKey,
                            amount,
                            pricePerCC,
                            createdAt: new Date(),
                        };

                        set(s => ({
                            transactions: [{
                                id: Date.now().toString(),
                                type: 'sell',
                                amount,
                                pricePerCC,
                                totalSOL,
                                projectName: 'Sold on Marketplace',
                                timestamp: new Date(),
                                signature: ccSig,
                                status: 'completed',
                                owner: walletPublicKey, // Identity scoping
                                explorerUrl: getExplorerUrl(ccSig),
                            }, ...s.transactions],
                            listings: [listing, ...s.listings],
                            isLoading: false,
                        }));

                        // Sync real balance immediately after
                        get().refreshOnChainData(walletPublicKey);

                        return ccSig;
                    } catch (e: any) {
                        console.error('[Sell] On-chain transaction failed:', e.message);
                        set({ isLoading: false });
                        throw new Error(e.message || 'Sell transaction failed on devnet');
                    }
                }

                set({ isLoading: false });
                throw new Error('Wallet not connected. Real Devnet transaction required.');
            },

            // ── RETIRE ───────────────────────────────────────────────────────
            retireCredits: async (certificateId, walletPublicKey, signTransaction) => {
                set({ isLoading: true });
                const state = get();
                const cert = state.nftCertificates.find(c => c.id === certificateId);
                if (!cert) {
                    set({ isLoading: false });
                    throw new Error('Certificate not found');
                }

                let burnSig = '';

                if (walletPublicKey && signTransaction) {
                    try {
                        const connection = makeConnection();
                        const userPubkey = new PublicKey(walletPublicKey);
                        const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                        const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);

                        // ── Step 1: Burn SPL CC tokens ──
                        const burnTx = new Web3Tx();
                        burnTx.feePayer = userPubkey;
                        burnTx.add(createBurnInstruction(
                            userATA, mintPubkey, userPubkey, cert.amount * 100,
                        ));
                        await stampBlockhash(connection, burnTx);

                        console.log('[Retire] Requesting signature for CC burn…');
                        const signedBurnTx = await signTransaction(burnTx);

                        console.log('[Retire] Burning CC tokens…');
                        const splBurnSig = await sendWithRetry(connection, signedBurnTx);
                        await connection.confirmTransaction({
                            signature: splBurnSig,
                            blockhash: burnTx.recentBlockhash!,
                            lastValidBlockHeight: (burnTx as any).lastValidBlockHeight,
                        }, 'confirmed');
                        console.log('[Retire] CC tokens burned:', splBurnSig);
                        burnSig = splBurnSig;

                        // ── Step 2: Burn Metaplex Core NFT (if real tokenId) ──
                        if (cert.tokenId && !cert.tokenId.startsWith('spl-')) {
                            try {
                                const umi = getUmi();
                                const treasuryKp = getTreasuryKeypair();
                                umi.use(keypairIdentity(umi.eddsa.createKeypairFromSecretKey(treasuryKp.secretKey)));

                                const asset = await fetchAsset(umi, umiPublicKey(cert.tokenId));
                                await burnCoreAsset(umi, { asset })
                                    .sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });
                                console.log('[Retire] Core NFT burned, asset:', cert.tokenId);
                            } catch (nftErr: any) {
                                console.warn('[Retire] NFT burn failed (non-fatal):', nftErr.message);
                            }
                        }

                    } catch (e: any) {
                        console.error('[Retire] On-chain burn failed:', e.message);
                        set({ isLoading: false });
                        throw new Error(e.message || 'Retirement failed on devnet');
                    }
                } else {
                    set({ isLoading: false });
                    throw new Error('Wallet not connected. Real Devnet transaction required.');
                }

                const sig = burnSig;


                set(s => ({
                    nftCertificates: s.nftCertificates.filter(c => c.id !== certificateId),
                    transactions: [{
                        id: Date.now().toString(),
                        type: 'retire',
                        amount: cert.amount,
                        pricePerCC: 0,
                        totalSOL: 0,
                        projectName: cert.projectName,
                        timestamp: new Date(),
                        signature: sig,
                        status: 'completed',
                        owner: walletPublicKey || '', // Identity scoping
                        explorerUrl: getExplorerUrl(sig),
                    }, ...s.transactions],
                    isLoading: false,
                }));

                // Sync real balance immediately after
                get().refreshOnChainData(walletPublicKey);

                return sig;
            },
        }),
        {
            name: 'solcarbon-blockchain-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                transactions: state.transactions,
                listings: state.listings,
                nftCertificates: state.nftCertificates,
            }),
        },
    ),
);
