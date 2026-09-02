import { brandColor } from '@metamask/design-tokens';

import { buildPerpsChartPriceLines } from './build-perps-chart-price-lines';

describe('buildPerpsChartPriceLines', () => {
  it('returns only the current-price line when there is no position', () => {
    expect(
      buildPerpsChartPriceLines({
        chartCurrentPrice: 2900,
        isDark: true,
      }),
    ).toStrictEqual([
      {
        price: 2900,
        label: '',
        color: '#ffffff0a',
        lineStyle: 2,
        lineWidth: 2,
      },
    ]);
  });

  it('omits the current-price line when the price is not positive', () => {
    expect(
      buildPerpsChartPriceLines({
        chartCurrentPrice: 0,
        isDark: false,
      }),
    ).toStrictEqual([]);
  });

  it('adds existing-position overlays and skips invalid prices', () => {
    const lines = buildPerpsChartPriceLines({
      chartCurrentPrice: 2900,
      isDark: false,
      position: {
        entryPrice: '2850.00',
        takeProfitPrice: '3200.00',
        stopLossPrice: '2600.00',
        liquidationPrice: '0',
      },
    });

    expect(lines.map((line) => line.label)).toStrictEqual([
      '',
      'TP',
      'Entry',
      'SL',
    ]);
    expect(lines.find((line) => line.label === 'TP')).toStrictEqual({
      price: 3200,
      label: 'TP',
      color: brandColor.lime500,
      lineStyle: 2,
    });
  });

  it('includes a liquidation line when the price is positive', () => {
    const lines = buildPerpsChartPriceLines({
      chartCurrentPrice: 2900,
      isDark: true,
      position: {
        liquidationPrice: '2400.00',
      },
    });

    expect(lines.find((line) => line.label === 'Liq')).toStrictEqual({
      price: 2400,
      label: 'Liq',
      color: brandColor.red300,
      lineStyle: 2,
    });
  });
});
