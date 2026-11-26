const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Initial visible window per interval, anchored to the latest bar (not now) so
 * illiquid tokens still open on candles. E.g. 15m opens on the last 1d (~96
 * candles). Sized to a line range so candle↔line toggles keep a similar span;
 * exception: 5m opens on 12h for readability, so 5m → line widens to 1D.
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

/** Candle intervals the chart supports. */
export type CandleInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

/**
 * TradingView resolution for each candle interval, sent with `SET_OHLCV_DATA`
 * so the chart engine doesn't infer it from bar spacing (which misfires on
 * low-liquidity tokens, e.g. 5m detected as 30m). Minutes are plain numbers
 * (hours as minutes); days/weeks use `1D`/`1W`.
 */
export const INTERVAL_TO_TV_RESOLUTION: Record<CandleInterval, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': '1D',
  '1w': '1W',
};

/**
 * Looks up the TradingView resolution for a candle interval.
 *
 * @param interval - The candle interval, e.g. `5m`.
 * @returns The TradingView resolution, or `undefined` for unknown intervals.
 */
export function getTvResolution(interval: string): string | undefined {
  return isCandleInterval(interval)
    ? INTERVAL_TO_TV_RESOLUTION[interval]
    : undefined;
}

function isCandleInterval(interval: string): interval is CandleInterval {
  return Object.hasOwn(INTERVAL_TO_TV_RESOLUTION, interval);
}

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
 * Max candles per window. E.g. 1Y of 1m is ~525k bars (the pagination storm),
 * so line 1Y → candle steps to 1w instead.
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
