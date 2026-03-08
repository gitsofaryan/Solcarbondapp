import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplCore } from "@metaplex-foundation/mpl-core";
import { clusterApiUrl } from "@solana/web3.js";
import { SOLANA_NETWORK, CC_TOKEN_MINT, SKR_TOKEN_MINT, EXPLORER_BASE_URL } from '../constants';

// Re-export so callers that import these from here keep working.
export { CC_TOKEN_MINT, SKR_TOKEN_MINT, EXPLORER_BASE_URL };

/** Initialize a Umi instance for the configured Solana network. */
export const getUmi = () => {
  const umi = createUmi(clusterApiUrl(SOLANA_NETWORK));
  umi.use(mplCore());
  return umi;
};

// Official IPFS URIs for NFT metadata since we aren't uploading real files yet
export const OFFICIAL_PROJECT_URIS = {
  RajasthanWind: "https://arweave.net/official_r_wind",
  AssamBamboo: "https://arweave.net/official_a_bamboo",
  GujaratSolar: "https://arweave.net/official_g_solar",
};
