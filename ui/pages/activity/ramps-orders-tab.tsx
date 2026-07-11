import React, { useState } from 'react';
import { useRampsOrders } from '../../hooks/ramps/useRampsOrders';
import { useAppSelector } from '../../store/store';
import { selectRampsOrders } from '../../selectors/rampsController';
import { syncRampsOrdersWithUserStorage } from '../../store/controller-actions/ramps-controller';

export const RampsOrdersTab = () => {
  const { orders: accountOrders } = useRampsOrders();
  const allOrders = useAppSelector(selectRampsOrders);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncStatus('Syncing...');
    try {
      await syncRampsOrdersWithUserStorage();
      setSyncStatus('Sync complete');
    } catch (error) {
      setSyncStatus(
        `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="px-4 pb-4 flex flex-col gap-3" data-testid="ramps-orders-tab">
      <p>
        All orders: {allOrders.length} · Selected account: {accountOrders.length}
      </p>
      <button type="button" onClick={handleSync}>
        Sync from User Storage
      </button>
      {syncStatus ? <p>{syncStatus}</p> : null}
      {allOrders.length === 0 ? (
        <p>No ramps orders in controller state.</p>
      ) : (
        allOrders.map((order) => (
          <div
            key={order.id ?? order.providerOrderId}
            className="mb-4 border border-default rounded p-3"
          >
            <p>
              <strong>{order.id ?? order.providerOrderId}</strong> ·{' '}
              {order.status} · {order.provider?.id ?? 'unknown provider'}
            </p>
            <p className="text-sm opacity-80">
              wallet: {order.walletAddress} · created:{' '}
              {order.createdAt
                ? new Date(order.createdAt).toLocaleString()
                : '—'}
            </p>
            <pre className="text-xs mt-2 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(order, null, 2)}
            </pre>
          </div>
        ))
      )}
    </div>
  );
};

export default RampsOrdersTab;
