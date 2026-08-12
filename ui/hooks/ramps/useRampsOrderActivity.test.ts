import { renderHook } from '@testing-library/react';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';
import { useRampsOrderActivity } from './useRampsOrderActivity';

const buyOrderData = {
  provider: { id: 'transak', name: 'Transak' },
  cryptoAmount: '1.5',
  fiatAmount: 100,
  cryptoCurrency: { symbol: 'ETH', assetId: 'eip155:1/slip44:60' },
  fiatCurrency: { symbol: 'USD' },
  providerOrderId: 'order-1',
  providerOrderLink: 'https://transak.example/order-1',
  createdAt: 1700000000000,
  totalFeesFiat: 2,
  txHash: '',
  walletAddress: '0xabc123',
  status: 'COMPLETED',
  network: { chainId: '1', name: 'Ethereum' },
  orderType: 'buy',
};
// buyOrderData isn't assignable to RampsOrder as an object literal (missing
// fields), but spreading a `never`-typed const is a TS error — cast only at
// the point of use, keeping the plain object spreadable for other tests.
const buyOrder = buyOrderData as never;

describe('useRampsOrderActivity', () => {
  it('maps ramps orders into activity items filtered by network', () => {
    const store = createRampsMockStore({ orders: [buyOrder] });

    const { result } = renderHook(
      () => useRampsOrderActivity({ networks: ['eip155:1'] }),
      { wrapper: createRampsTestWrapper(store) },
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({
      type: 'rampBuy',
      chainId: 'eip155:1',
      data: { id: 'order-1' },
    });
  });

  it('excludes orders whose chain is not in the selected networks', () => {
    const store = createRampsMockStore({ orders: [buyOrder] });

    const { result } = renderHook(
      () => useRampsOrderActivity({ networks: ['eip155:137'] }),
      { wrapper: createRampsTestWrapper(store) },
    );

    expect(result.current).toHaveLength(0);
  });

  it('returns an empty list when no networks are selected and no assetId filter is given', () => {
    const store = createRampsMockStore({ orders: [buyOrder] });

    const { result } = renderHook(
      () => useRampsOrderActivity({ networks: [] }),
      {
        wrapper: createRampsTestWrapper(store),
      },
    );

    expect(result.current).toHaveLength(0);
  });

  it('filters by assetId when provided', () => {
    const store = createRampsMockStore({ orders: [buyOrder] });

    const { result } = renderHook(
      () => useRampsOrderActivity({ assetId: 'eip155:1/slip44:60' as never }),
      { wrapper: createRampsTestWrapper(store) },
    );

    expect(result.current).toHaveLength(1);
  });

  it('does not use the array index as a fallback chainId for a not-yet-populated order', () => {
    const precreatedOrder = {
      ...buyOrderData,
      providerOrderId: 'order-2',
      network: null,
      cryptoCurrency: null,
      status: 'PRECREATED',
    };
    const store = createRampsMockStore({
      orders: [buyOrder, precreatedOrder],
    });

    const { result } = renderHook(
      () => useRampsOrderActivity({ networks: ['eip155:1'] }),
      { wrapper: createRampsTestWrapper(store) },
    );

    expect(result.current).toHaveLength(1);
    expect(result.current[0]).toMatchObject({ data: { id: 'order-1' } });
  });
});
