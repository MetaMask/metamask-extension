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
const DEFAULT_OPTIONS: NotificationListPerformanceOptions = {
  enabled: true,
  isLoading: false,
  isPending: false,
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

const getUnmountedData = (notificationCount: number) => ({
  success: false,
  reason: 'unmounted',
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
      isLoading: true,
      isPending: true,
    });

    rerender({
      isLoading: false,
      isPending: false,
      notificationCount: 3,
    });

    expectTraceEndedWith(getSuccessData('cold', 3));
  });

  it('waits for non-loading content blockers without changing warm source', () => {
    const { rerender } = renderPerformanceHook({ isPending: true });

    expect(endTrace).not.toHaveBeenCalled();
    rerender({ isPending: false });

    expectTraceEndedWith(getSuccessData('warm', 0));
  });

  it('ends unresolved activation on unmount using the latest count', () => {
    const { rerender, unmount } = renderPerformanceHook({
      isLoading: true,
      isPending: true,
      notificationCount: 1,
    });
    rerender({
      isLoading: true,
      isPending: true,
      notificationCount: 4,
    });
    unmount();

    expectTraceEndedWith(getUnmountedData(4));
  });

  it('does not start when disabled', () => {
    renderPerformanceHook({ enabled: false });

    expect(trace).not.toHaveBeenCalled();
    expect(endTrace).not.toHaveBeenCalled();
  });
});
