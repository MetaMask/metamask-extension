import { renderHook } from '@testing-library/react';
import { RampsOrderStatus, type Provider } from '@metamask/ramps-controller';
import {
  useProviderPickerOptions,
  usePreviouslyUsedProviderIds,
} from './useProviderPickerOptions';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

const transak = { id: 'transak', name: 'Transak' } as Provider;
const moonpay = { id: '/providers/moonpay', name: 'MoonPay' } as Provider;

function createOrder(
  provider: Provider,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `${provider.id}/orders/1`,
    provider,
    status: RampsOrderStatus.Completed,
    createdAt: 1,
    walletAddress: '0xabc123',
    ...overrides,
  };
}

describe('useProviderPickerOptions', () => {
  it('returns an empty ahead-of-history list when the flag is missing', () => {
    const { result } = renderHook(() => useProviderPickerOptions(), {
      wrapper: createRampsTestWrapper(createRampsMockStore()),
    });

    expect(result.current).toStrictEqual({ aheadOfHistory: [] });
  });

  it('returns the provider ids of an enabled flag', () => {
    const { result } = renderHook(() => useProviderPickerOptions(), {
      wrapper: createRampsTestWrapper(
        createRampsMockStore({
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

    expect(result.current).toStrictEqual({ aheadOfHistory: ['crossmint'] });
  });
});

describe('usePreviouslyUsedProviderIds', () => {
  it('lists providers with a completed buy on any account, most recent first', () => {
    const { result } = renderHook(
      () => usePreviouslyUsedProviderIds([transak, moonpay]),
      {
        wrapper: createRampsTestWrapper(
          createRampsMockStore({
            orders: [
              createOrder(transak, { createdAt: 1, walletAddress: '0xother' }),
              createOrder(moonpay, { createdAt: 2 }),
            ],
          }),
        ),
      },
    );

    expect(result.current).toStrictEqual(['/providers/moonpay', 'transak']);
  });

  it('keeps the same list when the provider list is rebuilt with the same ids', () => {
    const { result, rerender } = renderHook(
      ({ providers }) => usePreviouslyUsedProviderIds(providers),
      {
        initialProps: { providers: [transak, moonpay] },
        wrapper: createRampsTestWrapper(
          createRampsMockStore({ orders: [createOrder(transak)] }),
        ),
      },
    );
    const first = result.current;

    rerender({ providers: [{ ...transak }, { ...moonpay }] });

    expect(result.current).toBe(first);
  });
});
