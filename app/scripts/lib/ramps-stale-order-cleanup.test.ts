import {
  RampsOrderStatus,
  type RampsController,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { removeStalePrecreatedOrders } from './ramps-stale-order-cleanup';

const HOUR_MS = 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

function createController(orders: Partial<RampsOrder>[]) {
  const removeOrder = jest.fn();
  const rampsController = {
    state: { orders },
    removeOrder,
  } as unknown as RampsController;

  return { rampsController, removeOrder };
}

describe('removeStalePrecreatedOrders', () => {
  it('removes precreated stubs whose id window has closed', () => {
    const { rampsController, removeOrder } = createController([
      {
        providerOrderId: 'c-expired',
        status: RampsOrderStatus.Precreated,
        createdAt: NOW - HOUR_MS - 1,
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([
      'c-expired',
    ]);
    expect(removeOrder).toHaveBeenCalledWith('c-expired');
  });

  it('keeps precreated stubs that can still resolve', () => {
    const { rampsController, removeOrder } = createController([
      {
        providerOrderId: 'c-fresh',
        status: RampsOrderStatus.Precreated,
        createdAt: NOW - 1000,
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([]);
    expect(removeOrder).not.toHaveBeenCalled();
  });

  it('prefers the expiration stamped by the API over the stub age', () => {
    const { rampsController } = createController([
      {
        providerOrderId: 'c-api-expired',
        status: RampsOrderStatus.Precreated,
        createdAt: null as unknown as number,
        idExpirationDate: NOW - 1,
      },
      {
        providerOrderId: 'c-api-valid',
        status: RampsOrderStatus.Precreated,
        createdAt: NOW - HOUR_MS - 1,
        idExpirationDate: NOW + HOUR_MS,
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([
      'c-api-expired',
    ]);
  });

  it('removes orders the provider reported as expired', () => {
    const { rampsController } = createController([
      {
        providerOrderId: 'c-id-expired',
        status: RampsOrderStatus.IdExpired,
        createdAt: NOW,
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([
      'c-id-expired',
    ]);
  });

  it('never removes orders the provider filled in', () => {
    const { rampsController, removeOrder } = createController([
      {
        providerOrderId: 'real-completed',
        status: RampsOrderStatus.Completed,
        createdAt: NOW - HOUR_MS * 5,
        txHash: '0xabc',
      },
      {
        providerOrderId: 'real-pending',
        status: RampsOrderStatus.Pending,
        createdAt: NOW - HOUR_MS * 5,
      },
      {
        providerOrderId: 'expired-with-data',
        status: RampsOrderStatus.IdExpired,
        createdAt: NOW - HOUR_MS * 5,
        cryptoCurrency: { symbol: 'ETH' } as RampsOrder['cryptoCurrency'],
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([]);
    expect(removeOrder).not.toHaveBeenCalled();
  });

  it('removes stale unknown stubs that never gained data', () => {
    const { rampsController } = createController([
      {
        providerOrderId: 'c-unknown',
        status: RampsOrderStatus.Unknown,
        createdAt: null as unknown as number,
        idExpirationDate: NOW - 1,
      },
    ]);

    expect(removeStalePrecreatedOrders(rampsController, NOW)).toStrictEqual([
      'c-unknown',
    ]);
  });
});
