import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createV1 } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Configuration ──
// Use the exact DEVNET Mint Address from our existing app
const CC_TOKEN_MINT = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa'; 

// The Token Metadata details
const TOKEN_METADATA = {
    name: 'SolCarbon Credit',
    symbol: 'SOLCC',
    uri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', // Fallback temporary image until we host our own
};

async function initMetadata() {
    console.log('🌱 SolCarbon: Initializing SPL Token Metadata on Devnet...');
    
    // 1. Load Treasury Keypair (The Mint Authority)
    // Using the exact Uint8Array from src/utils/ecosystem.ts
    const secretKeyArray = [218,229,227,76,116,116,90,8,3,119,29,192,87,88,23,79,35,55,100,170,161,87,52,243,22,233,2,205,154,79,120,193,58,251,10,16,34,118,232,135,203,53,185,46,189,19,163,86,125,36,143,5,236,224,149,159,250,222,151,136,10,107,103,18];
    const secretKey = new Uint8Array(secretKeyArray);

    // 2. Initialize Umi
    const umi = createUmi('https://api.devnet.solana.com');
    const treasuryKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(treasuryKeypair));
    
    console.log(`🔑 Using Treasury Wallet: ${treasuryKeypair.publicKey}`);
    console.log(`🎯 Target Mint: ${CC_TOKEN_MINT}`);

    // 3. Create Metadata Account
    try {
        const mintPublicKey = umiPublicKey(CC_TOKEN_MINT);
        
        console.log('Sending transaction to Metaplex Token Metadata Program...');
        
        const tx = await createV1(umi, {
            mint: mintPublicKey,
            authority: umi.identity,
            name: TOKEN_METADATA.name,
            symbol: TOKEN_METADATA.symbol,
            uri: TOKEN_METADATA.uri,
            sellerFeeBasisPoints: 0,
            tokenStandard: 2, // Fungible Token
        }).sendAndConfirm(umi);
        
        console.log('✅ Success! Metadata attached to Token Mint.');
        console.log(`Name: ${TOKEN_METADATA.name}`);
        console.log(`Symbol: ${TOKEN_METADATA.symbol}`);
        console.log('View on Explorer: https://explorer.solana.com/address/' + CC_TOKEN_MINT + '?cluster=devnet');

    } catch (error) {
        console.error('❌ Failed to create metadata:');
        console.error(error);
    }
}

initMetadata();
