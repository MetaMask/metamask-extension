import React from 'react';
import { renderHook } from '@testing-library/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RampsOrderStatus } from '@metamask/ramps-controller';
import {
  selectRampsProviderForAsset,
  setRampsSelectedPaymentMethod,
  setRampsSelectedProvider,
} from '../../store/controller-actions/ramps-controller';
import {
  isBuyScreenOwningProviderPick,
  useBuyScreenOwnsProviderPick,
} from './providerPickCoordination';
import { useRampsProviders } from './useRampsProviders';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
    useQueryClient: jest.fn(),
  };
});

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsSelectedProvider: jest.fn().mockResolvedValue(undefined),
  setRampsSelectedPaymentMethod: jest.fn().mockResolvedValue(undefined),
  selectRampsProviderForAsset: jest.fn().mockResolvedValue(null),
  getRampsProviders: jest.fn().mockResolvedValue({ providers: [] }),
}));

const mockedUseQuery = jest.mocked(useQuery);
const mockedUseQueryClient = jest.mocked(useQueryClient);

const transakProvider = {
  id: 'transak',
  name: 'Transak',
};
const moonpayProvider = {
  id: '/providers/moonpay',
  name: 'MoonPay',
};

describe('useRampsProviders', () => {
  const invalidateQueries = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseQueryClient.mockReturnValue({
      invalidateQueries,
    } as never);
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
    } as never);
  });

  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsProviders(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });

  it('clears selected provider and payment method when region changes', () => {
    const storeRef = {
      current: createRampsMockStore({
        userRegion: {
          regionCode: 'us-ca',
          country: { currency: 'USD', isoCode: 'US', name: 'United States' },
        },
        providers: {
          data: [],
          selected: transakProvider,
          isLoading: false,
          error: null,
        },
      }),
    };

    const { rerender } = renderHook(
      () => useRampsProviders({ enableSideEffects: true }),
      {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          createRampsTestWrapper(storeRef.current)({ children }),
      },
    );

    storeRef.current = createRampsMockStore({
      userRegion: {
        regionCode: 'gb',
        country: {
          currency: 'GBP',
          isoCode: 'GB',
          name: 'United Kingdom',
        },
      },
      providers: {
        data: [],
        selected: transakProvider,
        isLoading: false,
        error: null,
      },
    });

    rerender();

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['ramps'],
      refetchType: 'none',
    });
    expect(setRampsSelectedProvider).toHaveBeenCalledWith(null, undefined);
    expect(setRampsSelectedPaymentMethod).toHaveBeenCalledWith(null);
  });

  it('clears a stale selected provider that is not in the current provider list', () => {
    mockedUseQuery.mockReturnValue({
      data: [transakProvider],
      isLoading: false,
    } as never);

    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider],
            selected: { id: 'moonpay', name: 'MoonPay' },
            isLoading: false,
            error: null,
          },
        }),
      ),
    });

    expect(setRampsSelectedProvider).toHaveBeenCalledWith(null, undefined);
    expect(setRampsSelectedPaymentMethod).toHaveBeenCalledWith(null);
  });

  it('picks a provider for the selected token when none is selected', () => {
    mockedUseQuery.mockReturnValue({
      data: [transakProvider],
      isLoading: false,
    } as never);

    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider],
            selected: null,
            isLoading: false,
            error: null,
          },
          tokens: {
            data: null,
            selected: { assetId: 'eip155:1/slip44:60' },
            isLoading: false,
            error: null,
          },
        }),
      ),
    });

    expect(selectRampsProviderForAsset).toHaveBeenCalledWith(
      'eip155:1/slip44:60',
      { aheadOfHistory: [] },
    );
  });

  it('passes the ahead-of-history flag list to the picker', () => {
    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider],
            selected: null,
            isLoading: false,
            error: null,
          },
          remoteFeatureFlags: {
            rampsProvidersAheadOfHistory: {
              enabled: true,
              minimumVersion: '0.0.0',
              providerIds: ['crossmint'],
            },
          },
        }),
      ),
    });

    expect(selectRampsProviderForAsset).toHaveBeenCalledWith(null, {
      aheadOfHistory: ['crossmint'],
    });
  });

  it('re-picks an auto-selected provider', () => {
    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider, moonpayProvider],
            selected: transakProvider,
            isLoading: false,
            error: null,
          },
          providerAutoSelected: true,
        }),
      ),
    });

    expect(selectRampsProviderForAsset).toHaveBeenCalledTimes(1);
  });

  it('leaves a provider the user picked alone', () => {
    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider, moonpayProvider],
            selected: transakProvider,
            isLoading: false,
            error: null,
          },
          providerAutoSelected: false,
          orders: [
            {
              id: '/providers/moonpay/orders/order-1',
              provider: moonpayProvider,
              status: RampsOrderStatus.Completed,
              createdAt: 1,
              walletAddress: '0xabc123',
            },
          ],
        }),
      ),
    });

    expect(selectRampsProviderForAsset).not.toHaveBeenCalled();
  });

  it('leaves the pick to a mounted Buy screen', () => {
    const { unmount } = renderHook(() => useBuyScreenOwnsProviderPick());
    expect(isBuyScreenOwningProviderPick()).toBe(true);

    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [transakProvider],
            selected: null,
            isLoading: false,
            error: null,
          },
        }),
      ),
    });

    expect(selectRampsProviderForAsset).not.toHaveBeenCalled();
    unmount();
    expect(isBuyScreenOwningProviderPick()).toBe(false);
  });

  it('lists previously used providers from every account, most recent first', () => {
    mockedUseQuery.mockReturnValue({
      data: [transakProvider, moonpayProvider],
      isLoading: false,
    } as never);

    const { result } = renderHook(() => useRampsProviders(), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          orders: [
            {
              id: '/providers/transak/orders/order-1',
              provider: transakProvider,
              status: RampsOrderStatus.Completed,
              createdAt: 1,
              walletAddress: '0xother',
            },
            {
              id: '/providers/moonpay/orders/order-2',
              provider: moonpayProvider,
              status: RampsOrderStatus.Completed,
              createdAt: 2,
              walletAddress: '0xabc123',
            },
            {
              id: '/providers/transak/orders/order-3',
              provider: transakProvider,
              status: RampsOrderStatus.Pending,
              createdAt: 3,
              walletAddress: '0xabc123',
            },
          ],
        }),
      ),
    });

    expect(result.current.previouslyUsedProviderIds).toStrictEqual([
      '/providers/moonpay',
      'transak',
    ]);
  });

  it('returns a providers state error when the query is unavailable', () => {
    mockedUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as never);

    const { result } = renderHook(() => useRampsProviders(), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
          providers: {
            data: [],
            selected: null,
            isLoading: false,
            error: 'Failed to load providers',
          },
        }),
      ),
    });

    expect(result.current.error).toBe('Failed to load providers');
  });
});
