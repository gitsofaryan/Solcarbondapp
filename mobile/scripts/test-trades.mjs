/**
 * SolCarbon Devnet Trade Integration Test
 * Run: node scripts/test-trades.mjs
 *
 * Tests the full buy → sell → retire flow against real devnet.
 * Uses a fresh keypair funded via airdrop as the mock "user".
 */
import { Keypair, Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL, Transaction as Web3Tx, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction, createTransferInstruction, createBurnInstruction, getMint } from '@solana/spl-token';

// ── Config ──────────────────────────────────────────────────────────────────
const TREASURY_SECRET = new Uint8Array([218, 229, 227, 76, 116, 116, 90, 8, 3, 119, 29, 192, 87, 88, 23, 79, 35, 55, 100, 170, 161, 87, 52, 243, 22, 233, 2, 205, 154, 79, 120, 193, 58, 251, 10, 16, 34, 118, 232, 135, 203, 53, 185, 46, 189, 19, 163, 86, 125, 36, 143, 5, 236, 224, 149, 159, 250, 222, 151, 136, 10, 107, 103, 18]);
const CC_MINT_ADDR = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa';
const CC_AMOUNT = 5;   // CC to buy/sell
const PRICE_PER_CC = 0.001; // SOL, small so we don't drain test wallet

// ── Helpers ─────────────────────────────────────────────────────────────────
const conn = new Connection(clusterApiUrl('devnet'), {
    commitment: 'confirmed', confirmTransactionInitialTimeout: 60_000,
});

async function stampAndSend(tx, ...signers) {
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.sign(...signers);
    const sig = await conn.sendRawTransaction(tx.serialize(), {
        skipPreflight: false, preflightCommitment: 'confirmed',
    });
    await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
    return sig;
}

