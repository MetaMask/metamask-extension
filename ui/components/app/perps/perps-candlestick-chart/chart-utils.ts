/**
 * Chart formatting utilities for TradingView Lightweight Charts
 *
 * Converts CandleData from @metamask/perps-controller (strings, milliseconds)
 * into the format expected by lightweight-charts (numbers, seconds).
 */
import { brandColor } from '@metamask/design-tokens';
import type { CandleData, CandleStick } from '@metamask/perps-controller';

/**
 * Time type for lightweight-charts (seconds since epoch).
 * Defined locally to avoid ESM import issues with lightweight-charts.
 */
export type Time = number & { readonly brand: unique symbol };

/**
 * Candlestick data structure compatible with lightweight-charts
 */
export type CandlestickData<TTime> = {
  time: TTime;
  open: number;
  high: number;
  low: number;
  close: number;
};

/**
 * Histogram data structure compatible with lightweight-charts
 */
export type HistogramData<TTime> = {
  time: TTime;
  value: number;
  color: string;
};

/**
 * Convert a single CandleStick to CandlestickData for lightweight-charts.
 * Returns null if the candle has invalid (NaN or non-positive) OHLC values.
 *
 * @param candle - Raw candle from the controller (strings, time in ms)
 * @returns Formatted candlestick data or null if invalid
 */
export function formatSingleCandleForChart(
  candle: CandleStick,
): CandlestickData<Time> | null {
  const timeInSeconds = Math.floor(candle.time / 1000) as Time;

  const formatted: CandlestickData<Time> = {
    time: timeInSeconds,
    open: parseFloat(candle.open),
    high: parseFloat(candle.high),
    low: parseFloat(candle.low),
    close: parseFloat(candle.close),
  };

  const isValid =
    !isNaN(formatted.open) &&
    !isNaN(formatted.high) &&
    !isNaN(formatted.low) &&
    !isNaN(formatted.close) &&
    formatted.open > 0 &&
    formatted.high > 0 &&
    formatted.low > 0 &&
    formatted.close > 0;

  if (!isValid) {
    return null;
  }

  return formatted;
}

/**
 * Convert a single CandleStick to HistogramData for the volume series.
 * Volume is converted to USD notional value (volume x close price).
 * Color is based on candle direction (green = bullish, red = bearish).
 *
 * @param candle - Raw candle from the controller (strings, time in ms)
 * @returns Formatted histogram data or null if invalid
 */
export function formatSingleVolumeForChart(
  candle: CandleStick,
): HistogramData<Time> | null {
  const timeInSeconds = Math.floor(candle.time / 1000) as Time;
  const volume = parseFloat(candle.volume || '0');
  const close = parseFloat(candle.close);
  const open = parseFloat(candle.open);

  // USD notional value = volume x close price
  const value = volume * close;

  // Color based on candle direction
  const isBullish = close >= open;
  const color = isBullish ? brandColor.lime100 : brandColor.red300;

  if (isNaN(value) || value <= 0) {
    return null;
  }

  return { time: timeInSeconds, value, color };
}

/**
 * Formats raw candle data for use with lightweight-charts.
 * Converts timestamps from milliseconds to seconds and parses OHLC values.
 *
 * @param data - CandleData from the controller
 * @returns Formatted candlestick data array, sorted ascending by time
 */
export function formatCandleDataForChart(
  data: CandleData,
): CandlestickData<Time>[] {
  if (!data?.candles) {
    return [];
  }

  return data.candles
    .map((candle) => formatSingleCandleForChart(candle))
    .filter((candle): candle is CandlestickData<Time> => candle !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/**
 * Formats raw candle data into volume histogram data for lightweight-charts.
 * Transforms volume to USD notional value (volume x close price).
 * Colors bars based on candle direction (green = bullish, red = bearish).
 *
 * @param data - CandleData from the controller
 * @returns Formatted histogram data array, sorted ascending by time
 */
export function formatVolumeDataForChart(
  data: CandleData,
): HistogramData<Time>[] {
  if (!data?.candles) {
    return [];
  }

  return data.candles
    .map((candle) => formatSingleVolumeForChart(candle))
    .filter((item): item is HistogramData<Time> => item !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}
