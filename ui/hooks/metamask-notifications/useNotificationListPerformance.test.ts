import { act, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import { useNotificationListPerformance } from './useNotificationListPerformance';

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  endTrace: jest.fn(),
  trace: jest.fn(),
}));

const ID = '00000000-0000-4000-8000-000000000001';

describe('useNotificationListPerformance', () => {
  // The abandonment end is deferred one macrotask so a StrictMode
  // setup/cleanup/setup probe can cancel it; tests drive that clock explicitly.
  const flushDeferredAbandon = () => {
    act(() => {
      jest.advanceTimersByTime(0);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(ID);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('ends warm when content is already settled', () => {
    renderHook(() =>
      useNotificationListPerformance({
        enabled: true,
        isLoading: false,
        isPending: false,
        notificationCount: 2,
      }),
    );

    expect(trace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      op: TraceOperation.NotificationPerformance,
    });
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: true,
        source: 'warm',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 2,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        content_state: 'filled',
      },
    });
  });

  it('ends cold after observing list loading', () => {
    const { rerender } = renderHook(
      ({ isLoading, isPending, notificationCount }) =>
        useNotificationListPerformance({
          enabled: true,
          isLoading,
          isPending,
          notificationCount,
        }),
      {
        initialProps: {
          isLoading: true,
          isPending: true,
          notificationCount: 0,
        },
      },
    );

    rerender({
      isLoading: false,
      isPending: false,
      notificationCount: 3,
    });

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: true,
        source: 'cold',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 3,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        content_state: 'filled',
      },
    });
  });

  it('waits for non-loading content blockers without changing warm source', () => {
    const { rerender } = renderHook(
      ({ isPending }) =>
        useNotificationListPerformance({
          enabled: true,
          isLoading: false,
          isPending,
          notificationCount: 0,
        }),
      { initialProps: { isPending: true } },
    );

    expect(endTrace).not.toHaveBeenCalled();
    rerender({ isPending: false });

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: true,
        source: 'warm',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        content_state: 'empty',
      },
    });
  });

  it('ends with an error immediately', () => {
    renderHook(() =>
      useNotificationListPerformance({
        enabled: true,
        isLoading: true,
        isPending: true,
        error: new Error('failed'),
        notificationCount: 0,
      }),
    );

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: false,
        reason: 'error',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 0,
      },
    });
  });

  it('ends unresolved activation on unmount using the latest count', () => {
    const { rerender, unmount } = renderHook(
      ({ notificationCount }) =>
        useNotificationListPerformance({
          enabled: true,
          isLoading: true,
          isPending: true,
          notificationCount,
        }),
      { initialProps: { notificationCount: 1 } },
    );
    rerender({ notificationCount: 4 });
    unmount();
    flushDeferredAbandon();

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: false,
        reason: 'unmounted',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 4,
      },
    });
  });

  it('does not report abandonment when re-enabled before deferred teardown', () => {
    const { rerender } = renderHook(
      ({ enabled }) =>
        useNotificationListPerformance({
          enabled,
          isLoading: true,
          isPending: true,
          notificationCount: 0,
        }),
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });
    rerender({ enabled: true });
    flushDeferredAbandon();

    expect(endTrace).not.toHaveBeenCalled();
    expect(trace).toHaveBeenCalledTimes(1);
  });

  it('emits one settled span under StrictMode', () => {
    renderHook(
      () =>
        useNotificationListPerformance({
          enabled: true,
          isLoading: false,
          isPending: false,
          notificationCount: 1,
        }),
      { wrapper: StrictMode },
    );
    flushDeferredAbandon();

    expect(trace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledTimes(1);
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: true,
        source: 'warm',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        content_state: 'filled',
      },
    });
  });

  it('resumes the original span so a probe does not reset the clock', () => {
    const { rerender, unmount } = renderHook(
      ({ enabled, isPending }) =>
        useNotificationListPerformance({
          enabled,
          isLoading: false,
          isPending,
          notificationCount: 1,
        }),
      { initialProps: { enabled: true, isPending: true } },
    );

    rerender({ enabled: false, isPending: true });
    rerender({ enabled: true, isPending: true });
    flushDeferredAbandon();
    rerender({ enabled: true, isPending: false });

    // Same id as the pre-probe span: the probe resumed it rather than
    // abandoning it and starting a replacement.
    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: true,
        source: 'warm',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        notification_count: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        content_state: 'filled',
      },
    });

    unmount();
    flushDeferredAbandon();
    expect(endTrace).toHaveBeenCalledTimes(1);
  });

  it('does not start when disabled', () => {
    renderHook(() =>
      useNotificationListPerformance({
        enabled: false,
        isLoading: false,
        isPending: false,
        notificationCount: 0,
      }),
    );

    expect(trace).not.toHaveBeenCalled();
    expect(endTrace).not.toHaveBeenCalled();
  });
});
