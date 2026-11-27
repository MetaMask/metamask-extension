import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { marketStatsQueryKey } from '@metamask/core-backend';

import { getAccountGroupLiveTotalState } from '#ui/selectors/assets';
import { useAccountGroupLiveTotal } from '#ui/hooks/assets/use-account-group-live-total';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('#ui/selectors/assets', () => ({
  getAccountGroupLiveTotalState: jest.fn(),
}));

describe('useAccountGroupLiveTotal re-render optimization', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not re-render when unrelated asset prices change', async () => {
    let renderCount = 0;
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const currency = 'usd';
    const ethAsset = {
      assetId: 'eip155:1/slip44:60',
      chainId: '0x1',
      balance: '1',
      fiat: { balance: 100 },
    };

    const stableSelectorState = {
      assets: [ethAsset],
      polledTotal: 100,
      currency,
      hasBalance: true,
    };

    jest.mocked(useSelector).mockImplementation((selector: unknown) => {
      if (selector === getAccountGroupLiveTotalState) {
        return stableSelectorState;
      }
      return currency;
    });

    queryClient.setQueryData(marketStatsQueryKey(currency), new Map());

    const { result } = renderHook(
      () => {
        renderCount += 1;
        return useAccountGroupLiveTotal();
      },
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      },
    );

    const firstRenderCount = renderCount;
    const firstResult = result.current;

    act(() => {
      queryClient.setQueryData(
        marketStatsQueryKey(currency),
        new Map([['eip155:1/slip44:60', { price: 150 }]]),
      );
    });

    await waitFor(() => {
      expect(renderCount).toBeGreaterThan(firstRenderCount);
    });
    expect(result.current.total).not.toBe(firstResult.total);

    const secondRenderCount = renderCount;
    const secondResult = result.current;

    act(() => {
      queryClient.setQueryData(
        marketStatsQueryKey(currency),
        new Map([
          ['eip155:1/slip44:60', { price: 150 }],
          ['unrelated-asset-1', { price: 100 }],
          ['unrelated-asset-2', { price: 200 }],
        ]),
      );
    });

    await waitFor(
      () => {
        expect(renderCount).toBe(secondRenderCount);
      },
      { timeout: 500 },
    );
    expect(result.current.total).toBe(secondResult.total);
  });
});
