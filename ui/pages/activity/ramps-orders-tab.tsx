import React, { useMemo, useState } from 'react';
import type { RampsOrder } from '@metamask/ramps-controller';
import { Button, Text, TextVariant } from '@metamask/design-system-react';
import { useRampsOrders } from '../../hooks/ramps/useRampsOrders';
import { useAppSelector } from '../../store/store';
import { selectRampsOrders } from '../../selectors/rampsController';
import { syncRampsOrdersWithUserStorage } from '../../store/controller-actions/ramps-controller';
import { getOrderKey, RampsOrderCard } from './ramps-order-card';
import { RampsOrderDetailModal } from './ramps-order-detail-modal';

export const RampsOrdersTab = () => {
  const { orders: accountOrders } = useRampsOrders();
  const allOrders = useAppSelector(selectRampsOrders);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RampsOrder | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sortedOrders = useMemo(
    () =>
      [...allOrders].sort(
        (left, right) => (right.createdAt ?? 0) - (left.createdAt ?? 0),
      ),
    [allOrders],
  );

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Syncing...');

    try {
      await syncRampsOrdersWithUserStorage();
      setSyncStatus('Sync complete');
    } catch (error) {
      setSyncStatus(
        `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="flex flex-col gap-4 px-4 pb-4"
      data-testid="ramps-orders-tab"
    >
      <div className="rounded-xl border border-border-muted bg-background-muted p-4">
        <Text variant={TextVariant.BodyMd} className="font-medium">
          Ramps order sync QA
        </Text>
        <Text variant={TextVariant.BodySm} className="mt-1 text-alternative">
          All orders: {allOrders.length} · Selected account:{' '}
          {accountOrders.length}
        </Text>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            data-testid="ramps-orders-sync-button"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing…' : 'Sync from User Storage'}
          </Button>
          {syncStatus ? (
            <Text variant={TextVariant.BodySm} className="text-alternative">
              {syncStatus}
            </Text>
          ) : null}
        </div>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-muted p-6 text-center">
          <Text variant={TextVariant.BodyMd}>
            No ramps orders in controller state.
          </Text>
          <Text variant={TextVariant.BodySm} className="mt-1 text-alternative">
            Use sync above after completing a buy flow on another client.
          </Text>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedOrders.map((order) => (
            <RampsOrderCard
              key={getOrderKey(order)}
              order={order}
              onSelect={setSelectedOrder}
            />
          ))}
        </div>
      )}

      {selectedOrder ? (
        <RampsOrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      ) : null}
    </div>
  );
};

export default RampsOrdersTab;
