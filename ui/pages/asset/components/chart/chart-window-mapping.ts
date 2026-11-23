const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Initial visible window ("time back") per candle interval. When the host
 * sends no visible range, the chart engine auto-fits every loaded bar, so
 * candle mode reaches much further back than the line chart (and, for sparse
 * tokens, stretches a handful of candles across days). Pinning a per-interval
 * window via `visibleFromMs` keeps the default candle view focused on a recent
 * span comparable to the line chart.
 *
 * The window is anchored to the latest loaded bar (not `Date.now()`), so
 * illiquid/stale tokens still open on their most recent candles instead of an
 * empty "now" window. Older bars remain reachable by scrolling (pagination).
 *
 * Each window is sized close to a line-chart range so a candle<->line toggle
 * shows a similar span in both directions. Most intervals land in a readable
 * candle band (~30-168 on screen). Two notes on the deliberate exceptions:
 * - `5m` opens on 12h (~144 candles) — a readability-first choice. It still
 *   maps to the `1D` line range (12h is the nearest line span), so toggling
 *   5m->line widens the view from 12h to 1d: a mild, accepted zoom rather than
 *   an exact span match.
 * - `1h` (1w -> ~168) stays matched to the `1W` line range exactly; it is dense
 *   but kept span-consistent so its toggle does not jump.
 */
export const VISIBLE_WINDOW_MS_BY_INTERVAL: Record<string, number> = {
  '1m': HOUR_MS, // 1h = 1H range -> ~60 candles
  '5m': 12 * HOUR_MS, // 12h -> ~144 candles (readability over exact 1D match)
  '15m': DAY_MS, // 1d = 1D range -> ~96 candles
  '1h': 7 * DAY_MS, // 1w = 1W range -> ~168 candles
  '4h': 7 * DAY_MS, // 1w = 1W range -> ~42 candles
  '1d': 30 * DAY_MS, // 1M = 1M range -> ~30 candles
  '1w': 365 * DAY_MS, // 1y = 1Y range -> ~52 candles
};

/** Duration of a single candle at each interval, used for bar-count math. */
export const INTERVAL_DURATION_MS: Record<string, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': HOUR_MS,
  '4h': 4 * HOUR_MS,
  '1d': DAY_MS,
  '1w': 7 * DAY_MS,
};

/** Span covered by each line-chart time range. */
export const LINE_RANGE_MS: Record<string, number> = {
  '1H': HOUR_MS,
  '1D': DAY_MS,
  '1W': 7 * DAY_MS,
  '1M': 30 * DAY_MS,
  '1Y': 365 * DAY_MS,
};

/**
 * Upper bound on how many candles a single visible window may contain. Beyond
 * this the engine's first `countBack` balloons (e.g. a year of 1m candles is
 * ~525k bars), which is exactly the pagination storm the atomic interval-window
 * fix guards against. Sized to the healthy ~300-bar countBack seen after that
 * fix, with headroom. Tunable.
 */
export const MAX_BARS_PER_WINDOW = 500;

/**
 * Picks the candidate whose window is closest to `targetMs`. Distance is
 * measured on a log (ratio) scale so "twice as long" and "half as long" count
 * equally, which matches how windows are perceived across orders of magnitude.
 *
 * Ties are broken toward the later-listed candidate. Since both candidate maps
 * are ordered finest -> coarsest, this means a tie resolves to the coarser
 * interval (fewer candles on screen), which is the more readable choice when
 * two intervals share a window (e.g. `5m` and `15m` both span 1d).
 *
 * @param targetMs - The window to match, in milliseconds.
 * @param candidates - Map of candidate key to its window in milliseconds.
 * @returns The key of the nearest candidate.
 */
export function nearestByWindow(
  targetMs: number,
  candidates: Record<string, number>,
): string {
  let best = '';
  let bestDistance = Infinity;
  for (const [key, windowMs] of Object.entries(candidates)) {
    const distance = Math.abs(Math.log(windowMs / targetMs));
    if (distance <= bestDistance) {
      bestDistance = distance;
      best = key;
    }
  }
  return best;
}

/**
 * Maps a candle interval to the line time range whose span is closest to that
 * interval's default visible window. Used when toggling candle -> line so the
 * line chart opens on roughly the same window instead of the hardcoded default.
 *
 * @param interval - The candle interval, e.g. `1m`.
 * @returns The nearest line time range, e.g. `1H`.
 */
export function mapCandleIntervalToLineRange(interval: string): string {
  const windowMs = VISIBLE_WINDOW_MS_BY_INTERVAL[interval];
  if (windowMs === undefined) {
    return '1D';
  }
  return nearestByWindow(windowMs, LINE_RANGE_MS);
}

/**
 * Resolves which candle interval to display when toggling line -> candle.
 *
 * The candle always renders that interval's own natural window
 * ({@link VISIBLE_WINDOW_MS_BY_INTERVAL}); no separate window is applied. The
 * user's saved interval is kept when it is a sensible fit for the line span
 * (its bar count over that span is within {@link MAX_BARS_PER_WINDOW});
 * otherwise it is stepped to the candle interval whose natural window is
 * closest to the line span, which preserves the visible tendency (e.g. a year
 * on the line maps to the `1w` interval, whose natural window is ~1 year).
 *
 * The returned interval is for display only and must not be persisted, so a
 * cap-triggered step never overwrites the user's saved interval.
 *
 * @param lineRange - The active line time range, e.g. `1Y`.
 * @param savedInterval - The user's persisted candle interval, e.g. `1m`.
 * @returns The candle interval to display.
 */
export function resolveCandleForLineRange(
  lineRange: string,
  savedInterval: string,
): string {
  const windowMs = LINE_RANGE_MS[lineRange] ?? LINE_RANGE_MS['1D'];

  const savedDuration = INTERVAL_DURATION_MS[savedInterval];
  if (
    savedDuration !== undefined &&
    windowMs / savedDuration <= MAX_BARS_PER_WINDOW
  ) {
    return savedInterval;
  }

  return nearestByWindow(windowMs, VISIBLE_WINDOW_MS_BY_INTERVAL);
}
