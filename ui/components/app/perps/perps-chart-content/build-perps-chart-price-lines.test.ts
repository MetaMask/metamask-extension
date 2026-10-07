import { buildPerpsChartPriceLines } from './build-perps-chart-price-lines';

describe('buildPerpsChartPriceLines', () => {
  it('builds valid current and position lines while skipping invalid prices', () => {
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

    expect(lines).toMatchObject([
      { price: 2900, label: '' },
      { price: 3200, label: 'TP' },
      { price: 2850, label: 'Entry' },
      { price: 2600, label: 'SL' },
    ]);
  });
});
