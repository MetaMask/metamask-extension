import { brandColor } from '@metamask/design-tokens';

import { parsePerpsDisplayPrice } from '../utils/formatPerpsDisplayPrice';
import type { ChartPriceLine } from '../perps-candlestick-chart';

export type PerpsChartPriceLinePosition = {
  entryPrice?: string | null;
  takeProfitPrice?: string | null;
  stopLossPrice?: string | null;
  liquidationPrice?: string | null;
};

export type BuildPerpsChartPriceLinesArgs = {
  chartCurrentPrice: number;
  isDark: boolean;
  position?: PerpsChartPriceLinePosition | null;
};

/**
 * Builds candlestick overlay lines for the current price plus any existing
 * position TP / Entry / SL / Liq markers. Unsaved form values are not included.
 *
 * @param args - Price, theme, and optional existing position.
 * @param args.chartCurrentPrice
 * @param args.isDark
 * @param args.position
 * @returns Overlay lines for `PerpsCandlestickChart`.
 */
export function buildPerpsChartPriceLines({
  chartCurrentPrice,
  isDark,
  position,
}: BuildPerpsChartPriceLinesArgs): ChartPriceLine[] {
  const lines: ChartPriceLine[] = [];

  if (chartCurrentPrice > 0) {
    lines.push({
      price: chartCurrentPrice,
      label: '',
      // Matches mobile `background.muted`: dark=#ffffff0a (~4%), light=#b4b4b528 (~16%)
      color: isDark ? '#ffffff0a' : '#b4b4b528',
      lineStyle: 2,
      lineWidth: 2,
    });
  }

  if (!position) {
    return lines;
  }

  const markers = [
    {
      value: position.takeProfitPrice,
      label: 'TP',
      color: isDark ? brandColor.lime100 : brandColor.lime500,
    },
    {
      value: position.entryPrice,
      label: 'Entry',
      color: isDark ? brandColor.grey600 : brandColor.grey200,
    },
    {
      value: position.stopLossPrice,
      label: 'SL',
      color: isDark ? brandColor.grey1000 : brandColor.grey050,
    },
    {
      value: position.liquidationPrice,
      label: 'Liq',
      color: isDark ? brandColor.red300 : brandColor.red500,
    },
  ];

  for (const { value, label, color } of markers) {
    if (value) {
      const price = parsePerpsDisplayPrice(value);
      if (!Number.isNaN(price) && price > 0) {
        lines.push({
          price,
          label,
          color,
          lineStyle: 2,
        });
      }
    }
  }

  return lines;
}
