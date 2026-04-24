/**
 * Chart formatting utilities for TradingView Lightweight Charts
 *
 * Converts CandleData from @metamask/perps-controller (strings, milliseconds)
 * into the format expected by lightweight-charts (numbers, seconds).
 *
 * Also provides locale-aware time formatters for the chart x-axis and
 * crosshair, matching the mobile TradingViewChartTemplate implementation.
 */
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
 * Color is based on candle direction (bullish = upColor, bearish = downColor).
 *
 * @param candle - Raw candle from the controller (strings, time in ms)
 * @param upColor - Color for bullish (close >= open) candles
 * @param downColor - Color for bearish (close < open) candles
 * @returns Formatted histogram data or null if invalid
 */
export function formatSingleVolumeForChart(
  candle: CandleStick,
  upColor: string,
  downColor: string,
): HistogramData<Time> | null {
  const timeInSeconds = Math.floor(candle.time / 1000) as Time;
  const volume = parseFloat(candle.volume || '0');
  const close = parseFloat(candle.close);
  const open = parseFloat(candle.open);

  // USD notional value = volume x close price
  const value = volume * close;

  // Color based on candle direction
  const isBullish = close >= open;
  const color = isBullish ? upColor : downColor;

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
 * Colors bars based on candle direction (bullish = upColor, bearish = downColor).
 *
 * @param data - CandleData from the controller
 * @param upColor - Color for bullish (close >= open) candles
 * @param downColor - Color for bearish (close < open) candles
 * @returns Formatted histogram data array, sorted ascending by time
 */
export function formatVolumeDataForChart(
  data: CandleData,
  upColor: string,
  downColor: string,
): HistogramData<Time>[] {
  if (!data?.candles) {
    return [];
  }

  return data.candles
    .map((candle) => formatSingleVolumeForChart(candle, upColor, downColor))
    .filter((item): item is HistogramData<Time> => item !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

// ---------------------------------------------------------------------------
// Time-axis formatting (mirrors mobile TradingViewChartTemplate.tsx)
//
// Uses cached Intl.DateTimeFormat instances instead of Date.toLocaleString
// to avoid silent fallback to Date.toString() in some extension contexts.
// ---------------------------------------------------------------------------

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const dateStringFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: userTimezone,
});

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  day: 'numeric',
  timeZone: userTimezone,
});

const time24hFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: userTimezone,
});

const crosshairFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: userTimezone,
});

const yearFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: userTimezone,
});

const monthShortFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: userTimezone,
});

const timeWithSecondsFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: userTimezone,
});

function getDateString(date: Date): string {
  return dateStringFormatter.format(date);
}

function isToday(date: Date): boolean {
  return getDateString(date) === getDateString(new Date());
}

function formatMonthDay(date: Date): string {
  return monthDayFormatter.format(date);
}

function formatTime24h(date: Date): string {
  return time24hFormatter.format(date);
}

/**
 * Lightweight-charts tick-mark type enum values passed to tickMarkFormatter.
 * Mirrors TickMarkType from the library.
 */
type TickMarkType =
  | 'Year'
  | 'Month'
  | 'DayOfMonth'
  | 'Time'
  | 'TimeWithSeconds';

/**
 * Smart timestamp formatter for the chart x-axis and crosshair, matching
 * the mobile TradingViewChartTemplate implementation.
 *
 * Uses `Intl.DateTimeFormat` with the user's local timezone so labels always
 * reflect local wall-clock time without needing to shift the underlying data.
 *
 * @param timeInSeconds - UTC timestamp in seconds (as stored by lightweight-charts)
 * @param tickMarkType - Lightweight-charts tick type; null for crosshair
 * @param isCrosshair - True when called from the crosshair time formatter
 * @returns Formatted time string
 */
export function formatChartTimestamp(
  timeInSeconds: number,
  tickMarkType: TickMarkType | number | null,
  isCrosshair = false,
): string {
  const date = new Date(timeInSeconds * 1000);

  if (isCrosshair) {
    return crosshairFormatter.format(date);
  }

  if (tickMarkType !== null && tickMarkType !== undefined) {
    // lightweight-charts v5 passes numeric enum values:
    // 0 = Year, 1 = Month, 2 = DayOfMonth, 3 = Time, 4 = TimeWithSeconds
    const resolved =
      typeof tickMarkType === 'number'
        ? (['Year', 'Month', 'DayOfMonth', 'Time', 'TimeWithSeconds'][
            tickMarkType
          ] as TickMarkType | undefined)
        : tickMarkType;

    switch (resolved) {
      case 'Year':
        return yearFormatter.format(date);
      case 'Month':
        return monthShortFormatter.format(date);
      case 'DayOfMonth':
        return formatMonthDay(date);
      case 'Time':
        if (!isToday(date)) {
          return `${formatMonthDay(date)} ${formatTime24h(date)}`;
        }
        return formatTime24h(date);
      case 'TimeWithSeconds':
        return timeWithSecondsFormatter.format(date);
      default:
        break;
    }
  }

  return `${formatMonthDay(date)} ${formatTime24h(date)}`;
}
