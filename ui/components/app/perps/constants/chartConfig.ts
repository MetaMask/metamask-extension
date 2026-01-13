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

