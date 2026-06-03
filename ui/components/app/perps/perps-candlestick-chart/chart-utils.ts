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
//
// Formatters are locale-aware: the locale is threaded from lightweight-charts'
// tickMarkFormatter callback (which sources it from navigator.language) so
// labels respect the user's language/region preferences.
// ---------------------------------------------------------------------------

const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

type Formatters = {
  dateString: Intl.DateTimeFormat;
  monthDay: Intl.DateTimeFormat;
  time24h: Intl.DateTimeFormat;
  crosshair: Intl.DateTimeFormat;
  year: Intl.DateTimeFormat;
  monthShort: Intl.DateTimeFormat;
  timeWithSeconds: Intl.DateTimeFormat;
};

const formatterCache = new Map<string, Formatters>();

function createFormatters(locale: string, timezone: string): Formatters {
  return {
    dateString: new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
    }),
    monthDay: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    }),
    time24h: new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }),
    crosshair: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }),
    year: new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      timeZone: timezone,
    }),
    monthShort: new Intl.DateTimeFormat(locale, {
      month: 'short',
      timeZone: timezone,
    }),
    timeWithSeconds: new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }),
  };
}

function getFormatters(locale: string): Formatters {
  let formatters = formatterCache.get(locale);
  if (!formatters) {
    formatters = createFormatters(locale, userTimezone);
    formatterCache.set(locale, formatters);
  }
  return formatters;
}

/**
 * Visible for testing – clears the per-locale formatter cache so tests
 * that stub `navigator.language` start with a clean slate.
 */
export function clearFormatterCache(): void {
  formatterCache.clear();
}

function getDateString(date: Date, fmt: Formatters): string {
  return fmt.dateString.format(date);
}

function isToday(date: Date, fmt: Formatters): boolean {
  return getDateString(date, fmt) === getDateString(new Date(), fmt);
}

/**
 * Format a date using the given formatter key, patching a bare-numeric month
 * part with the standalone abbreviated month name when needed.
 *
 * Some locales (notably Czech) have ICU data that downgrades `month: 'short'`
 * back to a bare number when combined with other fields in a single
 * DateTimeFormat.  We detect this via `formatToParts` and substitute the
 * standalone short month name while preserving the locale-native ordering.
 *
 * @param key - Which formatter from the cached set to use
 * @param date - The date to format
 * @param fmt - Cached locale-specific formatters
 * @returns The formatted string with month name patched in when needed
 */
function formatWithMonthPatch(
  key: keyof Formatters,
  date: Date,
  fmt: Formatters,
): string {
  const formatter = fmt[key];
  const parts = formatter.formatToParts(date);

  const hasNumericMonth = parts.some(
    (p) => p.type === 'month' && /^\d+$/u.test(p.value),
  );

  if (!hasNumericMonth) {
    return formatter.format(date);
  }

  const monthName = fmt.monthShort.format(date);

  if (parts.some((p) => p.type === 'month' && monthName.startsWith(p.value))) {
    return formatter.format(date);
  }

  return parts
    .map((p) =>
      p.type === 'month' && /^\d+$/u.test(p.value) ? monthName : p.value,
    )
    .join('');
}

/**
 * Format a date as abbreviated month + day (e.g. "Apr 25", "25. dub.").
 *
 * @param date - The date to format
 * @param fmt - Cached locale-specific formatters
 */
function formatMonthDay(date: Date, fmt: Formatters): string {
  return formatWithMonthPatch('monthDay', date, fmt);
}

function formatTime24h(date: Date, fmt: Formatters): string {
  return fmt.time24h.format(date);
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
 * @param locale - BCP 47 locale tag sourced from the lightweight-charts
 * callback; falls back to `navigator.language` when omitted.
 * @returns Formatted time string
 */
export function formatChartTimestamp(
  timeInSeconds: number,
  tickMarkType: TickMarkType | number | null,
  isCrosshair = false,
  locale: string = navigator.language,
): string {
  const fmt = getFormatters(locale);
  const date = new Date(timeInSeconds * 1000);

  if (isCrosshair) {
    return formatWithMonthPatch('crosshair', date, fmt);
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
        return fmt.year.format(date);
      case 'Month':
        return fmt.monthShort.format(date);
      case 'DayOfMonth':
        return formatMonthDay(date, fmt);
      case 'Time':
        if (!isToday(date, fmt)) {
          return `${formatMonthDay(date, fmt)} ${formatTime24h(date, fmt)}`;
        }
        return formatTime24h(date, fmt);
      case 'TimeWithSeconds':
        return fmt.timeWithSeconds.format(date);
      default:
        break;
    }
  }

  return `${formatMonthDay(date, fmt)} ${formatTime24h(date, fmt)}`;
}
