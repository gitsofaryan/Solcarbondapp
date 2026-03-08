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
 * SKR — Solana Mobile ecosystem token (mainnet).
 * Official CA from https://www.solanamobile.com/skr
 */
export const SKR_TOKEN_MINT = 'SKRtRYQEhfQ47gCA6hcyqXjBRJJpZgKGnoiSmJPXB3s';

/**
 * Public address of the treasury PDA wallet.
 * This account holds SOL reserves and acts as the SPL mint authority.
 */
export const TREASURY_ADDRESS = 'EM1yn6t5cbyQWSeNmQziqRVhgnjPASZEF92MM8sgMaK4';

// ── Price feed ────────────────────────────────────────────────────────────────

/**
 * Fallback SOL/USD exchange rate.
 * In production this should be replaced by a live oracle (Pyth / Jupiter).
 */
export const SOL_USD_RATE = 140;

// ── Explorer ──────────────────────────────────────────────────────────────────

export const EXPLORER_BASE_URL = 'https://explorer.solana.com';
