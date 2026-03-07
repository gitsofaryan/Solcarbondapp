import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { clusterApiUrl } from '@solana/web3.js';

// Initialize Umi for Devnet
export const getUmi = () => {
  const umi = createUmi(clusterApiUrl('devnet'));
  umi.use(mplCore());
  return umi;
};

// Hardcoded for Devnet (you would generate this once and save it)
// We will generate a real one in the next step and paste it here
export const CC_TOKEN_MINT = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa';

// Mock IPFS URIs for NFT metadata since we aren't uploading real files yet
export const MOCK_NFT_URIS = {
  RajasthanWind: 'https://arweave.net/mock_r_wind',
  AssamBamboo: 'https://arweave.net/mock_a_bamboo',
  GujaratSolar: 'https://arweave.net/mock_g_solar',
};
