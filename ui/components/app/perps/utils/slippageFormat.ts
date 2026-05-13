import { PERPS_SLIPPAGE_MAX_PCT } from '../constants';

// Format a slippage percent for display in the order summary.
// `<0.01` returns "<0.01%" so a tight-book non-zero estimate never reads as
// "0.00%". `null` (no book / not enough size) returns "—" to distinguish
// "unknown" from "zero". `insufficientLiquidity` returns `>{max}%` (sourced
// from `PERPS_SLIPPAGE_MAX_PCT`) so the cap-blocked AC5 path still has a
// label when the book cannot fill, and bumping the bound in constants.ts
// propagates here without a silent display drift.
export function formatSlippagePct(
  estimatedPct: number | null,
  insufficientLiquidity: boolean,
): string {
  if (insufficientLiquidity) {
    return `>${PERPS_SLIPPAGE_MAX_PCT}%`;
  }
  if (estimatedPct === null) {
    return '—';
  }
  if (estimatedPct < 0.01) {
    return '<0.01%';
  }
  return `${estimatedPct.toFixed(2)}%`;
}
