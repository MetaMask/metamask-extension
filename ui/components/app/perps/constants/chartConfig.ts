export enum CandlePeriod {
  OneMinute = '1m',
  ThreeMinutes = '3m',
  FiveMinutes = '5m',
  FifteenMinutes = '15m',
  ThirtyMinutes = '30m',
  OneHour = '1h',
  TwoHours = '2h',
  FourHours = '4h',
  EightHours = '8h',
  TwelveHours = '12h',
  OneDay = '1d',
  ThreeDays = '3d',
  OneWeek = '1w',
  OneMonth = '1M',
}

export const CANDLE_PERIODS = [
  { label: '1min', value: CandlePeriod.OneMinute },
  { label: '3min', value: CandlePeriod.ThreeMinutes },
  { label: '5min', value: CandlePeriod.FiveMinutes },
  { label: '15min', value: CandlePeriod.FifteenMinutes },
  { label: '30min', value: CandlePeriod.ThirtyMinutes },
  { label: '1h', value: CandlePeriod.OneHour },
  { label: '2h', value: CandlePeriod.TwoHours },
  { label: '4h', value: CandlePeriod.FourHours },
  { label: '8h', value: CandlePeriod.EightHours },
  { label: '12h', value: CandlePeriod.TwelveHours },
  { label: '1D', value: CandlePeriod.OneDay },
  { label: '3D', value: CandlePeriod.ThreeDays },
  { label: '1W', value: CandlePeriod.OneWeek },
  { label: '1M', value: CandlePeriod.OneMonth },
] as const;

// Default periods shown in the selector (others available via "More")
export const DEFAULT_CANDLE_PERIODS = [
  { label: '1min', value: CandlePeriod.OneMinute },
  { label: '3min', value: CandlePeriod.ThreeMinutes },
  { label: '5min', value: CandlePeriod.FiveMinutes },
  { label: '15min', value: CandlePeriod.FifteenMinutes },
] as const;

// More periods shown in the dropdown (not in default row)
export const MORE_CANDLE_PERIODS = [
  { label: '30min', value: CandlePeriod.ThirtyMinutes },
  { label: '1h', value: CandlePeriod.OneHour },
  { label: '2h', value: CandlePeriod.TwoHours },
  { label: '4h', value: CandlePeriod.FourHours },
  { label: '8h', value: CandlePeriod.EightHours },
  { label: '12h', value: CandlePeriod.TwelveHours },
  { label: '1D', value: CandlePeriod.OneDay },
  { label: '3D', value: CandlePeriod.ThreeDays },
  { label: '1W', value: CandlePeriod.OneWeek },
  { label: '1M', value: CandlePeriod.OneMonth },
] as const;

// Candle count configuration
export const CANDLE_COUNT = {
  MIN: 10, // Minimum candles visible when zoomed in
  DEFAULT: 30, // Default candles to display on initial load
  FULLSCREEN: 90, // Candles in fullscreen/landscape mode
  MAX: 250, // Maximum candles visible when zoomed out
  TOTAL: 500, // Total candles to load in memory
} as const;

// Zoom configuration for chart
export const ZOOM_CONFIG = {
  MIN_CANDLES: CANDLE_COUNT.MIN,
  DEFAULT_CANDLES: CANDLE_COUNT.DEFAULT,
  MAX_CANDLES: CANDLE_COUNT.MAX,
} as const;

// Period to minutes mapping for candle count calculations
export const PERIOD_TO_MINUTES: Record<CandlePeriod, number> = {
  [CandlePeriod.OneMinute]: 1,
  [CandlePeriod.ThreeMinutes]: 3,
  [CandlePeriod.FiveMinutes]: 5,
  [CandlePeriod.FifteenMinutes]: 15,
  [CandlePeriod.ThirtyMinutes]: 30,
  [CandlePeriod.OneHour]: 60,
  [CandlePeriod.TwoHours]: 120,
  [CandlePeriod.FourHours]: 240,
  [CandlePeriod.EightHours]: 480,
  [CandlePeriod.TwelveHours]: 720,
  [CandlePeriod.OneDay]: 1440,
  [CandlePeriod.ThreeDays]: 4320,
  [CandlePeriod.OneWeek]: 10080,
  [CandlePeriod.OneMonth]: 43200,
} as const;

// Duration options for chart time range
export enum ChartDuration {
  OneHour = '1hr',
  OneDay = '1d',
  OneWeek = '1w',
  OneMonth = '1m',
  Ytd = 'ytd',
  Max = 'max',
}

// Duration to minutes mapping
export const DURATION_TO_MINUTES: Record<ChartDuration, number> = {
  [ChartDuration.OneHour]: 60,
  [ChartDuration.OneDay]: 1440,
  [ChartDuration.OneWeek]: 10080,
  [ChartDuration.OneMonth]: 43200,
  [ChartDuration.Ytd]: 525600,
  [ChartDuration.Max]: 1051200,
} as const;

// Recommended candle periods for each duration
export const DURATION_CANDLE_PERIODS: Record<
  ChartDuration,
  { periods: CandlePeriod[]; default: CandlePeriod }
> = {
  [ChartDuration.OneHour]: {
    periods: [
      CandlePeriod.OneMinute,
      CandlePeriod.ThreeMinutes,
      CandlePeriod.FiveMinutes,
      CandlePeriod.FifteenMinutes,
    ],
    default: CandlePeriod.OneMinute,
  },
  [ChartDuration.OneDay]: {
    periods: [
      CandlePeriod.FifteenMinutes,
      CandlePeriod.OneHour,
      CandlePeriod.TwoHours,
      CandlePeriod.FourHours,
    ],
    default: CandlePeriod.OneHour,
  },
  [ChartDuration.OneWeek]: {
    periods: [
      CandlePeriod.OneHour,
      CandlePeriod.TwoHours,
      CandlePeriod.FourHours,
      CandlePeriod.EightHours,
      CandlePeriod.OneDay,
    ],
    default: CandlePeriod.FourHours,
  },
  [ChartDuration.OneMonth]: {
    periods: [
      CandlePeriod.EightHours,
      CandlePeriod.TwelveHours,
      CandlePeriod.OneDay,
      CandlePeriod.OneWeek,
    ],
    default: CandlePeriod.OneDay,
  },
  [ChartDuration.Ytd]: {
    periods: [CandlePeriod.OneDay, CandlePeriod.OneWeek],
    default: CandlePeriod.OneWeek,
  },
  [ChartDuration.Max]: {
    periods: [CandlePeriod.OneWeek],
    default: CandlePeriod.OneWeek,
  },
} as const;

/**
 * Calculate the number of candles to fetch based on duration and candle period
 *
 * Converts duration and candle period enums to minutes, then calculates
 * the number of candles needed. Result is capped between MIN (10) and
 * TOTAL (500) for memory management.
 *
 * @param duration - Chart duration (e.g., ChartDuration.OneDay)
 * @param candlePeriod - Candle period (e.g., CandlePeriod.OneHour)
 * @returns Number of candles (clamped between MIN and TOTAL)
 */
export function calculateCandleCount(
  duration: ChartDuration,
  candlePeriod: CandlePeriod,
): number {
  const periodInMinutes = PERIOD_TO_MINUTES[candlePeriod] ?? 60;
  const durationInMinutes = DURATION_TO_MINUTES[duration] ?? 1440;

  const candleCount = Math.ceil(durationInMinutes / periodInMinutes);

  // Cap at TOTAL candles max for memory management
  // Allow minimum of MIN candles for basic functionality
  return Math.min(Math.max(candleCount, CANDLE_COUNT.MIN), CANDLE_COUNT.TOTAL);
}
