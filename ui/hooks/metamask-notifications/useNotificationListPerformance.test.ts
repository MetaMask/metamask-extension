/* eslint-disable @typescript-eslint/naming-convention -- Sentry trace fields use snake_case */
import { renderHook } from '@testing-library/react';
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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(ID);
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
        notification_count: 2,
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
        notification_count: 3,
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
        notification_count: 0,
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

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      data: {
        success: false,
        reason: 'unmounted',
        notification_count: 4,
      },
    });
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
