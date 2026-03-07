// SOL to USD conversion rate
// In production, fetch this from a price feed (e.g., Pyth, Jupiter, CoinGecko)
import { SOL_USD_RATE } from '../constants';

export { SOL_USD_RATE };

export const solToUsd = (sol: number): number => sol * SOL_USD_RATE;

export const formatSolWithUsd = (sol: number): { sol: string; usd: string } => ({
  sol: `◎ ${sol.toFixed(4)}`,
  usd: `≈ $${solToUsd(sol).toFixed(2)}`,
});

export const formatPriceWithUsd = (sol: number): { sol: string; usd: string } => ({
  sol: `◎ ${sol.toFixed(3)}`,
  usd: `≈ $${solToUsd(sol).toFixed(2)}`,
});
