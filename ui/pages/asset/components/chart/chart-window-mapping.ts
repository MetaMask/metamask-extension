const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// ─── Candle intervals ───────────────────────────────────────────────────────

/**
 * Candle intervals the chart supports, ordered finest -> coarsest.
 * {@link nearestByWindow} tie-breaks depend on this order.
 */
export const CANDLE_INTERVALS = [
  '1m',
  '5m',
  '15m',
  '1h',
  '4h',
  '1d',
  '1w',
] as const;

export type CandleInterval = (typeof CANDLE_INTERVALS)[number];

/** Price API OHLCV `timePeriod` (API supports only these). Note '1m' = 1 month. */
export type OhlcvTimePeriod = '1h' | '1d' | '1w' | '1m' | '1y';

type CandleIntervalConfig = {
  /** Duration of a single candle, used for bar-count math. */
  durationMs: number;
  /**
   * Initial visible window, anchored to the latest bar (not now) so illiquid
   * tokens still open on candles. Sized to a line range so candle↔line toggles
   * keep a similar span; exception: 5m opens on 12h for readability, so
   * 5m → line widens to 1D. Must not exceed the span of `timePeriod` (the
   * first fetched page).
   */
  visibleWindowMs: number;
  /**
   * TradingView resolution, sent with `SET_OHLCV_DATA` so the chart engine
   * doesn't infer it from bar spacing (which misfires on low-liquidity tokens,
   * e.g. 5m detected as 30m). Minutes are plain numbers (hours as minutes);
   * days/weeks use `1D`/`1W`.
   */
  tvResolution: string;
  /** The `timePeriod` query param the OHLCV API expects for this interval. */
  timePeriod: OhlcvTimePeriod;
};

export const CANDLE_INTERVAL_CONFIG: Record<
  CandleInterval,
  CandleIntervalConfig
> = {
  // 1h window = 1H range -> ~60 candles
  '1m': {
    durationMs: MINUTE_MS,
    visibleWindowMs: HOUR_MS,
    tvResolution: '1',
    timePeriod: '1d',
  },
  // 12h window -> ~144 candles (readability over exact 1D match)
  '5m': {
    durationMs: 5 * MINUTE_MS,
    visibleWindowMs: 12 * HOUR_MS,
    tvResolution: '5',
    timePeriod: '1d',
  },
  // 1d window = 1D range -> ~96 candles
  '15m': {
    durationMs: 15 * MINUTE_MS,
    visibleWindowMs: DAY_MS,
    tvResolution: '15',
    timePeriod: '1d',
  },
  // 1w window = 1W range -> ~168 candles
  '1h': {
    durationMs: HOUR_MS,
    visibleWindowMs: 7 * DAY_MS,
    tvResolution: '60',
    timePeriod: '1w',
  },
  // 1w window = 1W range -> ~42 candles
  '4h': {
    durationMs: 4 * HOUR_MS,
    visibleWindowMs: 7 * DAY_MS,
    tvResolution: '240',
    timePeriod: '1m',
  },
  // 1M window = 1M range -> ~30 candles
  '1d': {
    durationMs: DAY_MS,
    visibleWindowMs: 30 * DAY_MS,
    tvResolution: '1D',
    timePeriod: '1m',
  },
  // 1y window = 1Y range -> ~52 candles
  '1w': {
    durationMs: 7 * DAY_MS,
    visibleWindowMs: 365 * DAY_MS,
    tvResolution: '1W',
    timePeriod: '1y',
  },
};

/**
 * Whether a string is a supported candle interval. Own-property check, so
 * inherited keys such as `toString` are rejected.
 *
 * @param interval - The value to check, e.g. `5m`.
 * @returns True when `interval` is a {@link CandleInterval}.
 */
export function isCandleInterval(interval: string): interval is CandleInterval {
  return Object.hasOwn(CANDLE_INTERVAL_CONFIG, interval);
}

/**
 * Looks up the config for a candle interval.
 *
 * @param interval - The candle interval, e.g. `5m`.
 * @returns The interval's config, or `undefined` for unknown intervals.
 */
export function getCandleIntervalConfig(
  interval: string,
): CandleIntervalConfig | undefined {
  return isCandleInterval(interval)
    ? CANDLE_INTERVAL_CONFIG[interval]
    : undefined;
}

/**
 * Looks up the TradingView resolution for a candle interval.
 *
 * @param interval - The candle interval, e.g. `5m`.
 * @returns The TradingView resolution, or `undefined` for unknown intervals.
 */
export function getTvResolution(interval: string): string | undefined {
  return getCandleIntervalConfig(interval)?.tvResolution;
}

/**
 * Looks up the OHLCV API `timePeriod` for a candle interval.
 *
 * @param interval - The candle interval, e.g. `5m`.
 * @returns The `timePeriod`, falling back to `1d` for unknown intervals.
 */
export function getOhlcvTimePeriod(interval: string): OhlcvTimePeriod {
  return getCandleIntervalConfig(interval)?.timePeriod ?? '1d';
}

