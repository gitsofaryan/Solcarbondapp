import { create } from 'zustand';
import { Connection, PublicKey, clusterApiUrl, Transaction as Web3Tx, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { TREASURY_SECRET_KEY } from '../utils/ecosystem';
import { generateSigner } from '@metaplex-foundation/umi';
import { create as createCoreAsset } from '@metaplex-foundation/mpl-core';
import { getUmi } from '../utils/solana';

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
  image: string;
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
    // NFT Certificates
    nftCertificates: {
        id: string;
        projectId: string;
        projectName: string;
        amount: number;
        uri: string;
    }[];

    buyCredits: (amount: number, pricePerCC: number, projectName: string, projectId: string, image: string, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
    sellCredits: (amount: number, pricePerCC: number, walletPublicKey?: string, signTransaction?: any) => Promise<string>;
    retireCredits: (certificateId: string) => Promise<string>;
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

export const useBlockchainStore = create<BlockchainState>((set, get) => ({
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

        // In a real app, this would be a single atomic Anchor transaction that:
        // 1. Transfers SOL to project treasury
        // 2. Mints/transfers SPL CC tokens to buyer
        // 3. Mints a Metaplex Core NFT certificate to buyer

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

                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                    
                    const tx = new Web3Tx({
                        feePayer: fromPubkey,
                        blockhash,
                        lastValidBlockHeight
                    }).add(transferInstruction);

                    const signedTx = await signTransaction(tx);
                    const txSignature = await connection.sendRawTransaction(signedTx.serialize());
                    
                    await connection.confirmTransaction({
                        blockhash,
                        lastValidBlockHeight,
                        signature: txSignature
                    });
                    
                    console.log("[Buy] SOL Transfer confirmed:", txSignature);
                }

                // Initialize Umi and connect it to the user's wallet adapter
                const umi = getUmi();
                // We use a mock signer here for simulation since we can't easily pass the full adapter
                // In production: umi.use(walletAdapterIdentity(wallet));
                
                // For this demo, we'll just simulate the NFT data structure in state
                // since we don't have the actual wallet adapter instance in the store
                const assetSigner = generateSigner(umi);
                console.log(`[Umi] Would mint Core NFT address: ${assetSigner.publicKey}`);
                umiSig = 'mock-nft-mint-sig-' + Date.now();
            } catch (e) {
                console.warn('Real SOL transfer or Umi mint simulation failed:', e);
                set({ isLoading: false });
                throw e; // Stop the simulated operation if the real one fails
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
                    uri: image, // Using project image as mock URI for now
                },
                ...state.nftCertificates
            ],
            transactions: [transaction, ...state.transactions],
      isLoading: false,
    }));

    return signature;
  },

  sellCredits: async (amount, pricePerCC, walletPublicKey, signTransaction) => {
    set({ isLoading: true });
    
    // Minimal delay to ensure loading state shows
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
              const transferInstruction = SystemProgram.transfer({
                  fromPubkey,
                  toPubkey,
                  lamports,
              });

              const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
              
              const tx = new Web3Tx({
                  feePayer: fromPubkey,
                  blockhash,
                  lastValidBlockHeight
              }).add(transferInstruction);

              // Treasury signs its own transaction to send SOL back
              tx.sign(treasuryKeypair);
              
              const txSignature = await connection.sendRawTransaction(tx.serialize());
              
              await connection.confirmTransaction({
                  blockhash,
                  lastValidBlockHeight,
                  signature: txSignature
              });
              
              console.log("[Sell] SOL Transfer returned to user:", txSignature);
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

  retireCredits: async (certificateId) => {
    set({ isLoading: true });
    await delay();

    const signature = generateSignature();
    
    set((state) => {
        const certToRetire = state.nftCertificates.find(c => c.id === certificateId);
        if (!certToRetire) return { isLoading: false };

        const transaction: Transaction = {
            id: Date.now().toString(),
            type: 'retire',
            amount: certToRetire.amount,
            pricePerCC: 0,
            totalSOL: 0,
            projectName: certToRetire.projectName,
            timestamp: new Date(),
            signature: signature,
            status: 'completed',
        };

        return {
            carbonCredits: state.carbonCredits - certToRetire.amount,
            nftCertificates: state.nftCertificates.filter(c => c.id !== certificateId),
            transactions: [transaction, ...state.transactions],
            isLoading: false,
        };
    });

    return signature;
  }
}));
