/** One OHLCV candle as the chart consumes it (`time` in milliseconds). */
export type OHLCVBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/** One OHLCV candle as the Price API (REST or WebSocket) returns it. */
export type OHLCVApiCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

/**
 * Maps a Price API candle to the chart's bar shape.
 *
 * @param candle - The candle as returned by the Price API.
 * @param timestampScale - Multiplier that converts `timestamp` to
 * milliseconds, e.g. 1000 for WebSocket bars (seconds). Defaults to 1 (REST
 * bars are already in milliseconds).
 * @returns The chart bar.
 */
export function toOHLCVBar(
  candle: OHLCVApiCandle,
  timestampScale = 1,
): OHLCVBar {
  return {
    time: candle.timestamp * timestampScale,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  };
}
