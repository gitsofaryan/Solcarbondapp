/**
 * Treasury keypair secret key — loaded from the TREASURY_SECRET_KEY environment
 * variable (Base58-encoded 64-byte Ed25519 seed).
 *
 * ⚠️  SECURITY NOTICE ⚠️
 * A private key should NEVER be committed to source control in production.
 * Move this value to a server-side secrets manager (AWS Secrets Manager,
 * HashiCorp Vault, etc.) and expose it only to a trusted backend API that
 * co-signs transactions.  The fallback below is a **devnet-only** key for
 * local development and CI.  See .env.example for the expected variable name.
 *
 * Note on environment variable access:
 *  - In Node.js (scripts/): process.env.TREASURY_SECRET_KEY is read at runtime.
 *  - In the Expo app: only EXPO_PUBLIC_* variables are inlined by Metro at
 *    build time.  The plain TREASURY_SECRET_KEY env var will therefore not be
 *    available inside the app bundle.  In production the treasury key MUST be
 *    managed by a server-side API; do not use EXPO_PUBLIC_ for sensitive keys.
 */

import bs58 from 'bs58';
import { CC_TOKEN_MINT } from '../constants';

// Re-export so existing callers that import CC_TOKEN_MINT from here keep working.
export { CC_TOKEN_MINT };

const DEV_SECRET_KEY_B58 =
    '5NqTENoF6UUKNiU6LbueApS4VbrkeV68v7SGrUp34T58uibgTFgMo99udcpqJFUmDrUonx7dtEfrUsAKgSuu4SCR';

/**
 * Returns the treasury keypair bytes on each call.
 * In Node.js scripts the key is read from TREASURY_SECRET_KEY env var when set.
 * The Expo app always uses the devnet fallback — replace this with a
 * server-side signing API before going to mainnet.
 */
export function getTreasurySecretKey(): Uint8Array {
    const envKey =
        (typeof process !== 'undefined' && process.env?.TREASURY_SECRET_KEY) ||
        DEV_SECRET_KEY_B58;
    return bs58.decode(envKey);
}
