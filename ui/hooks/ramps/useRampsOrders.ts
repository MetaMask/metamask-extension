import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RampsOrder } from '@metamask/ramps-controller';
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

function extractOrderCode(providerOrderId: string): string {
  const parts = providerOrderId.split('/');
  return parts[parts.length - 1] ?? providerOrderId;
}

export function useRampsOrders(): UseRampsOrdersResult {
  const orders = useSelector(selectRampsOrdersForSelectedAccount);

  const getOrderById = useCallback(
    (providerOrderId: string) => {
      const orderCode = extractOrderCode(providerOrderId);
      return orders.find((order) => order.providerOrderId === orderCode);
    },
    [orders],
  );

  const addOrder = useCallback((order: RampsOrder) => addRampsOrder(order), []);

  const addPrecreatedOrder = useCallback(
    (params: AddPrecreatedOrderParams) => addRampsPrecreatedOrder(params),
    [],
  );

  const removeOrder = useCallback(
    (providerOrderId: string) => removeRampsOrder(providerOrderId),
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
