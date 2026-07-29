import {
  type Provider,
  type RampsOrder,
  RampsOrderStatus,
} from '@metamask/ramps-controller';

export type CompletedOrderInfo = {
  providerId: string;
  completedAt: number;
};

export function completedOrdersFromRampsOrders(
  orders: RampsOrder[],
): CompletedOrderInfo[] {
  return orders
    .filter((order) => order.status === RampsOrderStatus.Completed)
    .reduce<CompletedOrderInfo[]>((acc, order) => {
      const providerId = order.provider?.id;
      if (providerId) {
        acc.push({ providerId, completedAt: order.createdAt });
      }
      return acc;
    }, []);
}

export type PreferredProviderResult = {
  provider: Provider;
  autoSelected: boolean;
};

export function determinePreferredProvider(
  completedOrders: CompletedOrderInfo[],
  providers: Provider[],
): PreferredProviderResult | null {
  if (!providers.length) {
    return null;
  }

  const sortedOrders = [...completedOrders].sort(
    (a, b) => b.completedAt - a.completedAt,
  );
  const mostRecentProviderId = sortedOrders[0]?.providerId;

  if (mostRecentProviderId) {
    const previousProvider = providers.find(
      (provider) => provider.id === mostRecentProviderId,
    );
    if (previousProvider) {
      return { provider: previousProvider, autoSelected: false };
    }
  }

  const transakProvider = providers.find((provider) =>
    provider.id?.toLowerCase().includes('transak'),
  );
  if (transakProvider) {
    return { provider: transakProvider, autoSelected: true };
  }

  return null;
}
