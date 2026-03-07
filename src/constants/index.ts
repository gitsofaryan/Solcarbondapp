/**
 * Central constants for the SolCarbon dApp.
 *
 * Centralising these values means every module imports from one place,
 * making network / address changes a single-line edit instead of a
 * search-and-replace across the whole codebase.
 */

// ── Solana network ────────────────────────────────────────────────────────────

/** The Solana cluster used by this app. Change to 'mainnet-beta' for production. */
export const SOLANA_NETWORK = 'devnet' as const;

// ── On-chain addresses ────────────────────────────────────────────────────────

/** SPL mint address for the Carbon Credit (CC) token. */
export const CC_TOKEN_MINT = 'HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa';

/**
 * Public address of the treasury wallet.
 * This account holds SOL reserves and acts as the SPL mint authority.
 */
export const TREASURY_ADDRESS = '4yEfgUdei5xQUrTwDA79vNTD9dPGS713qocD6XbkZcFB';

// ── Price feed ────────────────────────────────────────────────────────────────

/**
 * Fallback SOL/USD exchange rate.
 * In production this should be replaced by a live oracle (Pyth / Jupiter).
 */
export const SOL_USD_RATE = 140;

// ── Explorer ──────────────────────────────────────────────────────────────────

export const EXPLORER_BASE_URL = 'https://explorer.solana.com';
