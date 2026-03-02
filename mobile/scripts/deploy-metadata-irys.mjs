import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys';
import { createGenericFile } from '@metaplex-foundation/umi';
import { updateV1, fetchMetadataFromSeeds } from '@metaplex-foundation/mpl-token-metadata';
import { keypairIdentity, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import fs from 'fs';
import path from 'path';

// ── Configuration ──
const CC_TOKEN_MINT = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa'; 

async function deployMetadata() {
    console.log('🌱 SolCarbon: Deploying Logo & Metadata to Arweave (Irys)...');
    
    const secretKeyArray = [218,229,227,76,116,116,90,8,3,119,29,192,87,88,23,79,35,55,100,170,161,87,52,243,22,233,2,205,154,79,120,193,58,251,10,16,34,118,232,135,203,53,185,46,189,19,163,86,125,36,143,5,236,224,149,159,250,222,151,136,10,107,103,18];
    const secretKey = new Uint8Array(secretKeyArray);

    const umi = createUmi('https://api.devnet.solana.com');
    const treasuryKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    umi.use(keypairIdentity(treasuryKeypair));
    umi.use(irysUploader()); // Use Irys perfectly configured for Devnet!
    
    console.log(`🔑 Using Treasury Wallet: ${treasuryKeypair.publicKey}`);
    
    try {
        // 1. Upload Logo Image
        console.log('Uploading Logo Image to Arweave...');
        const imagePath = path.join(process.cwd(), 'assets', 'solcarbon-logo.png');
        const imageFile = fs.readFileSync(imagePath);
        const genericImageFile = createGenericFile(imageFile, 'solcarbon-logo.png', {
            contentType: 'image/png',
        });
        const [imageUri] = await umi.uploader.upload([genericImageFile]);
        console.log(`✅ Image Uploaded: ${imageUri}`);

        // 2. Upload JSON Metadata
        console.log('Uploading JSON Metadata to Arweave...');
        const metadataUri = await umi.uploader.uploadJson({
            name: "SolCarbon Credit",
            symbol: "SOLCC",
            description: "The official SolCarbon Carbon Credit Token on Solana.",
            image: imageUri
        });
        console.log(`✅ JSON Metadata Uploaded: ${metadataUri}`);

        // 3. Update Token Metadata on Devnet
        const mintPublicKey = umiPublicKey(CC_TOKEN_MINT);
        console.log('Fetching existing on-chain metadata...');
        const initialMetadata = await fetchMetadataFromSeeds(umi, { mint: mintPublicKey });
        
        console.log('Sending transaction to Metaplex Token Metadata Program...');
        await updateV1(umi, {
            mint: mintPublicKey,
            authority: umi.identity,
            data: {
              name: "SolCarbon Credit",
              symbol: "SOLCC",
              uri: metadataUri,
              sellerFeeBasisPoints: initialMetadata.sellerFeeBasisPoints,
              creators: initialMetadata.creators
            }
        }).sendAndConfirm(umi);
        
        console.log('🎉 Success! Token Logo has been permanently embedded on Arweave.');
        console.log(`Image URI: ${imageUri}`);
        console.log(`JSON  URI: ${metadataUri}`);
        console.log('View on Explorer: https://explorer.solana.com/address/' + CC_TOKEN_MINT + '?cluster=devnet');

    } catch (error) {
        console.error('❌ Failed to deploy metadata:');
        console.error(error);
    }
}

deployMetadata();
