import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getCurrentTabId,
  getPendingDeepLinkNavigation,
  removePendingDeepLinkNavigation,
  type PendingDeepLinkNavigation,
} from '../../shared/lib/deep-links/performance';
import {
  endTrace,
  getPerformanceTimestamp,
  trace,
  TraceName,
  TraceOperation,
} from '../../shared/lib/trace';
import {
  cancelPendingDeepLinkUnlockTrace,
  startPendingDeepLinkUnlockTrace,
  useDeepLinkNavigationTrace,
} from './useDeepLinkNavigationTrace';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../../shared/lib/deep-links/performance', () => ({
  getCurrentTabId: jest.fn(),
  getPendingDeepLinkNavigation: jest.fn(),
  removePendingDeepLinkNavigation: jest.fn(),
}));
jest.mock('../../shared/lib/trace', () => ({
  ...jest.requireActual('../../shared/lib/trace'),
  endTrace: jest.fn(),
  getPerformanceTimestamp: jest.fn(() => 2_000),
  trace: jest.fn(),
}));

const RECORD: PendingDeepLinkNavigation = {
  id: 'trace-id',
  intakeTimestamp: 1_000,
  createdAt: 1_000,
  urlTags: {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
    deeplink_route: 'swap',
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
    deeplink_variant: 'default',
    signed: false,
  },
  targetRoute: '/swap',
  interstitial: 'skipped',
};

function getWrapper(pathname: string) {
  return ({ children }: React.PropsWithChildren) => (
    <MemoryRouter
      initialEntries={[pathname]}
      future={{
        // eslint-disable-next-line @typescript-eslint/naming-convention -- React Router future flags
        v7_startTransition: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- React Router future flags
        v7_relativeSplatPath: true,
      }}
    >
      {children}
    </MemoryRouter>
  );
}

describe('useDeepLinkNavigationTrace', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(useSelector).mockReturnValue(true);
    jest.mocked(getCurrentTabId).mockResolvedValue(42);
    jest.mocked(getPendingDeepLinkNavigation).mockResolvedValue(RECORD);
    jest.mocked(removePendingDeepLinkNavigation).mockResolvedValue();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('backdates and ends an unlocked destination trace', async () => {
    renderHook(() => useDeepLinkNavigationTrace(), {
      wrapper: getWrapper('/cross-chain/swaps/prepare-bridge-page'),
    });

    await waitFor(() => {
      expect(trace).toHaveBeenCalledWith({
        name: TraceName.DeeplinkNavigated,
        id: RECORD.id,
        op: TraceOperation.DeeplinkPerformance,
        startTime: RECORD.intakeTimestamp,
        data: {
          // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
          deeplink_activation_id: RECORD.id,
        },
        tags: {
          ...RECORD.urlTags,
          // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
          start_source: 'intake',
        },
      });
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.DeeplinkNavigated,
      id: RECORD.id,
      data: {
        success: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        nav_target: 'inferred',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        target_route: RECORD.targetRoute,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        focused_route: '/cross-chain/swaps/prepare-bridge-page',
      },
    });
    expect(removePendingDeepLinkNavigation).toHaveBeenCalledWith(42, RECORD.id);
  });

  it('waits while the wallet is locked', async () => {
    jest.mocked(useSelector).mockReturnValue(false);

    renderHook(() => useDeepLinkNavigationTrace(), {
      wrapper: getWrapper('/cross-chain/swaps/prepare-bridge-page'),
    });

    await waitFor(() => {
      expect(getPendingDeepLinkNavigation).toHaveBeenCalled();
    });
    expect(trace).not.toHaveBeenCalled();
  });

  it('cancels on the basic-functionality detour', async () => {
    renderHook(() => useDeepLinkNavigationTrace(), {
      wrapper: getWrapper('/basic-functionality-off'),
    });

    await waitFor(() => {
      expect(endTrace).toHaveBeenCalledWith({
        name: TraceName.DeeplinkNavigated,
        id: RECORD.id,
        data: {
          success: false,
          reason: 'basic_functionality',
        },
      });
    });
  });

  it('starts at unlock submit and preserves the record after failure', async () => {
    await expect(startPendingDeepLinkUnlockTrace()).resolves.toBe(RECORD.id);

    expect(getPerformanceTimestamp).toHaveBeenCalledTimes(1);
    expect(trace).toHaveBeenCalledWith({
      name: TraceName.DeeplinkNavigated,
      id: RECORD.id,
      op: TraceOperation.DeeplinkPerformance,
      startTime: 2_000,
      data: {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        deeplink_activation_id: RECORD.id,
      },
      tags: {
        ...RECORD.urlTags,
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Sentry snake_case
        start_source: 'unlock',
      },
    });

    cancelPendingDeepLinkUnlockTrace(RECORD.id, 'unlock_failed');

    expect(endTrace).toHaveBeenCalledWith({
      name: TraceName.DeeplinkNavigated,
      id: RECORD.id,
      data: {
        success: false,
        reason: 'unlock_failed',
      },
    });
    expect(removePendingDeepLinkNavigation).not.toHaveBeenCalled();
  });

  it('supersedes a stale active trace when a second deeplink reuses the tab', async () => {
    await startPendingDeepLinkUnlockTrace();
    const nextRecord = {
      ...RECORD,
      id: 'next-trace-id',
      targetRoute: '/buy',
    };
    jest.mocked(getPendingDeepLinkNavigation).mockResolvedValue(nextRecord);

    renderHook(() => useDeepLinkNavigationTrace(), {
      wrapper: getWrapper('/cross-chain/swaps/prepare-bridge-page'),
    });

    await waitFor(() => {
      expect(endTrace).toHaveBeenCalledWith({
        name: TraceName.DeeplinkNavigated,
        id: RECORD.id,
        data: {
          success: false,
          reason: 'unresolved',
        },
      });
      expect(trace).toHaveBeenCalledWith(
        expect.objectContaining({ id: nextRecord.id }),
      );
    });
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(endTrace).toHaveBeenCalledWith(
      expect.objectContaining({ id: nextRecord.id }),
    );
  });
});