function pass(msg) { console.log('  ✅', msg); }
function fail(msg) { console.error('  ❌', msg); process.exitCode = 1; }
function title(msg) { console.log('\n─────────────────────────────────'); console.log(' ' + msg); console.log('─────────────────────────────────'); }

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
    title('SolCarbon Devnet Trade Test');

    const treasury = Keypair.fromSecretKey(TREASURY_SECRET);
    const user = Keypair.generate();   // fresh test user wallet
    const mintPk = new PublicKey(CC_MINT_ADDR);

    console.log('Treasury :', treasury.publicKey.toBase58());
    console.log('Test User:', user.publicKey.toBase58());

    // ── 0. Pre-flight ──
    title('0. Pre-flight checks');
    const tBal = await conn.getBalance(treasury.publicKey);
    console.log('  Treasury SOL:', tBal / LAMPORTS_PER_SOL);
    if (tBal < 0.1 * LAMPORTS_PER_SOL) { fail('Treasury has insufficient SOL — run init-ecosystem.mjs'); return; }
    pass('Treasury funded');

    // ── 1. Fund test user from treasury (airdrop is rate-limited) ──
    title('1. Fund test user from treasury');
    try {
        const fundTx = new Web3Tx();
        fundTx.feePayer = treasury.publicKey;
        fundTx.add(SystemProgram.transfer({
            fromPubkey: treasury.publicKey,
            toPubkey: user.publicKey,
            lamports: Math.floor(0.5 * LAMPORTS_PER_SOL),
        }));
        const fundSig = await stampAndSend(fundTx, treasury);
        const uBal = await conn.getBalance(user.publicKey);
        pass(`User funded: ${uBal / LAMPORTS_PER_SOL} SOL  (sig: ${fundSig.slice(0, 20)}…)`);
    } catch (e) {
        fail('Funding failed: ' + e.message);
        return;
    }

    // ── 2. Simulate BUY: user pays SOL → treasury mints CC to user ──
    title('2. BUY — SOL payment + SPL mint');
    try {
        const lamports = Math.floor(CC_AMOUNT * PRICE_PER_CC * LAMPORTS_PER_SOL);

        // Step 2a: User pays treasury
        const payTx = new Web3Tx();
        payTx.feePayer = user.publicKey;
        payTx.add(SystemProgram.transfer({
            fromPubkey: user.publicKey, toPubkey: treasury.publicKey, lamports,
        }));
        const paySig = await stampAndSend(payTx, user);
        pass(`SOL payment sent: ${paySig.slice(0, 20)}…`);

        // Step 2b: Treasury mints CC to user's ATA
        const userATA = await getAssociatedTokenAddress(mintPk, user.publicKey);
        const mintTx = new Web3Tx();
        mintTx.feePayer = treasury.publicKey;
        const ataInfo = await conn.getAccountInfo(userATA);
        if (!ataInfo) {
            mintTx.add(createAssociatedTokenAccountInstruction(
                treasury.publicKey, userATA, user.publicKey, mintPk,
            ));
        }
        mintTx.add(createMintToInstruction(mintPk, userATA, treasury.publicKey, CC_AMOUNT * 100));
        const mintSig = await stampAndSend(mintTx, treasury);
        pass(`CC tokens minted: ${mintSig.slice(0, 20)}…`);

    } catch (e) {
        fail('BUY failed: ' + e.message);
        console.error(e);
        return;
    }

    // ── 3. Verify user's CC balance ──
    title('3. Verify CC token balance');
    try {
        const userATA = await getAssociatedTokenAddress(mintPk, user.publicKey);
        const { value: { amount } } = await conn.getTokenAccountBalance(userATA);
        const ccBal = Number(amount) / 100;
        if (ccBal >= CC_AMOUNT) {
            pass(`User CC balance: ${ccBal} CC`);
        } else {
            fail(`Expected >= ${CC_AMOUNT} CC, got ${ccBal}`);
        }
    } catch (e) {
        fail('Balance check failed: ' + e.message);
    }

    // ── 4. Simulate SELL: user transfers CC → treasury, treasury pays SOL ──
    title('4. SELL — CC transfer + SOL payout');
    const sellAmount = Math.floor(CC_AMOUNT / 2); // sell half
    try {
        const userATA = await getAssociatedTokenAddress(mintPk, user.publicKey);
        const treasuryATA = await getAssociatedTokenAddress(mintPk, treasury.publicKey);

        // Step 4a: CC transfer user → treasury (user + treasury sign)
        const sellTx = new Web3Tx();
        sellTx.feePayer = treasury.publicKey; // treasury covers fee
        const tATAInfo = await conn.getAccountInfo(treasuryATA);
        if (!tATAInfo) {
            sellTx.add(createAssociatedTokenAccountInstruction(
                treasury.publicKey, treasuryATA, treasury.publicKey, mintPk,
            ));
        }
        sellTx.add(createTransferInstruction(userATA, treasuryATA, user.publicKey, sellAmount * 100));
        const ccTransferSig = await stampAndSend(sellTx, treasury, user); // both sign
        pass(`CC transfer: ${ccTransferSig.slice(0, 20)}…`);

        // Step 4b: Treasury pays SOL to user
        const payoutLamports = Math.floor(sellAmount * PRICE_PER_CC * LAMPORTS_PER_SOL);
        if (payoutLamports > 0) {
            const payoutTx = new Web3Tx();
            payoutTx.feePayer = treasury.publicKey;
            payoutTx.add(SystemProgram.transfer({
                fromPubkey: treasury.publicKey, toPubkey: user.publicKey, lamports: payoutLamports,
            }));
            const payoutSig = await stampAndSend(payoutTx, treasury);
            pass(`SOL payout: ${payoutSig.slice(0, 20)}… (${payoutLamports} lamports)`);
        }
    } catch (e) {
        fail('SELL failed: ' + e.message);
        console.error(e);
    }

    // ── 5. Simulate RETIRE: user burns remaining CC ──
    title('5. RETIRE — CC token burn');
    try {
        const userATA = await getAssociatedTokenAddress(mintPk, user.publicKey);
        const retireTx = new Web3Tx();
        retireTx.feePayer = user.publicKey;
        retireTx.add(createBurnInstruction(userATA, mintPk, user.publicKey, sellAmount * 100));
        const burnSig = await stampAndSend(retireTx, user);
        pass(`CC tokens burned: ${burnSig.slice(0, 20)}…`);
    } catch (e) {
        fail('RETIRE failed: ' + e.message);
        console.error(e);
    }

    // ── 6. Final balance summary ──
    title('6. Final balances');
    try {
        const userATA = await getAssociatedTokenAddress(mintPk, user.publicKey);
        const ataInfo = await conn.getAccountInfo(userATA);
        if (ataInfo) {
            const { value: { amount } } = await conn.getTokenAccountBalance(userATA);
            console.log(`  User CC remaining : ${Number(amount) / 100} CC`);
        } else {
            console.log('  User CC remaining : 0 CC (ATA closed or empty)');
        }
        const uSolFinal = await conn.getBalance(user.publicKey);
        console.log(`  User SOL remaining: ${uSolFinal / LAMPORTS_PER_SOL} SOL`);
        const tSolFinal = await conn.getBalance(treasury.publicKey);
        console.log(`  Treasury SOL      : ${tSolFinal / LAMPORTS_PER_SOL} SOL`);
    } catch (e) {
        fail('Final balance check: ' + e.message);
    }

    console.log('\n═══════════════════════════════════════');
    if (process.exitCode === 1) {
        console.log('  ❌ Some tests FAILED — check errors above');
    } else {
        console.log('  ✅ All devnet trade tests PASSED!');
    }
    console.log('═══════════════════════════════════════\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
