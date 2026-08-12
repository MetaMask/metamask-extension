import {
  RampsOrderStatus,
  type Provider,
  type RampsOrder,
} from '@metamask/ramps-controller';
import {
  completedOrdersFromRampsOrders,
  determinePreferredProvider,
} from './determinePreferredProvider';

const transakProvider = {
  id: 'transak',
  name: 'Transak',
} as Provider;

const moonpayProvider = {
  id: 'moonpay',
  name: 'MoonPay',
} as Provider;

describe('determinePreferredProvider', () => {
  it('auto-selects Transak when there is no completed order history', () => {
    const result = determinePreferredProvider(
      [],
      [moonpayProvider, transakProvider],
    );

    expect(result).toEqual({
      provider: transakProvider,
      autoSelected: true,
    });
  });

  it('prefers the most recent completed order provider without auto-selecting', () => {
    const result = determinePreferredProvider(
      [{ providerId: 'moonpay', completedAt: 1000 }],
      [moonpayProvider, transakProvider],
    );

    expect(result).toEqual({
      provider: moonpayProvider,
      autoSelected: false,
    });
  });

  it('returns null when providers are empty', () => {
    expect(determinePreferredProvider([], [])).toBeNull();
  });
});

describe('completedOrdersFromRampsOrders', () => {
  it('includes only completed orders with provider ids', () => {
    const orders = completedOrdersFromRampsOrders([
      {
        id: '1',
        status: RampsOrderStatus.Completed,
        createdAt: 1000,
        provider: moonpayProvider,
      },
      {
        id: '2',
        status: RampsOrderStatus.Pending,
        createdAt: 2000,
        provider: transakProvider,
      },
      {
        id: '3',
        status: RampsOrderStatus.Completed,
        createdAt: 3000,
        provider: undefined,
      },
    ] as RampsOrder[]);

    expect(orders).toEqual([{ providerId: 'moonpay', completedAt: 1000 }]);
  });
});
