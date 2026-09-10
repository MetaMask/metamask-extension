import { useCallback, useEffect, useRef } from 'react';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';

export type NotificationListPerformanceOptions = {
  enabled: boolean;
  isLoading: boolean;
  isPending: boolean;
  error?: unknown;
  notificationCount: number;
};

export function useNotificationListPerformance({
  enabled,
  isLoading,
  isPending,
  error,
  notificationCount,
}: NotificationListPerformanceOptions): void {
  const traceIdRef = useRef<string | null>(null);
  const sawLoadingRef = useRef(false);
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
    sawLoadingRef.current = false;
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

    if (isLoading) {
      sawLoadingRef.current = true;
    }

    if (error) {
      endNotificationTrace({
        success: false,
        reason: 'error',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: latestCountRef.current,
      });
      return;
    }

    if (isPending) {
      return;
    }

    endNotificationTrace({
      success: true,
      source: sawLoadingRef.current ? 'cold' : 'warm',
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      notification_count: latestCountRef.current,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
      content_state: latestCountRef.current > 0 ? 'filled' : 'empty',
    });
  }, [
    enabled,
    endNotificationTrace,
    error,
    isLoading,
    isPending,
    notificationCount,
  ]);
}
