import {
  MAX_SLIPPAGE_BOUNDS,
  ORDER_SLIPPAGE_CONFIG,
} from '@metamask/perps-controller';

/**
 * Slippage configuration constants for the perps order entry surface.
 * All values in basis points (1 bps = 0.01%).
 * Range 10–1000 bps (0.1%–10%) in 10 bps (0.1%) steps.
 */
export const PERPS_SLIPPAGE_DEFAULT_BPS =
  ORDER_SLIPPAGE_CONFIG.DefaultMarketSlippageBps;
export const PERPS_SLIPPAGE_MIN_BPS = MAX_SLIPPAGE_BOUNDS.MinBps;
export const PERPS_SLIPPAGE_MAX_BPS = MAX_SLIPPAGE_BOUNDS.MaxBps;
export const PERPS_SLIPPAGE_STEP_BPS = MAX_SLIPPAGE_BOUNDS.StepBps;

/** Quick-pick presets in basis points (0.5%, 2%, 3%) */
export const PERPS_SLIPPAGE_QUICK_PICKS_BPS = [50, 200, 300];

/**
 * Convert bps to percent for display
 * @param bps
 */
export const bpsToPercent = (bps: number): number => bps / 100;

/**
 * Convert percent to bps for storage
 * @param pct
 */
export const percentToBps = (pct: number): number => Math.round(pct * 100);
