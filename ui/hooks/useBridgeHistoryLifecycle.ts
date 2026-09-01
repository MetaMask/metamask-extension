import { useEffect, useRef } from 'react';
import { StatusTypes as Status } from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';

const isComplete = ({ status }: BridgeHistoryItem) =>
  status.status === Status.COMPLETE;
const isFailed = ({ status }: BridgeHistoryItem) =>
  status.status === Status.FAILED;
const isPending = ({ status }: BridgeHistoryItem) =>
  status.status === Status.PENDING;

type Handlers = {
  onPending?: (key: string, item: BridgeHistoryItem) => void;
  onSuccess?: (key: string, item: BridgeHistoryItem) => void;
  onFailure?: (key: string, item: BridgeHistoryItem) => void;
};

export function useBridgeHistoryLifecycle(
  bridgeHistory: Record<string, BridgeHistoryItem> | undefined,
  handlers: Handlers,
) {
  const ref = useRef<Record<string, BridgeHistoryItem> | null>(null);

  useEffect(() => {
    const current = bridgeHistory ?? {};
    const baseline = ref.current;

    if (baseline === null) {
      ref.current = current;
      return;
    }

    for (const [key, item] of Object.entries(current)) {
      const previous = baseline[key];

      if (!previous) {
        if (isPending(item)) {
          handlers.onPending?.(key, item);
        }
        continue;
      }

      if (!isComplete(previous) && isComplete(item)) {
        handlers.onSuccess?.(key, item);
      }

      if (!isFailed(previous) && isFailed(item)) {
        handlers.onFailure?.(key, item);
      }
    }

    ref.current = current;
  }, [bridgeHistory, handlers]);
}
