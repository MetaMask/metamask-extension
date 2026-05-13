import { PERPS_SLIPPAGE_MAX_PCT } from '../constants';

// Display threshold that matches the two-decimal rendering below — anything
// below this rounds to "0.00%", which would misread as zero slippage on a
// non-zero estimate, so render "<0.01%" instead. Not tied to
// PERPS_SLIPPAGE_MIN_PCT (the configurable cap floor is 0.1%); this is a
// pure rounding artifact of `toFixed(2)`.
const SLIPPAGE_DISPLAY_FLOOR_PCT = 0.01;

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
  if (estimatedPct > 0 && estimatedPct < SLIPPAGE_DISPLAY_FLOOR_PCT) {
    return `<${SLIPPAGE_DISPLAY_FLOOR_PCT}%`;
  }
  return `${estimatedPct.toFixed(2)}%`;
}
