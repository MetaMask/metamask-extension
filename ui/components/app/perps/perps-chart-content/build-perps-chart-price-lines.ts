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

  if (position.takeProfitPrice) {
    const tpPrice = parsePerpsDisplayPrice(position.takeProfitPrice);
    if (!Number.isNaN(tpPrice) && tpPrice > 0) {
      lines.push({
        price: tpPrice,
        label: 'TP',
        color: isDark ? brandColor.lime100 : brandColor.lime500,
        lineStyle: 2,
      });
    }
  }

  if (position.entryPrice) {
    const entryPrice = parsePerpsDisplayPrice(position.entryPrice);
    if (!Number.isNaN(entryPrice) && entryPrice > 0) {
      lines.push({
        price: entryPrice,
        label: 'Entry',
        color: isDark ? brandColor.grey600 : brandColor.grey200,
        lineStyle: 2,
      });
    }
  }

  if (position.stopLossPrice) {
    const slPrice = parsePerpsDisplayPrice(position.stopLossPrice);
    if (!Number.isNaN(slPrice) && slPrice > 0) {
      lines.push({
        price: slPrice,
        label: 'SL',
        color: isDark ? brandColor.grey1000 : brandColor.grey050,
        lineStyle: 2,
      });
    }
  }

  if (position.liquidationPrice) {
    const liqPrice = parsePerpsDisplayPrice(position.liquidationPrice);
    if (!Number.isNaN(liqPrice) && liqPrice > 0) {
      lines.push({
        price: liqPrice,
        label: 'Liq',
        color: isDark ? brandColor.red300 : brandColor.red500,
        lineStyle: 2,
      });
    }
  }

  return lines;
}
