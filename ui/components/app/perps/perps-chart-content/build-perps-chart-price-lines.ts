import { brandColor } from '@metamask/design-tokens';

import { parsePerpsDisplayPrice } from '../utils/formatPerpsDisplayPrice';
import type { ChartPriceLine } from '../perps-candlestick-chart';

export type BuildPerpsChartPriceLinesArgs = {
  chartCurrentPrice: number;
  isDark: boolean;
  position?: {
    entryPrice?: string | null;
    takeProfitPrice?: string | null;
    stopLossPrice?: string | null;
    liquidationPrice?: string | null;
  } | null;
};

/**
 * Builds current and existing-position overlays, excluding unsaved values.
 * @param options
 */
export function buildPerpsChartPriceLines(
  options: BuildPerpsChartPriceLinesArgs,
): ChartPriceLine[] {
  const { chartCurrentPrice, isDark, position } = options;
  const lines: ChartPriceLine[] = [];

  if (chartCurrentPrice > 0) {
    lines.push({
      price: chartCurrentPrice,
      label: '',
      color: isDark ? '#ffffff0a' : '#b4b4b528',
      lineStyle: 2,
      lineWidth: 2,
    });
  }

  if (!position) {
    return lines;
  }

  const markers = [
    [
      position.takeProfitPrice,
      'TP',
      isDark ? brandColor.lime100 : brandColor.lime500,
    ],
    [
      position.entryPrice,
      'Entry',
      isDark ? brandColor.grey600 : brandColor.grey200,
    ],
    [
      position.stopLossPrice,
      'SL',
      isDark ? brandColor.grey1000 : brandColor.grey050,
    ],
    [
      position.liquidationPrice,
      'Liq',
      isDark ? brandColor.red300 : brandColor.red500,
    ],
  ] as const;

  for (const [value, label, color] of markers) {
    const price = value ? parsePerpsDisplayPrice(value) : 0;
    if (price > 0) {
      lines.push({ price, label, color, lineStyle: 2 });
    }
  }

  return lines;
}
