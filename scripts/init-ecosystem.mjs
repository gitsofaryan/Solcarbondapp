import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const CONFIG_PATH = path.join(process.cwd(), 'src', 'utils', 'ecosystem.ts');

function loadOrCreateTreasury() {
  if (fs.existsSync(CONFIG_PATH)) {
    const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const match = content.match(/new Uint8Array\(\[(.*?)\]\)/);
    if (match && match[1]) {
      const secret = new Uint8Array(match[1].split(',').map(Number));
      const kp = Keypair.fromSecretKey(secret);
      console.log('✅ Loaded existing Treasury Keypair.');
      return { keypair: kp, isNew: false, content };
    }
  }
  const kp = Keypair.generate();
  console.log('🆕 Generated new Treasury Keypair.');
  return { keypair: kp, isNew: true, content: '' };
}

async function main() {
  console.log('🚀 Initializing SolCarbon Ecosystem on Devnet...');

  const { keypair: treasuryKeypair, isNew, content } = loadOrCreateTreasury();
  console.log(`\n🏦 Treasury Public Key: ${treasuryKeypair.publicKey.toBase58()}`);

  if (isNew) {
    fs.writeFileSync(CONFIG_PATH, `// Auto-generated
export const TREASURY_SECRET_KEY = new Uint8Array([${treasuryKeypair.secretKey.join(',')}]);
export const CC_TOKEN_MINT = '';
`);
    console.log(`💾 Saved Treasury key to ${CONFIG_PATH}`);
  }

  // Check balance
  let balance = await connection.getBalance(treasuryKeypair.publicKey);
  console.log(`\n💰 Current Treasury Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  if (balance < 0.1 * LAMPORTS_PER_SOL) {
    console.log('💧 Requesting 1 SOL airdrop to Treasury...');
    try {
      const airdropSig = await connection.requestAirdrop(
        treasuryKeypair.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig, 'confirmed');
      console.log('✅ Airdrop successful!');
    } catch (err) {
      console.log('\n❌ Auto-Airdrop Failed (Devnet rate limit).');
      console.log(`\n⚠️  ACTION REQUIRED: Please go to https://faucet.solana.com 
      and airdrop 1 SOL to this address: ${treasuryKeypair.publicKey.toBase58()}\n`);
      console.log('Waiting 15 seconds to check balance again...');
      await new Promise(r => setTimeout(r, 15000));
    }
    
    balance = await connection.getBalance(treasuryKeypair.publicKey);
    console.log(`💰 New Treasury Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  }

  if (balance < 0.05 * LAMPORTS_PER_SOL) {
     console.log('⚠️ Insufficient SOL to create mint. Please run this script again after funding.');
     return;
  }

  // Check if Mint already exists
  if (content.includes("CC_TOKEN_MINT = '") && !content.includes("CC_TOKEN_MINT = ''")) {
      console.log('✅ CC Token Mint already exists in config. Skipping creation.');
      return;
  }

  // Create Carbon Credit (CC) SPL Token Mint
  console.log('\n🪙 Creating CC Token Mint...');
  const ccMint = await createMint(
    connection,
    treasuryKeypair,           // Payer
    treasuryKeypair.publicKey, // Mint Authority
    treasuryKeypair.publicKey, // Freeze Authority
    2                          // Decimals
  );
  console.log(`✅ CC Token Mint created: ${ccMint.toBase58()}`);

  // Save full config
  const finalConfig = `// Auto-generated
export const TREASURY_SECRET_KEY = new Uint8Array([${treasuryKeypair.secretKey.join(',')}]);
export const CC_TOKEN_MINT = '${ccMint.toBase58()}';
`;
  fs.writeFileSync(CONFIG_PATH, finalConfig);
  console.log(`\n💾 Saved final config to: ${CONFIG_PATH}`);
  console.log('\n🎉 Setup Complete!');
}

main().catch(console.error);
