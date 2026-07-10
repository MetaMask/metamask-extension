import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  type RampsOrder,
} from '@metamask/ramps-controller';
import { selectRampsOrdersForSelectedAccount } from '../../selectors/rampsController';
import {
  addRampsOrder,
  addRampsPrecreatedOrder,
  getRampsOrderFromCallback,
  refreshRampsOrder,
  removeRampsOrder,
} from '../../store/controller-actions/ramps-controller';

export type AddPrecreatedOrderParams = {
  orderId: string;
  providerCode: string;
  walletAddress: string;
  chainId?: string;
};

export type UseRampsOrdersResult = {
  orders: RampsOrder[];
  getOrderById: (providerOrderId: string) => RampsOrder | undefined;
  addOrder: (order: RampsOrder) => Promise<void>;
  addPrecreatedOrder: (params: AddPrecreatedOrderParams) => Promise<void>;
  removeOrder: (providerOrderId: string) => Promise<void>;
  refreshOrder: (
    providerCode: string,
    orderCode: string,
    wallet: string,
  ) => Promise<RampsOrder>;
  getOrderFromCallback: (
    providerCode: string,
    callbackUrl: string,
    wallet: string,
  ) => Promise<RampsOrder>;
};

export function useRampsOrders(): UseRampsOrdersResult {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);

  const getOrderById = useCallback(
    (providerOrderId: string) => {
      const orderCode = getInternalOrderCode(providerOrderId);
      return orders.find((order) => getInternalOrderCode(order) === orderCode);
    },
    [orders],
  );

  const addOrder = useCallback((order: RampsOrder) => addRampsOrder(order), []);

  const addPrecreatedOrder = useCallback(
    (params: AddPrecreatedOrderParams) => addRampsPrecreatedOrder(params),
    [],
  );

  const removeOrder = useCallback(
    (providerOrderId: string) =>
      removeRampsOrder(getInternalOrderCode(providerOrderId)),
    [],
  );

  const refreshOrder = useCallback(
    (providerCode: string, orderCode: string, wallet: string) =>
      refreshRampsOrder(providerCode, orderCode, wallet),
    [],
  );

  const getOrderFromCallback = useCallback(
    (providerCode: string, callbackUrl: string, wallet: string) =>
      getRampsOrderFromCallback(providerCode, callbackUrl, wallet),
    [],
  );

  return {
    orders,
    getOrderById,
    addOrder,
    addPrecreatedOrder,
    removeOrder,
    refreshOrder,
    getOrderFromCallback,
  };
}

export default useRampsOrders;