/** Each interval's visible window, in {@link CANDLE_INTERVALS} order. */
const CANDLE_VISIBLE_WINDOW_MS = Object.fromEntries(
  CANDLE_INTERVALS.map((interval) => [
    interval,
    CANDLE_INTERVAL_CONFIG[interval].visibleWindowMs,
  ]),
) as Record<CandleInterval, number>;

// ─── Line time ranges ───────────────────────────────────────────────────────

/**
 * Time ranges offered in line mode, ordered shortest -> longest.
 * {@link nearestByWindow} tie-breaks depend on this order.
 */
export const LINE_RANGES = ['1H', '1D', '1W', '1M', '1Y'] as const;

export type LineRange = (typeof LINE_RANGES)[number];

type LineRangeConfig = {
  /** Span covered by the range. */
  windowMs: number;
  /** ISO 8601 duration `useHistoricalPrices` expects. */
  iso8601: string;
};

export const LINE_RANGE_CONFIG: Record<LineRange, LineRangeConfig> = {
  '1H': { windowMs: HOUR_MS, iso8601: 'PT1H' },
  '1D': { windowMs: DAY_MS, iso8601: 'P1D' },
  '1W': { windowMs: 7 * DAY_MS, iso8601: 'P1W' },
  '1M': { windowMs: 30 * DAY_MS, iso8601: 'P1M' },
  '1Y': { windowMs: 365 * DAY_MS, iso8601: 'P1Y' },
};

/** Default time range for line chart mode (matches mobile). */
export const DEFAULT_LINE_RANGE: LineRange = '1D';

/**
 * Looks up the config for a line time range.
 *
 * @param range - The line time range, e.g. `1W`.
 * @returns The range's config, or `undefined` for unknown ranges.
 */
export function getLineRangeConfig(range: string): LineRangeConfig | undefined {
  return Object.hasOwn(LINE_RANGE_CONFIG, range)
    ? LINE_RANGE_CONFIG[range as LineRange]
    : undefined;
}

/** Each line range's span, in {@link LINE_RANGES} order. */
const LINE_RANGE_WINDOW_MS = Object.fromEntries(
  LINE_RANGES.map((range) => [range, LINE_RANGE_CONFIG[range].windowMs]),
) as Record<LineRange, number>;

// ─── Window mapping ─────────────────────────────────────────────────────────

/**
 * Max candles per window. E.g. 1Y of 1m is ~525k bars (the pagination storm),
 * so line 1Y → candle steps to 1w instead.
 */
const MAX_BARS_PER_WINDOW = 500;

/**
 * Picks the candidate whose window is closest to `targetMs`. Distance is
 * measured on a log (ratio) scale so "twice as long" and "half as long" count
 * equally, which matches how windows are perceived across orders of magnitude.
 *
 * Ties are broken toward the later-listed candidate. Since both candidate maps
 * are ordered finest -> coarsest, this means a tie resolves to the coarser
 * interval (fewer candles on screen), which is the more readable choice when
 * two intervals share a window (e.g. `1h` and `4h` both span 7d).
 *
 * @param targetMs - The window to match, in milliseconds.
 * @param candidates - Map of candidate key to its window in milliseconds.
 * @returns The key of the nearest candidate.
 */
export function nearestByWindow<Key extends string>(
  targetMs: number,
  candidates: Record<Key, number>,
): Key {
  let best = '' as Key;
  let bestDistance = Infinity;
  for (const [key, windowMs] of Object.entries(candidates) as [Key, number][]) {
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
export function mapCandleIntervalToLineRange(interval: string): LineRange {
  const config = getCandleIntervalConfig(interval);
  if (config === undefined) {
    return DEFAULT_LINE_RANGE;
  }
  return nearestByWindow(config.visibleWindowMs, LINE_RANGE_WINDOW_MS);
}

/**
 * Resolves which candle interval to display when toggling line -> candle.
 *
 * The candle always renders that interval's own natural window
 * (`visibleWindowMs` in {@link CANDLE_INTERVAL_CONFIG}); no separate window is
 * applied. The user's saved interval is kept when it is a sensible fit for the
 * line span (its bar count over that span is within
 * {@link MAX_BARS_PER_WINDOW}); otherwise it is stepped to the candle interval
 * whose natural window is closest to the line span, which preserves the
 * visible tendency (e.g. a year on the line maps to the `1w` interval, whose
 * natural window is ~1 year).
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
  const { windowMs } =
    getLineRangeConfig(lineRange) ?? LINE_RANGE_CONFIG[DEFAULT_LINE_RANGE];

  const savedDuration = getCandleIntervalConfig(savedInterval)?.durationMs;
  if (
    savedDuration !== undefined &&
    windowMs / savedDuration <= MAX_BARS_PER_WINDOW
  ) {
    return savedInterval;
  }

  return nearestByWindow(windowMs, CANDLE_VISIBLE_WINDOW_MS);
}
