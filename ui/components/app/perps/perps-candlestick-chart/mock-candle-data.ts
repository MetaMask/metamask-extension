import type { CandlestickData, HistogramData, Time } from 'lightweight-charts';

/**
 * Raw candle data structure from the API/mock data
 */
interface RawCandle {
  time: number; // Timestamp in milliseconds
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

/**
 * Candle data structure containing coin, interval, and candles array
 */
export interface CandleData {
  coin: string;
  interval: string;
  candles: RawCandle[];
}

/**
 * Mock candle data for BTC 5m interval
 * This data is used for development and testing
 */
export const mockCandleData: CandleData = {
  coin: 'BTC',
  interval: '5m',
  candles: [
    { time: 1768188300000, open: '92431.0', high: '92454.0', low: '92340.0', close: '92367.0', volume: '63.87765' },
    { time: 1768188600000, open: '92368.0', high: '92422.0', low: '92142.0', close: '92202.0', volume: '159.43488' },
    { time: 1768188900000, open: '92202.0', high: '92217.0', low: '92041.0', close: '92114.0', volume: '258.22808' },
    { time: 1768189200000, open: '92123.0', high: '92146.0', low: '91936.0', close: '91983.0', volume: '103.56163' },
    { time: 1768189500000, open: '91983.0', high: '92006.0', low: '91916.0', close: '91917.0', volume: '70.72739' },
    { time: 1768189800000, open: '91918.0', high: '91957.0', low: '91882.0', close: '91923.0', volume: '52.43662' },
    { time: 1768190100000, open: '91930.0', high: '91980.0', low: '91790.0', close: '91793.0', volume: '223.20723' },
    { time: 1768190400000, open: '91794.0', high: '91859.0', low: '91736.0', close: '91766.0', volume: '67.42924' },
    { time: 1768190700000, open: '91765.0', high: '91913.0', low: '91765.0', close: '91863.0', volume: '364.54635' },
    { time: 1768191000000, open: '91863.0', high: '92084.0', low: '91843.0', close: '92084.0', volume: '238.00075' },
    { time: 1768191300000, open: '92083.0', high: '92099.0', low: '92058.0', close: '92077.0', volume: '60.53008' },
    { time: 1768191600000, open: '92077.0', high: '92077.0', low: '92005.0', close: '92039.0', volume: '28.6041' },
    { time: 1768191900000, open: '92040.0', high: '92044.0', low: '92008.0', close: '92040.0', volume: '49.48221' },
    { time: 1768192200000, open: '92041.0', high: '92151.0', low: '92016.0', close: '92150.0', volume: '50.66976' },
    { time: 1768192500000, open: '92151.0', high: '92212.0', low: '92138.0', close: '92185.0', volume: '42.62577' },
    { time: 1768192800000, open: '92185.0', high: '92217.0', low: '92164.0', close: '92187.0', volume: '19.62145' },
    { time: 1768193100000, open: '92187.0', high: '92280.0', low: '92186.0', close: '92247.0', volume: '69.89073' },
    { time: 1768193400000, open: '92248.0', high: '92248.0', low: '92158.0', close: '92167.0', volume: '53.82671' },
    { time: 1768193700000, open: '92167.0', high: '92167.0', low: '92133.0', close: '92158.0', volume: '33.25779' },
    { time: 1768194000000, open: '92158.0', high: '92158.0', low: '92033.0', close: '92137.0', volume: '46.91442' },
    { time: 1768194300000, open: '92137.0', high: '92183.0', low: '92121.0', close: '92182.0', volume: '15.43358' },
    { time: 1768194600000, open: '92181.0', high: '92224.0', low: '92112.0', close: '92115.0', volume: '26.53368' },
    { time: 1768194900000, open: '92115.0', high: '92214.0', low: '92089.0', close: '92213.0', volume: '20.01672' },
    { time: 1768195200000, open: '92214.0', high: '92248.0', low: '92175.0', close: '92199.0', volume: '13.60028' },
    { time: 1768195500000, open: '92198.0', high: '92236.0', low: '92184.0', close: '92224.0', volume: '10.24897' },
    { time: 1768195800000, open: '92224.0', high: '92258.0', low: '92122.0', close: '92135.0', volume: '21.09711' },
    { time: 1768196100000, open: '92135.0', high: '92157.0', low: '92109.0', close: '92157.0', volume: '4.76371' },
    { time: 1768196400000, open: '92157.0', high: '92157.0', low: '92067.0', close: '92096.0', volume: '50.20014' },
    { time: 1768196700000, open: '92097.0', high: '92104.0', low: '92080.0', close: '92084.0', volume: '10.38074' },
    { time: 1768197000000, open: '92084.0', high: '92117.0', low: '92076.0', close: '92117.0', volume: '16.82214' },
    { time: 1768227600000, open: '90455.0', high: '90463.0', low: '90081.0', close: '90191.0', volume: '372.22198' },
    { time: 1768227900000, open: '90188.0', high: '90278.0', low: '90086.0', close: '90252.0', volume: '176.7826' },
    { time: 1768228200000, open: '90254.0', high: '90750.0', low: '90183.0', close: '90640.0', volume: '990.74586' },
    { time: 1768228500000, open: '90640.0', high: '90958.0', low: '90503.0', close: '90955.0', volume: '610.88828' },
    { time: 1768228800000, open: '90956.0', high: '91012.0', low: '90647.0', close: '90781.0', volume: '345.93837' },
    { time: 1768229100000, open: '90782.0', high: '90814.0', low: '90560.0', close: '90814.0', volume: '102.56556' },
    { time: 1768229400000, open: '90815.0', high: '91097.0', low: '90755.0', close: '90780.0', volume: '237.16551' },
    { time: 1768229700000, open: '90780.0', high: '90965.0', low: '90762.0', close: '90876.0', volume: '71.19566' },
    { time: 1768230000000, open: '90876.0', high: '90932.0', low: '90773.0', close: '90807.0', volume: '46.52212' },
    { time: 1768230300000, open: '90807.0', high: '90970.0', low: '90726.0', close: '90843.0', volume: '231.49806' },
    { time: 1768318200000, open: '92393.0', high: '92856.0', low: '92368.0', close: '92814.0', volume: '186.34147' },
    { time: 1768318500000, open: '92813.0', high: '93175.0', low: '92776.0', close: '92987.0', volume: '683.05258' },
    { time: 1768318800000, open: '92987.0', high: '93110.0', low: '92845.0', close: '92925.0', volume: '207.03771' },
    { time: 1768319100000, open: '92925.0', high: '93051.0', low: '92829.0', close: '92843.0', volume: '146.56286' },
    { time: 1768319400000, open: '92843.0', high: '93135.0', low: '92831.0', close: '93130.0', volume: '206.79907' },
    { time: 1768319700000, open: '93129.0', high: '93434.0', low: '93123.0', close: '93434.0', volume: '711.05607' },
    { time: 1768320000000, open: '93435.0', high: '93689.0', low: '93434.0', close: '93596.0', volume: '470.50706' },
    { time: 1768320300000, open: '93596.0', high: '93681.0', low: '93437.0', close: '93464.0', volume: '236.88344' },
    { time: 1768320600000, open: '93465.0', high: '93509.0', low: '93282.0', close: '93282.0', volume: '156.7158' },
    { time: 1768320900000, open: '93283.0', high: '93359.0', low: '93134.0', close: '93299.0', volume: '413.84135' },
    { time: 1768332600000, open: '93830.0', high: '94100.0', low: '93761.0', close: '93925.0', volume: '598.08354' },
    { time: 1768332900000, open: '93924.0', high: '94053.0', low: '93876.0', close: '93994.0', volume: '193.22885' },
    { time: 1768333200000, open: '93993.0', high: '94095.0', low: '93910.0', close: '93987.0', volume: '336.59466' },
    { time: 1768333500000, open: '93987.0', high: '94034.0', low: '93966.0', close: '94034.0', volume: '50.90747' },
    { time: 1768333800000, open: '94034.0', high: '94190.0', low: '94014.0', close: '94150.0', volume: '417.46656' },
    { time: 1768334100000, open: '94151.0', high: '94200.0', low: '94111.0', close: '94176.0', volume: '116.08952' },
    { time: 1768334400000, open: '94177.0', high: '94263.0', low: '94131.0', close: '94217.0', volume: '545.0999' },
    { time: 1768334700000, open: '94217.0', high: '94352.0', low: '94197.0', close: '94282.0', volume: '381.35869' },
    { time: 1768335000000, open: '94283.0', high: '94413.0', low: '94178.0', close: '94309.0', volume: '313.54869' },
    { time: 1768335300000, open: '94310.0', high: '94393.0', low: '94249.0', close: '94387.0', volume: '284.20735' },
    { time: 1768335600000, open: '94386.0', high: '94483.0', low: '94326.0', close: '94460.0', volume: '447.8457' },
    { time: 1768335900000, open: '94459.0', high: '94484.0', low: '94212.0', close: '94301.0', volume: '593.761' },
    { time: 1768336200000, open: '94300.0', high: '94335.0', low: '94195.0', close: '94275.0', volume: '78.93916' },
    { time: 1768336500000, open: '94274.0', high: '94275.0', low: '94081.0', close: '94169.0', volume: '272.36841' },
    { time: 1768336800000, open: '94169.0', high: '94250.0', low: '94083.0', close: '94246.0', volume: '194.55706' },
    { time: 1768337100000, open: '94235.0', high: '94331.0', low: '94180.0', close: '94187.0', volume: '148.62875' },
    { time: 1768337400000, open: '94185.0', high: '94365.0', low: '94179.0', close: '94285.0', volume: '130.2908' },
    { time: 1768337700000, open: '94285.0', high: '94416.0', low: '94267.0', close: '94360.0', volume: '105.55123' },
    { time: 1768338000000, open: '94359.0', high: '94450.0', low: '94333.0', close: '94450.0', volume: '87.1785' },
    { time: 1768338300000, open: '94441.0', high: '94451.0', low: '94372.0', close: '94402.0', volume: '90.96111' },
  ],
};

/**
 * Formats raw candle data for use with lightweight-charts
 * Converts timestamps from milliseconds to seconds and parses OHLC values
 */
export function formatCandleDataForChart(
  data: CandleData,
): CandlestickData<Time>[] {
  if (!data?.candles) {
    return [];
  }

  return data.candles
    .map((candle) => {
      // TradingView expects Unix timestamp in SECONDS
      const timeInSeconds = Math.floor(candle.time / 1000) as Time;

      const formatted: CandlestickData<Time> = {
        time: timeInSeconds,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
      };

      // Validate all values are valid numbers
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
    })
    .filter((candle): candle is CandlestickData<Time> => candle !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

/**
 * Formats raw candle data into volume histogram data for lightweight-charts
 * Transforms volume to USD notional value (volume × close price)
 * Colors bars based on candle direction (green = bullish, red = bearish)
 */
export function formatVolumeDataForChart(
  data: CandleData,
): HistogramData<Time>[] {
  if (!data?.candles) {
    return [];
  }

  return data.candles
    .map((candle) => {
      const timeInSeconds = Math.floor(candle.time / 1000) as Time;
      const volume = parseFloat(candle.volume || '0');
      const close = parseFloat(candle.close);
      const open = parseFloat(candle.open);

      // USD notional value = volume × close price
      const value = volume * close;

      // Color based on candle direction
      const isBullish = close >= open;
      const color = isBullish ? '#BAF24A' : '#FF7584';

      if (isNaN(value) || value <= 0) {
        return null;
      }

      return {
        time: timeInSeconds,
        value,
        color,
      };
    })
    .filter((item): item is HistogramData<Time> => item !== null)
    .sort((a, b) => (a.time as number) - (b.time as number));
}

