import { create } from 'zustand';

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
  type: 'buy' | 'sell';
  amount: number;
  pricePerCC: number;
  projectName: string;
  timestamp: Date;
  signature: string;
  status: 'completed' | 'pending' | 'failed';
}

interface UserProfile {
  name: string;
  type: 'individual' | 'company';
  walletAddress: string;
  joinDate: Date;
}

interface BlockchainState {
  usdcBalance: number;
  carbonCredits: number;
  complianceTarget: number;
  transactions: Transaction[];
  nftCertificates: NFTCertificate[];
  userProfile: UserProfile;
  isLoading: boolean;
  
  // Actions
  buyCredits: (amount: number, pricePerCC: number, projectName: string, projectId: string, projectImage: string) => Promise<string>;
  sellCredits: (amount: number, pricePerCC: number) => Promise<string>;
  autoFillDeficit: (projects: CarbonProject[]) => Promise<string>;
}

// Mock transaction signature generator
const generateSignature = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let signature = '';
  for (let i = 0; i < 88; i++) {
    signature += chars[Math.floor(Math.random() * chars.length)];
  }
  return signature;
};

// Simulate blockchain delay
const simulateBlockchainDelay = () => 
  new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

export const useBlockchainStore = create<BlockchainState>((set, get) => ({
  usdcBalance: 5000,
  carbonCredits: 80,
  complianceTarget: 100,
  transactions: [],
  nftCertificates: [],
  userProfile: {
    name: 'GreenTech Industries',
    type: 'company',
    walletAddress: '7xK9...mP2v',
    joinDate: new Date('2025-01-15'),
  },
  isLoading: false,

  buyCredits: async (amount: number, pricePerCC: number, projectName: string, projectId: string, projectImage: string) => {
    set({ isLoading: true });
    await simulateBlockchainDelay();
    
    const totalCost = amount * pricePerCC;
    const state = get();
    
    if (state.usdcBalance < totalCost) {
      set({ isLoading: false });
      throw new Error('Insufficient USDC balance');
    }
    
    const signature = generateSignature();
    const tokenId = `CC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'buy',
      amount,
      pricePerCC,
      projectName,
      timestamp: new Date(),
      signature,
      status: 'completed',
    };
    
    const nftCert: NFTCertificate = {
      id: Date.now().toString(),
      projectId,
      projectName,
      amount,
      mintDate: new Date(),
      tokenId,
      image: projectImage,
    };
    
    set({
      usdcBalance: state.usdcBalance - totalCost,
      carbonCredits: state.carbonCredits + amount,
      transactions: [transaction, ...state.transactions],
      nftCertificates: [nftCert, ...state.nftCertificates],
      isLoading: false,
    });
    
    return signature;
  },

  sellCredits: async (amount: number, pricePerCC: number) => {
    set({ isLoading: true });
    await simulateBlockchainDelay();
    
    const state = get();
    const surplus = state.carbonCredits - state.complianceTarget;
    
    if (amount > surplus) {
      set({ isLoading: false });
      throw new Error('Cannot sell credits needed for compliance');
    }
    
    const totalRevenue = amount * pricePerCC;
    const signature = generateSignature();
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'sell',
      amount,
      pricePerCC,
      projectName: 'Listed on Marketplace',
      timestamp: new Date(),
      signature,
      status: 'completed',
    };
    
    set({
      usdcBalance: state.usdcBalance + totalRevenue,
      carbonCredits: state.carbonCredits - amount,
      transactions: [transaction, ...state.transactions],
      isLoading: false,
    });
    
    return signature;
  },

  autoFillDeficit: async (projects: CarbonProject[]) => {
    const state = get();
    const deficit = state.complianceTarget - state.carbonCredits;
    
    if (deficit <= 0) {
      throw new Error('No deficit to fill');
    }
    
    // Find cheapest project with enough credits
    const sortedProjects = [...projects].sort((a, b) => a.pricePerCC - b.pricePerCC);
    const selectedProject = sortedProjects.find(p => p.availableCC >= deficit);
    
    if (!selectedProject) {
      throw new Error('No project has enough credits available');
    }
    
    return get().buyCredits(deficit, selectedProject.pricePerCC, selectedProject.name, selectedProject.id, selectedProject.image);
  },
}));