/**
 * Chart-related types for Perps candlestick data
 * These types are protocol-agnostic and used across the codebase.
 */

/**
 * Enum for available candle periods
 * Provides type safety and prevents typos when referencing candle periods
 */
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

/**
 * Enum for available time durations
 * Provides type safety and prevents typos when referencing durations
 */
export enum TimeDuration {
  OneHour = '1hr',
  OneDay = '1d',
  OneWeek = '1w',
  OneMonth = '1m',
  YearToDate = 'ytd',
  Max = 'max',
}

/**
 * Represents a single candlestick data point
 */
export type CandleStick = {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

/**
 * Represents historical candlestick data for a specific symbol and interval
 */
export type CandleData = {
  /** Asset identifier (e.g., 'BTC', 'ETH'). Protocol-agnostic terminology for multi-provider support. */
  symbol: string;
  interval: CandlePeriod;
  candles: CandleStick[];
};

/**
 * Valid time intervals for historical candle data
 * Uses CandlePeriod enum for type safety
 */
export type ValidCandleInterval = CandlePeriod;
