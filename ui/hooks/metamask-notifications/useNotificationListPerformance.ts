import { useCallback, useEffect, useRef } from 'react';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import type { InitialFetchLifecycle } from '../../contexts/metamask-notifications/metamask-notifications';

export type NotificationListPerformanceOptions = {
  enabled: boolean;
  initialFetchLifecycle: InitialFetchLifecycle;
  listFetchStatus: 'idle' | 'pending' | 'error';
  isFetchPending: boolean;
  isContentPending: boolean;
  notificationCount: number;
};

export function useNotificationListPerformance({
  enabled,
  initialFetchLifecycle,
  listFetchStatus,
  isFetchPending,
  isContentPending,
  notificationCount,
}: NotificationListPerformanceOptions): void {
  const { requestId: initialFetchRequestId, status: initialFetchStatus } =
    initialFetchLifecycle;
  const traceIdRef = useRef<string | null>(null);
  const sawFetchRef = useRef(false);
  const observedInitialFetchRequestRef = useRef<number | null>(null);
  const observedListFetchRef = useRef(false);
  const latestCountRef = useRef(notificationCount);

  useEffect(() => {
    latestCountRef.current = notificationCount;
  }, [notificationCount]);

  const endNotificationTrace = useCallback(
    (data: Record<string, number | string | boolean>) => {
      const id = traceIdRef.current;
      if (!id) {
        return;
      }

      traceIdRef.current = null;
      endTrace({
        name: TraceName.NotificationListTimeToContent,
        id,
        data,
      });
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const id = crypto.randomUUID();
    traceIdRef.current = id;
    sawFetchRef.current = false;
    observedInitialFetchRequestRef.current = null;
    observedListFetchRef.current = false;
    trace({
      name: TraceName.NotificationListTimeToContent,
      id,
      op: TraceOperation.NotificationPerformance,
    });

    return () => {
      endNotificationTrace({
        success: false,
        reason: 'unmounted',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: latestCountRef.current,
      });
    };
  }, [enabled, endNotificationTrace]);

  useEffect(() => {
    if (!enabled || !traceIdRef.current) {
      return;
    }

    if (isFetchPending) {
      sawFetchRef.current = true;
    }

    if (initialFetchStatus === 'pending') {
      observedInitialFetchRequestRef.current = initialFetchRequestId;
    }

    if (listFetchStatus === 'pending') {
      observedListFetchRef.current = true;
    }

    if (
      (initialFetchStatus === 'error' &&
        observedInitialFetchRequestRef.current === initialFetchRequestId) ||
      (listFetchStatus === 'error' && observedListFetchRef.current)
    ) {
      endNotificationTrace({
        success: false,
        reason: 'error',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: notificationCount,
      });
      return;
    }

    if (isContentPending) {
      return;
    }

    endNotificationTrace({
      success: true,
      source: sawFetchRef.current ? 'cold' : 'warm',
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      notification_count: notificationCount,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      content_state: notificationCount > 0 ? 'filled' : 'empty',
    });
  }, [
    enabled,
    endNotificationTrace,
    initialFetchRequestId,
    initialFetchStatus,
    isContentPending,
    isFetchPending,
    listFetchStatus,
    notificationCount,
  ]);
}
