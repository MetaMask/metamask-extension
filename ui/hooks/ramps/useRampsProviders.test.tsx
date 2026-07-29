import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  setRampsSelectedPaymentMethod,
  setRampsSelectedProvider,
} from '../../store/controller-actions/ramps-controller';
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
  getRampsProviders: jest.fn().mockResolvedValue({ providers: [] }),
}));

const mockedUseQuery = jest.mocked(useQuery);
const mockedUseQueryClient = jest.mocked(useQueryClient);

const transakProvider = {
  id: 'transak',
  name: 'Transak',
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

  it('auto-selects a provider when none is selected', () => {
    mockedUseQuery.mockReturnValue({
      data: [transakProvider],
      isLoading: false,
    } as never);

    renderHook(() => useRampsProviders({ enableSideEffects: true }), {
      wrapper: createRampsTestWrapper(),
    });

    expect(setRampsSelectedProvider).toHaveBeenCalledWith('transak', {
      autoSelected: true,
    });
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
