import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { marketStatsQueryKey, type LiveQuote } from '@metamask/core-backend';
import type { TokenWithFiatAmount } from '../types';
import { useLiveToken } from './useLiveToken';

jest.mock('react-redux', () => ({
  useSelector: (
    selector: (state: { metamask: { currentCurrency: string } }) => unknown,
  ) => selector({ metamask: { currentCurrency: 'usd' } }),
}));

const ETH = 'eip155:1/slip44:60';
const POL = 'eip155:137/slip44:966';

const token = {
  caipAssetId: ETH,
  balance: '2',
  tokenFiatAmount: 200,
  fiat: { balance: 200, conversionRate: 100, currency: 'usd' },
} as unknown as TokenWithFiatAmount;

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const tick = (quotes: [string, LiveQuote][]) =>
    act(() => {
      queryClient.setQueryData(marketStatsQueryKey('usd'), new Map(quotes));
    });
  return { wrapper, tick };
}

describe('useLiveToken', () => {
  it('returns the row as given before a quote arrives', () => {
    const { wrapper } = setup();

    const { result } = renderHook(() => useLiveToken(token), { wrapper });

    expect(result.current).toBe(token);
  });

  it('stamps the live price, change and fiat balance from the row quote', async () => {
    const { wrapper, tick } = setup();
    const { result } = renderHook(() => useLiveToken(token), { wrapper });

    tick([[ETH, { price: 150, pricePercentChange1d: 2.5 }]]);

    await waitFor(() => {
      expect(result.current).toMatchObject({
        livePrice: 150,
        pricePercentChange1d: 2.5,
        tokenFiatAmount: 300,
      });
    });
  });

  it('keeps the row when a tick is for another asset', async () => {
    const { wrapper, tick } = setup();
    const { result } = renderHook(() => useLiveToken(token), { wrapper });

    tick([[POL, { price: 1 }]]);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current).toBe(token);
  });
});
