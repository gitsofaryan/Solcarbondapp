import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Connection, PublicKey, clusterApiUrl, Transaction as Web3Tx, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, createTransferInstruction } from '@solana/spl-token';
import { TREASURY_SECRET_KEY, CC_TOKEN_MINT as MINT_ADDRESS } from '../utils/ecosystem';
import { generateSigner, keypairIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { create as createCoreAsset, burn as burnCoreAsset, fetchAsset } from '@metaplex-foundation/mpl-core';
import { createBurnInstruction } from '@solana/spl-token';
import { getUmi, CC_TOKEN_MINT } from '../utils/solana';

export interface CarbonProject {
  id: string;
  name: string;
  location: string;
  pricePerCC: number; // in SOL
  availableCC: number;
  type: string;
  image: string;
  description: string;
  verified: boolean;
  rating: number;
  totalSupply: number;
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
  amount: number;
  mintDate: Date;
  tokenId: string;
  uri: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'retire';
  amount: number;
  pricePerCC: number; // in SOL
  totalSOL: number;
  projectName: string;
  timestamp: Date;
  signature: string;
  status: 'completed' | 'pending' | 'failed';
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

  buyCredits: (amount: number, pricePerCC: number, projectName: string, projectId: string, image: string, walletPublicKey?: string, signTransaction?: any) => Promise<{signature: string, assetId?: string}>;
  sellCredits: (amount: number, pricePerCC: number, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
  retireCredits: (certificateId: string, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
}

const getTreasuryKeypair = () => {
    return Keypair.fromSecretKey(new Uint8Array(TREASURY_SECRET_KEY));
};

const generateSignature = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let sig = '';
  for (let i = 0; i < 88; i++) sig += chars[Math.floor(Math.random() * chars.length)];
  return sig;
};

const delay = () => new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

export const useBlockchainStore = create<BlockchainState>()(
    persist(
        (set, get) => ({
            carbonCredits: 0,
            transactions: [],
            listings: [],
            isLoading: false,
            nftCertificates: [],

            buyCredits: async (amount, pricePerCC, projectName, projectId, image, walletPublicKey, signTransaction) => {
                set({ isLoading: true });
                await delay();

                const totalSOL = amount * pricePerCC;
                const signature = generateSignature();

                const transaction: Transaction = {
                    id: Date.now().toString(),
                    type: 'buy',
                    amount,
                    pricePerCC,
                    totalSOL,
                    projectName,
                    timestamp: new Date(),
                    signature,
                    status: 'completed',
                };

                let umiSig = '';
                if (walletPublicKey && signTransaction) {
                    try {
                        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                        const fromPubkey = new PublicKey(walletPublicKey);
                        const toPubkey = getTreasuryKeypair().publicKey;
                        
                        const lamports = Math.floor(totalSOL * LAMPORTS_PER_SOL);
                        
                        if (lamports > 0) {
                            const transferInstruction = SystemProgram.transfer({
                                fromPubkey,
                                toPubkey,
                                lamports,
                            });

                            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
                            
                            const tx = new Web3Tx({
                                feePayer: fromPubkey,
                                blockhash,
                                lastValidBlockHeight
                            }).add(transferInstruction);

                            const signedTx = await signTransaction(tx);
                            
                            console.log("[Buy] Sending SOL transfer...");
                            const txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
                                skipPreflight: false,
                                preflightCommitment: 'confirmed',
                            });
                            
                            await connection.confirmTransaction({
                                blockhash,
                                lastValidBlockHeight,
                                signature: txSignature
                            }, 'confirmed');
                            
                            console.log("[Buy] SOL Transfer confirmed:", txSignature);
                        }

                        // Initialize Umi and connect it to the Treasury Keypair for minting
                        const umi = getUmi();
                        const treasuryKp = getTreasuryKeypair();
                        const treasurySigner = keypairIdentity(umi.eddsa.createKeypairFromSecretKey(treasuryKp.secretKey));
                        umi.use(treasurySigner);
                        
                        // 1. Mint SPL Tokens (CC)
                        console.log(`[SPL] Initializing SPL Minting to: ${walletPublicKey}`);
                        const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                        const userPubkey = new PublicKey(walletPublicKey);
                        const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);
                        
                        const splTx = new Web3Tx();
                        
                        const ataInfo = await connection.getAccountInfo(userATA);
                        if (!ataInfo) {
                            console.log("[SPL] Creating Associated Token Account for user...");
                            splTx.add(createAssociatedTokenAccountInstruction(
                                toPubkey, // Payer (Treasury)
                                userATA,
                                userPubkey,
                                mintPubkey
                            ));
                        }
                        
                        splTx.add(createMintToInstruction(
                            mintPubkey,
                            userATA,
                            toPubkey, // Authority
                            amount * 100 // CC decimals is 2
                        ));
                        
                        const { blockhash: splBlockhash, lastValidBlockHeight: splLVB } = await connection.getLatestBlockhash('finalized');
                        splTx.recentBlockhash = splBlockhash;
                        splTx.lastValidBlockHeight = splLVB;
                        splTx.feePayer = toPubkey; 
                        
                        splTx.partialSign(treasuryKp);
                        
                        console.log("[SPL] Sending minting transaction...");
                        const splSignature = await connection.sendRawTransaction(splTx.serialize(), {
                            skipPreflight: false,
                            preflightCommitment: 'confirmed',
                        });
                        
                        await connection.confirmTransaction({
                            blockhash: splBlockhash,
                            lastValidBlockHeight: splLVB,
                            signature: splSignature
                        }, 'confirmed');
                        console.log("[SPL] Minting confirmed:", splSignature);

                        // 2. Mint Metaplex Core NFT Certificate
                        const assetSigner = generateSigner(umi);
                        console.log(`[Umi] Minting Core NFT address: ${assetSigner.publicKey}`);
                        
                        const { signature: nftSig } = await createCoreAsset(umi, {
                            asset: assetSigner,
                            name: `Carbon Certificate: ${projectName}`,
                            uri: image,
                            owner: umiPublicKey(walletPublicKey),
                        }).sendAndConfirm(umi);
                        
                        umiSig = nftSig.toString();
                        console.log("[Umi] Core NFT Mint confirmed:", umiSig);
                    } catch (e) {
                        console.warn('Real SOL transfer or Minting failed:', e);
                        set({ isLoading: false });
                        throw e; 
                    }
                }

                set((state) => ({
                    carbonCredits: state.carbonCredits + amount,
                    nftCertificates: [
                        {
                            id: `nft-${Date.now()}`,
                            projectId,
                            projectName,
                            amount,
                            uri: image,
                            tokenId: umiSig || `mock-${Date.now()}`,
                            mintDate: new Date(),
                        },
                        ...state.nftCertificates
                    ],
                    transactions: [transaction, ...state.transactions],
                    isLoading: false,
                }));

                return { signature: signature, assetId: umiSig };
            },

            sellCredits: async (amount, pricePerCC, walletPublicKey, signTransaction) => {
                set({ isLoading: true });
                await new Promise(r => setTimeout(r, 500));
                const state = get();

                if (amount > state.carbonCredits) {
                    set({ isLoading: false });
                    throw new Error('Insufficient carbon credits');
                }

                const totalSOL = amount * pricePerCC;
                const signature = generateSignature();

                if (walletPublicKey) {
                    try {
                        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                        const toPubkey = new PublicKey(walletPublicKey);
                        const treasuryKeypair = getTreasuryKeypair();
                        const fromPubkey = treasuryKeypair.publicKey;
                        
                        const lamports = Math.floor(totalSOL * LAMPORTS_PER_SOL);
                        
                        if (lamports > 0) {
                            console.log("[Sell] Transferring CC tokens from User to Treasury...");
                            const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                            const treasuryATA = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
                            const userATA = await getAssociatedTokenAddress(mintPubkey, toPubkey);

                            const sellTx = new Web3Tx();

                            // Ensure Treasury has an ATA for the CC mint
                            const treasuryATAInfo = await connection.getAccountInfo(treasuryATA);
                            if (!treasuryATAInfo) {
                                sellTx.add(createAssociatedTokenAccountInstruction(
                                    treasuryKeypair.publicKey, // Payer
                                    treasuryATA,
                                    treasuryKeypair.publicKey,
                                    mintPubkey
                                ));
                            }

                            // Transfer CC from user to treasury
                            sellTx.add(createTransferInstruction(
                                userATA,
                                treasuryATA,
                                toPubkey,
                                amount * 100 // CC decimals is 2
                            ));

                            // Also add the SOL transfer instruction in the same block if we want, 
                            // but simpler to keep separate or add back to the same tx.
                            // Let's add the SOL transfer to the user in this same transaction.
                            sellTx.add(SystemProgram.transfer({
                                fromPubkey: fromPubkey,
                                toPubkey: toPubkey,
                                lamports,
                            }));

                            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
                            sellTx.recentBlockhash = blockhash;
                            sellTx.lastValidBlockHeight = lastValidBlockHeight;
                            sellTx.feePayer = fromPubkey;

                            // Treasury signs first
                            sellTx.partialSign(treasuryKeypair);
                            
                            // User signs to authorize CC transfer
                            console.log("[Sell] Requesting user signature for CC transfer and SOL receipt...");
                            const signedSellTx = await signTransaction(sellTx);

                            const txSignature = await connection.sendRawTransaction(signedSellTx.serialize(), {
                                skipPreflight: false,
                                preflightCommitment: 'confirmed',
                            });

                            await connection.confirmTransaction({
                                blockhash,
                                lastValidBlockHeight,
                                signature: txSignature
                            }, 'confirmed');
                            
                            console.log("[Sell] Swap confirmed:", txSignature);
                        }
                    } catch (e) {
                        console.error('[Sell] Return SOL transaction failed', e);
                        set({ isLoading: false });
                        throw new Error('Failed to return SOL on devnet. Are you out of SOL in the Treasury?');
                    }
                }

                const transaction: Transaction = {
                    id: Date.now().toString(),
                    type: 'sell',
                    amount,
                    pricePerCC,
                    totalSOL,
                    projectName: 'Listed on Marketplace',
                    timestamp: new Date(),
                    signature,
                    status: 'completed',
                };

                const listing: Listing = {
                    id: Date.now().toString(),
                    sellerId: 'user',
                    amount,
                    pricePerCC,
                    createdAt: new Date(),
                };

                set({
                    carbonCredits: state.carbonCredits - amount,
                    transactions: [transaction, ...state.transactions],
                    listings: [listing, ...state.listings],
                    isLoading: false,
                });

                return signature;
            },

            retireCredits: async (certificateId, walletPublicKey, signTransaction) => {
                set({ isLoading: true });
                const state = get();
                const certToRetire = state.nftCertificates.find(c => c.id === certificateId);
                if (!certToRetire) {
                    set({ isLoading: false });
                    throw new Error('Certificate not found');
                }

                let burnSig = '';
                if (walletPublicKey && signTransaction) {
                    try {
                        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
                        const userPubkey = new PublicKey(walletPublicKey);
                        const mintPubkey = new PublicKey(CC_TOKEN_MINT);
                        const userATA = await getAssociatedTokenAddress(mintPubkey, userPubkey);
                        
                        const burnTx = new Web3Tx().add(
                            createBurnInstruction(
                                userATA,
                                mintPubkey,
                                userPubkey,
                                certToRetire.amount * 100
                            )
                        );
                        
                        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
                        burnTx.recentBlockhash = blockhash;
                        burnTx.lastValidBlockHeight = lastValidBlockHeight;
                        burnTx.feePayer = userPubkey;
                        
                        console.log("[Retire] Signing burn transaction...");
                        const signedBurnTx = await signTransaction(burnTx);
                        const splBurnSig = await connection.sendRawTransaction(signedBurnTx.serialize());
                        await connection.confirmTransaction({
                            blockhash,
                            lastValidBlockHeight,
                            signature: splBurnSig
                        }, 'confirmed');
                        console.log("[Retire] CC Tokens burned successfully:", splBurnSig);
                        burnSig = splBurnSig;

                        // 2. Burn Metaplex Core NFT
                        // 2. Burn Metaplex Core NFT
                        if (certToRetire.tokenId && !certToRetire.tokenId.startsWith('mock-')) {
                            console.warn(`[Retire] Building Burn instruction for NFT: ${certToRetire.tokenId}`);
                            const umi = getUmi();
                            const asset = await fetchAsset(umi, umiPublicKey(certToRetire.tokenId));

                            const umiInstructions = burnCoreAsset(umi, {
                                asset,
                            }).getInstructions();

                            // Convert Umi Instruction to web3.js TransactionInstruction
                            const web3Instructions = umiInstructions.map(ix => ({
                                programId: new PublicKey(ix.programId.toString()),
                                keys: ix.keys.map(k => ({
                                    pubkey: new PublicKey(k.pubkey.toString()),
                                    isSigner: k.isSigner,
                                    isWritable: k.isWritable,
                                })),
                                data: Buffer.from(ix.data),
                            }));

                            const nftBurnTx = new Web3Tx();
                            web3Instructions.forEach(ix => nftBurnTx.add(ix));

                            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
                            nftBurnTx.recentBlockhash = blockhash;
                            nftBurnTx.lastValidBlockHeight = lastValidBlockHeight;
                            nftBurnTx.feePayer = userPubkey;

                            console.warn("[Retire] Signing NFT burn transaction...");
                            const signedNftBurnTx = await signTransaction(nftBurnTx);
                            const nftBurnSig = await connection.sendRawTransaction(signedNftBurnTx.serialize());
                            
                            await connection.confirmTransaction({
                                blockhash,
                                lastValidBlockHeight,
                                signature: nftBurnSig
                            }, 'confirmed');
                            
                            console.warn("[Retire] Core NFT Asset burned successfully:", nftBurnSig);
                        }
                    } catch (e) {
                        console.error('[Retire] On-chain retirement failed', e);
                        set({ isLoading: false });
                        throw e;
                    }
                }

                const signature = burnSig || generateSignature();
                
                set((state) => ({
                    carbonCredits: state.carbonCredits - certToRetire.amount,
                    nftCertificates: state.nftCertificates.filter(c => c.id !== certificateId),
                    transactions: [
                        {
                            id: Date.now().toString(),
                            type: 'retire',
                            amount: certToRetire.amount,
                            pricePerCC: 0,
                            totalSOL: 0,
                            projectName: certToRetire.projectName,
                            timestamp: new Date(),
                            signature: signature,
                            status: 'completed',
                        }, 
                        ...state.transactions
                    ],
                    isLoading: false,
                }));

                return signature;
            }
        }),
        {
            name: 'solcarbon-blockchain-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                carbonCredits: state.carbonCredits, 
                transactions: state.transactions, 
                listings: state.listings, 
                nftCertificates: state.nftCertificates 
            }),
        }
    )
);
