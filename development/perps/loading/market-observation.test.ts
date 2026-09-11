import { it as jestIt } from '@jest/globals';
import { allMarketRowsMatch, observeMarketRows } from './market-observation';

describe('rendered market observation', () => {
  const formatPrice = (price: number) => `$${price}`;

  jestIt.each([
    ['full names disabled', 'market-row-BTC', 'BTC'],
    ['name equals ticker', 'explore-markets-xyz-AAPL', 'xyz:AAPL'],
    ['watchlist override', 'perps-watchlist-xyz:AAPL', 'xyz:AAPL'],
  ])(
    'identifies %s without a ticker-suffix element',
    (_label, testId, symbol) => {
      const rows = observeMarketRows(
        [{ testId, displayed: '$12' }],
        [{ symbol }],
        [{ symbol, price: '12' }],
        formatPrice,
      );
      expect(rows[0].symbol).toBe(symbol);
      expect(allMarketRowsMatch(rows)).toBe(true);
    },
  );

  jestIt.each(['--', '$0'])(
    'waits for a second row displaying %s',
    (displayed) => {
      const markets = [{ symbol: 'BTC' }, { symbol: 'ETH' }];
      const prices = [
        { symbol: 'BTC', price: '12' },
        { symbol: 'ETH', price: '34' },
      ];
      const rows = [
        { testId: 'market-row-BTC', displayed: '$12' },
        { testId: 'market-row-ETH', displayed },
      ];
      const pending = observeMarketRows(rows, markets, prices, formatPrice);
      expect(pending.some((row) => row.priced)).toBe(true);
      expect(pending).toHaveLength(2);
      expect(allMarketRowsMatch(pending)).toBe(false);

      rows[1].displayed = '$34';
      expect(
        allMarketRowsMatch(
          observeMarketRows(rows, markets, prices, formatPrice),
        ),
      ).toBe(true);
    },
  );

  it('rejects ambiguous normalized identities', () => {
    const rows = observeMarketRows(
      [{ testId: 'market-row-xyz-AAPL', displayed: '$12' }],
      [{ symbol: 'xyz:AAPL' }, { symbol: 'xyz-AAPL' }],
      [{ symbol: 'xyz:AAPL', price: '12' }],
      formatPrice,
    );
    expect(allMarketRowsMatch(rows)).toBe(false);
  });
});
