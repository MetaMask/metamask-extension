import { renderHook } from '@testing-library/react';
import type { RampsOrder } from '@metamask/ramps-controller';
import { mapRampsOrderSafely } from '../../../../hooks/ramps/utils/mapRampsOrderSafely';
import { useRampsOrders } from '../../../../hooks/ramps/useRampsOrders';
import { useRampsDetailsItem } from './hooks';

jest.mock('../../../../hooks/ramps/useRampsOrders');
jest.mock('../../../../hooks/ramps/utils/mapRampsOrderSafely', () => ({
  mapRampsOrderSafely: jest.fn(),
}));

const mockUseRampsOrders = jest.mocked(useRampsOrders);
const mockMapRampsOrderSafely = jest.mocked(mapRampsOrderSafely);

const pendingOrder = {
  providerOrderId: 'order-1',
  status: 'PENDING',
  txHash: '0xsettled',
} as unknown as RampsOrder;

describe('useRampsDetailsItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRampsOrders.mockReturnValue({
      orders: [],
      getOrderById: () => undefined,
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });
    mockMapRampsOrderSafely.mockReturnValue(undefined);
  });

  it('returns undefined when there is no identifier', () => {
    const { result } = renderHook(() => useRampsDetailsItem(undefined));

    expect(result.current).toBeUndefined();
    expect(mockMapRampsOrderSafely).not.toHaveBeenCalled();
  });

  it('maps an order looked up by id', () => {
    mockUseRampsOrders.mockReturnValue({
      orders: [],
      getOrderById: (id) => (id === 'order-1' ? pendingOrder : undefined),
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'pending',
      timestamp: 1,
      data: { id: 'order-1' },
    } as never);

    const { result } = renderHook(() => useRampsDetailsItem('order-1'));

    expect(mockMapRampsOrderSafely).toHaveBeenCalledWith(pendingOrder);
    expect(result.current).toMatchObject({
      type: 'rampBuy',
      data: { id: 'order-1' },
    });
  });

  it('looks up by settlement hash when id lookup misses', () => {
    mockUseRampsOrders.mockReturnValue({
      orders: [pendingOrder],
      getOrderById: () => undefined,
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'rampBuy',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      hash: '0xsettled',
      data: { id: 'order-1' },
    } as never);

    const { result } = renderHook(() => useRampsDetailsItem('0xsettled'));

    expect(mockMapRampsOrderSafely).toHaveBeenCalledWith(pendingOrder);
    expect(result.current).toMatchObject({ hash: '0xsettled' });
  });

  it('returns undefined when the order cannot be mapped as a ramp item', () => {
    mockUseRampsOrders.mockReturnValue({
      orders: [],
      getOrderById: () => pendingOrder,
      addOrder: jest.fn(),
      addPrecreatedOrder: jest.fn(),
      removeOrder: jest.fn(),
      refreshOrder: jest.fn(),
      getOrderFromCallback: jest.fn(),
    });
    mockMapRampsOrderSafely.mockReturnValue({
      type: 'send',
      chainId: 'eip155:1',
      status: 'success',
      timestamp: 1,
      data: {},
    } as never);

    const { result } = renderHook(() => useRampsDetailsItem('order-1'));

    expect(result.current).toBeUndefined();
  });
});
