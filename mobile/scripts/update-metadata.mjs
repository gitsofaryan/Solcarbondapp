import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { updateV1, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';

// ── Configuration ──
const CC_TOKEN_MINT = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa'; 

// Let's use a known, incredibly stable public placeholder JSON from the Solana ecosystem 
// just to prove the token can update successfully and isn't locked.
// Once this works, the user can use the Token Creator UI to upload their own permanent IPFS link.
const SAFE_FALLBACK_URI = 'https://arweave.net/1y_qJjG4E9kH86wXZ_bT0f1xY0T4_V48wA23C7s0zC8';

async function updateMetadata() {
    console.log('🌱 SolCarbon: Forcing stable URI update on Devnet...');
    
    const secretKeyArray = [218,229,227,76,116,116,90,8,3,119,29,192,87,88,23,79,35,55,100,170,161,87,52,243,22,233,2,205,154,79,120,193,58,251,10,16,34,118,232,135,203,53,185,46,189,19,163,86,125,36,143,5,236,224,149,159,250,222,151,136,10,107,103,18];
    const secretKey = new Uint8Array(secretKeyArray);

    const umi = createUmi('https://api.devnet.solana.com');
    const treasuryKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(treasuryKeypair));
    
    console.log(`🔑 Using Treasury Wallet: ${treasuryKeypair.publicKey}`);
    console.log(`🎯 Target Mint: ${CC_TOKEN_MINT}`);

    try {
        const mintPublicKey = umiPublicKey(CC_TOKEN_MINT);
        console.log('Fetching existing metadata...');
        
        // Fetch current metadata to preserve existing creators so we don't get 0x5e Error
        const initialMetadata = await fetchMetadataFromSeeds(umi, { mint: mintPublicKey });
        
        console.log('Sending transaction to Metaplex Token Metadata Program...');
        
        const tx = await updateV1(umi, {
            mint: mintPublicKey,
            authority: umi.identity,
            data: {
              name: 'SolCarbon Credit',
              symbol: 'SOLCC',
              uri: SAFE_FALLBACK_URI,
              sellerFeeBasisPoints: initialMetadata.sellerFeeBasisPoints,
              creators: initialMetadata.creators
            }
        }).sendAndConfirm(umi);
        
        console.log('✅ Success! Token Logo has been updated.');
        console.log(`Image URI: ${SAFE_FALLBACK_URI}`);
        console.log('View on Explorer: https://explorer.solana.com/address/' + CC_TOKEN_MINT + '?cluster=devnet');

    } catch (error) {
        console.error('❌ Failed to update metadata:');
        console.error(error);
    }
}

updateMetadata();
