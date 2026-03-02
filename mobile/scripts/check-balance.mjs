import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

async function checkBalance() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const publicKey = new PublicKey('4yEfgUdei5xQUrTwDA79vNTD9dPGS713qocD6XbkZcFB');
  const balance = await connection.getBalance(publicKey);
  console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
}

checkBalance().catch(console.error);
