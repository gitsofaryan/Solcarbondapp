/**
 * One-time script: calls `initialize_treasury` on the deployed SolCarbon program
 * to create the Treasury PDA on devnet.
 *
 * Usage:  node scripts/init-treasury-pda.mjs
 */
import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

// ── Config ──────────────────────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey(
  "CUmu7iSDj5RavATJnm2Xsrvkjo7iqAb7MeT3GVsgmg7o",
);
const CC_TOKEN_MINT = new PublicKey(
  "HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa",
);

// Load treasury keypair from ecosystem.ts
function loadTreasuryKeypair() {
  const configPath = path.join(process.cwd(), "src", "utils", "ecosystem.ts");
  const content = fs.readFileSync(configPath, "utf-8");
  const match = content.match(/new Uint8Array\(\[(.*?)\]\)/);
  if (!match?.[1])
    throw new Error("Could not parse treasury key from ecosystem.ts");
  return Keypair.fromSecretKey(new Uint8Array(match[1].split(",").map(Number)));
}

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const admin = loadTreasuryKeypair();

  console.log("Program ID :", PROGRAM_ID.toBase58());
  console.log("Admin       :", admin.publicKey.toBase58());
  console.log("CC Mint     :", CC_TOKEN_MINT.toBase58());

  // Derive Treasury PDA  seeds = [b"treasury", mint]
  const [treasuryPDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), CC_TOKEN_MINT.toBuffer()],
    PROGRAM_ID,
  );
  console.log("Treasury PDA:", treasuryPDA.toBase58(), " bump:", bump);

  // Check if already initialized
  const info = await connection.getAccountInfo(treasuryPDA);
  if (info && info.data.length > 0) {
    console.log(
      "\n✅ Treasury PDA already initialized (owner:",
      info.owner.toBase58(),
      ", size:",
      info.data.length,
      "bytes).",
    );
    return;
  }

  // Build the initialize_treasury instruction manually
  // Discriminator = sha256("global:initialize_treasury")[0..8]
  const disc = createHash("sha256")
    .update("global:initialize_treasury")
    .digest()
    .subarray(0, 8);

  // Space = 8 (discriminator) + 32 (admin) + 32 (mint) + 1 (bump) = 73
  const space = 73;
  const rentExempt = await connection.getMinimumBalanceForRentExemption(space);

  console.log(
    "\nRent-exempt minimum:",
    rentExempt,
    "lamports for",
    space,
    "bytes",
  );

  // Check admin balance
  const balance = await connection.getBalance(admin.publicKey);
  console.log("Admin balance:", balance / 1e9, "SOL");
  if (balance < rentExempt + 10000) {
    console.error(
      "❌ Not enough SOL. Need at least",
      (rentExempt + 10000) / 1e9,
      "SOL. Airdrop first.",
    );
    process.exit(1);
  }

  const keys = [
    { pubkey: admin.publicKey, isSigner: true, isWritable: true }, // admin
    { pubkey: treasuryPDA, isSigner: false, isWritable: true }, // treasury_state
    { pubkey: CC_TOKEN_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
  ];

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: disc, // no args
  });

  const tx = new Transaction().add(ix);
  tx.feePayer = admin.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.sign(admin);

  console.log("\n📤 Sending initialize_treasury transaction…");
  const sig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
  });
  console.log("Signature:", sig);
  await connection.confirmTransaction(sig, "confirmed");
  console.log("✅ Treasury PDA initialized successfully!");
  console.log(`Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message || err);
  if (err.logs) console.error("Logs:", err.logs);
  process.exit(1);
});
