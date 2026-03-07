// SOL to USD conversion rate
// In production, fetch this from a price feed (e.g., Pyth, Jupiter, CoinGecko)
export const SOL_USD_RATE = 140; // 1 SOL ≈ $140 USD

export const solToUsd = (sol: number): number => sol * SOL_USD_RATE;

export const formatSolWithUsd = (sol: number): { sol: string; usd: string } => ({
  sol: `◎ ${sol.toFixed(4)}`,
  usd: `≈ $${solToUsd(sol).toFixed(2)}`,
});

export const formatPriceWithUsd = (sol: number): { sol: string; usd: string } => ({
  sol: `◎ ${sol.toFixed(3)}`,
  usd: `≈ $${solToUsd(sol).toFixed(2)}`,
});
