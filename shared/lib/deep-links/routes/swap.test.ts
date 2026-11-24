import { it as jestIt } from '@jest/globals';
import { HomeQueryParams } from './home';
import { DEFAULT_ROUTE, SWAP_ROUTE } from './route';
import { BridgeQueryParams, LIMIT_ORDER_TAB, swap } from './swap';

const ETH_ASSET_ID = 'eip155:1/slip44:60';
const USDC_ASSET_ID =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('swap deep link route', () => {
  it('opens the default route with a mobile-compatible Limit Order QR deeplink', () => {
    const params = new URLSearchParams({
      [BridgeQueryParams.Tab]: LIMIT_ORDER_TAB,
      [BridgeQueryParams.From]: ETH_ASSET_ID,
      [BridgeQueryParams.To]: USDC_ASSET_ID,
      [BridgeQueryParams.Amount]: '100000000000000000',
      expiresInMinutes: '10080',
      priceTolerance: '0.5',
    });

    const destination = swap.handler(params);

    expect(destination).toHaveProperty('path', DEFAULT_ROUTE);
    expect(
      (destination as { query: URLSearchParams }).query.get(
        HomeQueryParams.LimitOrderDeeplinkUrl,
      ),
    ).toBe(`https://link.metamask.io/swap?${params.toString()}`);
  });

  jestIt.each([undefined, 'Limit', 'market'])(
    'opens Extension Swaps when tab is %s',
    (tab) => {
      const params = new URLSearchParams({
        [BridgeQueryParams.From]: ETH_ASSET_ID,
        [BridgeQueryParams.To]: USDC_ASSET_ID,
        [BridgeQueryParams.Amount]: '100000000000000000',
      });
      if (tab) {
        params.set(BridgeQueryParams.Tab, tab);
      }

      const destination = swap.handler(params);

      expect(destination).toHaveProperty('path', SWAP_ROUTE);
      expect((destination as { query: URLSearchParams }).query.toString()).toBe(
        new URLSearchParams({
          [BridgeQueryParams.From]: ETH_ASSET_ID,
          [BridgeQueryParams.To]: USDC_ASSET_ID,
          [BridgeQueryParams.Amount]: '100000000000000000',
        }).toString(),
      );
    },
  );

  it('keeps the existing validation for Extension Swap asset prefills', () => {
    const params = new URLSearchParams({
      [BridgeQueryParams.From]: 'invalid',
      [BridgeQueryParams.To]: USDC_ASSET_ID,
      [BridgeQueryParams.Amount]: '1000000',
    });

    const destination = swap.handler(params);

    expect(destination).toHaveProperty('path', SWAP_ROUTE);
    expect((destination as { query: URLSearchParams }).query.toString()).toBe(
      new URLSearchParams({
        [BridgeQueryParams.To]: USDC_ASSET_ID,
        [BridgeQueryParams.Amount]: '1000000',
      }).toString(),
    );
  });
});
