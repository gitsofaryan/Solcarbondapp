import { Connection, PublicKey, Keypair, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getMint } from '@solana/spl-token';

const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');

const secret = new Uint8Array([218, 229, 227, 76, 116, 116, 90, 8, 3, 119, 29, 192, 87, 88, 23, 79, 35, 55, 100, 170, 161, 87, 52, 243, 22, 233, 2, 205, 154, 79, 120, 193, 58, 251, 10, 16, 34, 118, 232, 135, 203, 53, 185, 46, 189, 19, 163, 86, 125, 36, 143, 5, 236, 224, 149, 159, 250, 222, 151, 136, 10, 107, 103, 18]);
const treasury = Keypair.fromSecretKey(secret);

console.log('\n=== SolCarbon Devnet Diagnostics ===\n');
console.log('Treasury Address :', treasury.publicKey.toBase58());

// 1. Treasury SOL balance
const bal = await conn.getBalance(treasury.publicKey);
console.log('Treasury Balance :', bal / LAMPORTS_PER_SOL, 'SOL', bal < 100_000 ? '⚠️  CRITICAL: Too low to sign transactions' : '✅ OK');

// 2. Token mint existence
const mintAddr = new PublicKey('HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa');
try {
    const mintInfo = await getMint(conn, mintAddr);
    console.log('CC Mint          :', mintAddr.toBase58(), '✅ EXISTS');
    console.log('  Decimals       :', mintInfo.decimals);
    console.log('  Mint Authority :', mintInfo.mintAuthority?.toBase58());
    console.log('  Is Mutable     :', !mintInfo.freezeAuthority);
    const authOk = mintInfo.mintAuthority?.toBase58() === treasury.publicKey.toBase58();
    console.log('  Auth matches   :', authOk ? '✅ Treasury is mint authority' : '❌ Treasury is NOT mint authority!');
} catch (e) {
    console.log('CC Mint          :', mintAddr.toBase58(), '❌ DOES NOT EXIST on devnet!');
    console.log('  →', e.message);
}

// 3. Recent blockhash reachability
try {
    const { blockhash } = await conn.getLatestBlockhash('finalized');
    console.log('RPC Reachable    : ✅ blockhash', blockhash.slice(0, 16) + '...');
} catch (e) {
    console.log('RPC Reachable    : ❌ Failed to fetch blockhash:', e.message);
}

// 4. Airdrop if needed
if (bal < 0.05 * LAMPORTS_PER_SOL) {
    console.log('\n💧 Requesting airdrop (2 SOL)...');
    try {
        const sig = await conn.requestAirdrop(treasury.publicKey, 2 * LAMPORTS_PER_SOL);
        await conn.confirmTransaction(sig, 'confirmed');
        const newBal = await conn.getBalance(treasury.publicKey);
        console.log('✅ Airdrop done! New balance:', newBal / LAMPORTS_PER_SOL, 'SOL');
    } catch (e2) {
        console.log('❌ Airdrop failed (devnet rate limit):', e2.message);
        console.log('👉 Manually fund at: https://faucet.solana.com');
        console.log('   Address:', treasury.publicKey.toBase58());
    }
}
console.log('\n=====================================\n');
