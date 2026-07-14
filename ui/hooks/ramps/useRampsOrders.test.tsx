import { renderHook, act } from '@testing-library/react-hooks';
import {
  addRampsOrder,
  addRampsPrecreatedOrder,
  getRampsOrderFromCallback,
  refreshRampsOrder,
  removeRampsOrder,
} from '../../store/controller-actions/ramps-controller';
import { useRampsOrders } from './useRampsOrders';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  addRampsOrder: jest.fn().mockResolvedValue(undefined),
  addRampsPrecreatedOrder: jest.fn().mockResolvedValue(undefined),
  removeRampsOrder: jest.fn().mockResolvedValue(undefined),
  refreshRampsOrder: jest.fn().mockResolvedValue({ id: 'order-1' }),
  getRampsOrderFromCallback: jest.fn().mockResolvedValue({ id: 'order-1' }),
}));

const order = {
  id: '1',
  providerOrderId: 'order-1',
  walletAddress: '0xabc123',
  status: 'COMPLETED',
  createdAt: 1,
} as never;

describe('useRampsOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches snapshot', () => {
    const { result } = renderHook(() => useRampsOrders(), {
      wrapper: createRampsTestWrapper(),
    });

    expect(result.current).toMatchSnapshot();
  });

  it('finds orders by provider order id and forwards write actions', async () => {
    const store = createRampsMockStore({
      orders: [order],
    });

    const { result } = renderHook(() => useRampsOrders(), {
      wrapper: createRampsTestWrapper(store),
    });

    expect(
      result.current.getOrderById('/providers/transak/orders/order-1'),
    ).toEqual(order);
    expect(result.current.getOrderById('order-1')).toEqual(order);

    await act(async () => {
      await result.current.addOrder(order);
      await result.current.addPrecreatedOrder({
        orderId: 'order-1',
        providerCode: 'transak',
        walletAddress: '0xabc123',
      });
      await result.current.removeOrder('/providers/transak/orders/order-1');
      await result.current.refreshOrder('transak', 'order-1', '0xabc123');
      await result.current.getOrderFromCallback(
        'transak',
        'https://callback',
        '0xabc123',
      );
    });

    expect(addRampsOrder).toHaveBeenCalledWith(order);
    expect(addRampsPrecreatedOrder).toHaveBeenCalledWith({
      orderId: 'order-1',
      providerCode: 'transak',
      walletAddress: '0xabc123',
    });
    expect(removeRampsOrder).toHaveBeenCalledWith('order-1');
    expect(refreshRampsOrder).toHaveBeenCalledWith(
      'transak',
      'order-1',
      '0xabc123',
    );
    expect(getRampsOrderFromCallback).toHaveBeenCalledWith(
      'transak',
      'https://callback',
      '0xabc123',
    );
  });
});
