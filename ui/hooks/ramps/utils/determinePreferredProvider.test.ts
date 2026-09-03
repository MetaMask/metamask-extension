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

  it('matches Portfolio-style /providers/ ids to bare catalog ids', () => {
    const result = determinePreferredProvider(
      [{ providerId: '/providers/moonpay-staging', completedAt: 1000 }],
      [
        { id: 'moonpay-staging', name: 'MoonPay Staging' } as Provider,
        transakProvider,
      ],
    );

    expect(result?.provider.id).toBe('moonpay-staging');
    expect(result?.autoSelected).toBe(false);
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

  it('normalizes Portfolio timestamps before selecting the latest provider', () => {
    const completedOrders = completedOrdersFromRampsOrders([
      {
        id: 'older',
        status: RampsOrderStatus.Completed,
        createdAt: 1784717900514,
        provider: transakProvider,
      },
      {
        id: 'portfolio',
        status: RampsOrderStatus.Completed,
        createdAt: '2026-09-03T20:53:56.153Z',
        provider: moonpayProvider,
      },
    ] as unknown as RampsOrder[]);

    expect({
      completedOrders,
      preferredProvider: determinePreferredProvider(completedOrders, [
        moonpayProvider,
        transakProvider,
      ]),
    }).toMatchInlineSnapshot(`
      {
        "completedOrders": [
          {
            "completedAt": 1784717900514,
            "providerId": "transak",
          },
          {
            "completedAt": 1788468836153,
            "providerId": "moonpay",
          },
        ],
        "preferredProvider": {
          "autoSelected": false,
          "provider": {
            "id": "moonpay",
            "name": "MoonPay",
          },
        },
      }
    `);
  });
});
