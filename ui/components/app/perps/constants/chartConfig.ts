export enum CandlePeriod {
  ONE_MINUTE = '1m',
  THREE_MINUTES = '3m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
  TWO_HOURS = '2h',
  FOUR_HOURS = '4h',
  EIGHT_HOURS = '8h',
  TWELVE_HOURS = '12h',
  ONE_DAY = '1d',
  THREE_DAYS = '3d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1M',
}

export const CANDLE_PERIODS = [
  { label: '1min', value: CandlePeriod.ONE_MINUTE },
  { label: '3min', value: CandlePeriod.THREE_MINUTES },
  { label: '5min', value: CandlePeriod.FIVE_MINUTES },
  { label: '15min', value: CandlePeriod.FIFTEEN_MINUTES },
  { label: '30min', value: CandlePeriod.THIRTY_MINUTES },
  { label: '1h', value: CandlePeriod.ONE_HOUR },
  { label: '2h', value: CandlePeriod.TWO_HOURS },
  { label: '4h', value: CandlePeriod.FOUR_HOURS },
  { label: '8h', value: CandlePeriod.EIGHT_HOURS },
  { label: '12h', value: CandlePeriod.TWELVE_HOURS },
  { label: '1D', value: CandlePeriod.ONE_DAY },
  { label: '3D', value: CandlePeriod.THREE_DAYS },
  { label: '1W', value: CandlePeriod.ONE_WEEK },
  { label: '1M', value: CandlePeriod.ONE_MONTH },
] as const;

// Default periods shown in the selector (others available via "More")
export const DEFAULT_CANDLE_PERIODS = [
  { label: '1min', value: CandlePeriod.ONE_MINUTE },
  { label: '3min', value: CandlePeriod.THREE_MINUTES },
  { label: '5min', value: CandlePeriod.FIVE_MINUTES },
  { label: '15min', value: CandlePeriod.FIFTEEN_MINUTES },
] as const;

// More periods shown in the dropdown (not in default row)
export const MORE_CANDLE_PERIODS = [
  { label: '30min', value: CandlePeriod.THIRTY_MINUTES },
  { label: '1h', value: CandlePeriod.ONE_HOUR },
  { label: '2h', value: CandlePeriod.TWO_HOURS },
  { label: '4h', value: CandlePeriod.FOUR_HOURS },
  { label: '8h', value: CandlePeriod.EIGHT_HOURS },
  { label: '12h', value: CandlePeriod.TWELVE_HOURS },
  { label: '1D', value: CandlePeriod.ONE_DAY },
  { label: '3D', value: CandlePeriod.THREE_DAYS },
  { label: '1W', value: CandlePeriod.ONE_WEEK },
  { label: '1M', value: CandlePeriod.ONE_MONTH },
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
  [CandlePeriod.ONE_MINUTE]: 1,
  [CandlePeriod.THREE_MINUTES]: 3,
  [CandlePeriod.FIVE_MINUTES]: 5,
  [CandlePeriod.FIFTEEN_MINUTES]: 15,
  [CandlePeriod.THIRTY_MINUTES]: 30,
  [CandlePeriod.ONE_HOUR]: 60,
  [CandlePeriod.TWO_HOURS]: 120,
  [CandlePeriod.FOUR_HOURS]: 240,
  [CandlePeriod.EIGHT_HOURS]: 480,
  [CandlePeriod.TWELVE_HOURS]: 720,
  [CandlePeriod.ONE_DAY]: 1440,
  [CandlePeriod.THREE_DAYS]: 4320,
  [CandlePeriod.ONE_WEEK]: 10080,
  [CandlePeriod.ONE_MONTH]: 43200,
} as const;

// Duration options for chart time range
export enum ChartDuration {
  ONE_HOUR = '1hr',
  ONE_DAY = '1d',
  ONE_WEEK = '1w',
  ONE_MONTH = '1m',
  YTD = 'ytd',
  MAX = 'max',
}

// Duration to minutes mapping
export const DURATION_TO_MINUTES: Record<ChartDuration, number> = {
  [ChartDuration.ONE_HOUR]: 60,
  [ChartDuration.ONE_DAY]: 1440,
  [ChartDuration.ONE_WEEK]: 10080,
  [ChartDuration.ONE_MONTH]: 43200,
  [ChartDuration.YTD]: 525600,
  [ChartDuration.MAX]: 1051200,
} as const;

// Recommended candle periods for each duration
export const DURATION_CANDLE_PERIODS: Record<
  ChartDuration,
  { periods: CandlePeriod[]; default: CandlePeriod }
> = {
  [ChartDuration.ONE_HOUR]: {
    periods: [
      CandlePeriod.ONE_MINUTE,
      CandlePeriod.THREE_MINUTES,
      CandlePeriod.FIVE_MINUTES,
      CandlePeriod.FIFTEEN_MINUTES,
    ],
    default: CandlePeriod.ONE_MINUTE,
  },
  [ChartDuration.ONE_DAY]: {
    periods: [
      CandlePeriod.FIFTEEN_MINUTES,
      CandlePeriod.ONE_HOUR,
      CandlePeriod.TWO_HOURS,
      CandlePeriod.FOUR_HOURS,
    ],
    default: CandlePeriod.ONE_HOUR,
  },
  [ChartDuration.ONE_WEEK]: {
    periods: [
      CandlePeriod.ONE_HOUR,
      CandlePeriod.TWO_HOURS,
      CandlePeriod.FOUR_HOURS,
      CandlePeriod.EIGHT_HOURS,
      CandlePeriod.ONE_DAY,
    ],
    default: CandlePeriod.FOUR_HOURS,
  },
  [ChartDuration.ONE_MONTH]: {
    periods: [
      CandlePeriod.EIGHT_HOURS,
      CandlePeriod.TWELVE_HOURS,
      CandlePeriod.ONE_DAY,
      CandlePeriod.ONE_WEEK,
    ],
    default: CandlePeriod.ONE_DAY,
  },
  [ChartDuration.YTD]: {
    periods: [CandlePeriod.ONE_DAY, CandlePeriod.ONE_WEEK],
    default: CandlePeriod.ONE_WEEK,
  },
  [ChartDuration.MAX]: {
    periods: [CandlePeriod.ONE_WEEK],
    default: CandlePeriod.ONE_WEEK,
  },
} as const;

/**
 * Calculate the number of candles to fetch based on duration and period
 * @param durationMinutes - Duration in minutes
 * @param periodMinutes - Candle period in minutes
 * @returns Number of candles (clamped between MIN and TOTAL)
 */
export function calculateCandleCount(
  durationMinutes: number,
  periodMinutes: number,
): number {
  const count = Math.floor(durationMinutes / periodMinutes);
  return Math.max(CANDLE_COUNT.MIN, Math.min(CANDLE_COUNT.TOTAL, count));
}

/**
 * Get visible range for chart zoom
 * @param dataLength - Total number of candles in data
 * @param visibleCount - Number of candles to show
 * @returns Object with from and to indices for setVisibleLogicalRange
 */
export function getVisibleRange(
  dataLength: number,
  visibleCount: number,
): { from: number; to: number } {
  const count = Math.max(
    ZOOM_CONFIG.MIN_CANDLES,
    Math.min(ZOOM_CONFIG.MAX_CANDLES, visibleCount),
  );
  return {
    from: Math.max(0, dataLength - count),
    to: dataLength - 1 + 2, // +2 for right padding
  };
}
