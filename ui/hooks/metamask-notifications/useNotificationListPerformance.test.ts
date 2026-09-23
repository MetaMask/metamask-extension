import { renderHook } from '@testing-library/react';
import {
  endTrace,
  trace,
  TraceName,
  TraceOperation,
} from '../../../shared/lib/trace';
import {
  useNotificationListPerformance,
  type NotificationListPerformanceOptions,
} from './useNotificationListPerformance';

jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  endTrace: jest.fn(),
  trace: jest.fn(),
}));

const ID = '00000000-0000-4000-8000-000000000001';
const IDLE_LIFECYCLE = {
  requestId: 0,
  status: 'idle' as const,
};
const DEFAULT_OPTIONS: NotificationListPerformanceOptions = {
  enabled: true,
  initialFetchLifecycle: IDLE_LIFECYCLE,
  listFetchStatus: 'idle',
  isFetchPending: false,
  isContentPending: false,
  notificationCount: 0,
};

const renderPerformanceHook = (
  options: Partial<NotificationListPerformanceOptions> = {},
) =>
  renderHook(
    (props: Partial<NotificationListPerformanceOptions>) =>
      useNotificationListPerformance({ ...DEFAULT_OPTIONS, ...props }),
    { initialProps: options },
  );

const expectTraceEndedWith = (
  data: Record<string, number | string | boolean>,
) => {
  expect(endTrace).toHaveBeenCalledWith({
    name: TraceName.NotificationListTimeToContent,
    id: ID,
    data,
  });
};

const getSuccessData = (
  source: 'cold' | 'warm',
  notificationCount: number,
) => ({
  success: true,
  source,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  notification_count: notificationCount,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  content_state: notificationCount > 0 ? 'filled' : 'empty',
});

const getFailureData = (
  reason: 'error' | 'unmounted',
  notificationCount: number,
) => ({
  success: false,
  reason,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
  notification_count: notificationCount,
});

describe('useNotificationListPerformance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(ID);
  });

  it('ends warm when content is already settled', () => {
    renderPerformanceHook({ notificationCount: 2 });

    expect(trace).toHaveBeenCalledWith({
      name: TraceName.NotificationListTimeToContent,
      id: ID,
      op: TraceOperation.NotificationPerformance,
    });
    expectTraceEndedWith(getSuccessData('warm', 2));
  });

  it('ends cold after observing list loading', () => {
    const { rerender } = renderPerformanceHook({
      isFetchPending: true,
      isContentPending: true,
    });

    rerender({
      isFetchPending: false,
      isContentPending: false,
      notificationCount: 3,
    });

    expectTraceEndedWith(getSuccessData('cold', 3));
  });

  it('waits for non-loading content blockers without changing warm source', () => {
    const { rerender } = renderPerformanceHook({ isContentPending: true });

    expect(endTrace).not.toHaveBeenCalled();
    rerender({ isContentPending: false });

    expectTraceEndedWith(getSuccessData('warm', 0));
  });

  it('ends with an error from the initial fetch observed by the trace', () => {
    const { rerender } = renderPerformanceHook({
      initialFetchLifecycle: {
        requestId: 1,
        status: 'pending',
      },
      isFetchPending: true,
      isContentPending: true,
    });

    rerender({
      initialFetchLifecycle: {
        requestId: 1,
        status: 'error',
      },
      isFetchPending: false,
      isContentPending: false,
    });

    expectTraceEndedWith(getFailureData('error', 0));
  });

  it('ignores an initial-fetch error that predates the trace', () => {
    renderPerformanceHook({
      initialFetchLifecycle: {
        requestId: 1,
        status: 'error',
      },
      notificationCount: 2,
    });

    expectTraceEndedWith(getSuccessData('warm', 2));
  });

  it('ends only for list errors whose request was observed', () => {
    const { rerender } = renderPerformanceHook({
      listFetchStatus: 'pending',
      isFetchPending: true,
      isContentPending: true,
    });

    rerender({
      listFetchStatus: 'error',
      isFetchPending: false,
      isContentPending: false,
    });

    expectTraceEndedWith(getFailureData('error', 0));
  });

  it('ignores a list error that predates the trace', () => {
    renderPerformanceHook({
      listFetchStatus: 'error',
      notificationCount: 2,
    });

    expectTraceEndedWith(getSuccessData('warm', 2));
  });

  it('ends unresolved activation on unmount using the latest count', () => {
    const { rerender, unmount } = renderPerformanceHook({
      isFetchPending: true,
      isContentPending: true,
      notificationCount: 1,
    });
    rerender({
      isFetchPending: true,
      isContentPending: true,
      notificationCount: 4,
    });
    unmount();

    expectTraceEndedWith(getFailureData('unmounted', 4));
  });

  it('does not start when disabled', () => {
    renderPerformanceHook({ enabled: false });

    expect(trace).not.toHaveBeenCalled();
    expect(endTrace).not.toHaveBeenCalled();
  });
});
