import { act, renderHook } from '@testing-library/react';
import { useEffect } from 'react';
import { useDeferredAbandon } from './useDeferredAbandon';

describe('useDeferredAbandon', () => {
  // The work is deferred one macrotask so a StrictMode setup/cleanup/setup
  // probe can cancel it; tests drive that clock explicitly.
  const flushDeferredAbandon = () => {
    act(() => {
      jest.advanceTimersByTime(0);
    });
  };

  /**
   * Mirrors how consumers wire the hook: cancel on setup, schedule on teardown.
   *
   * @param abandon - Called when a teardown is not cancelled by a later setup.
   * @returns The render result, for driving mounts and unmounts.
   */
  const renderConsumer = (abandon: () => void) =>
    renderHook(
      ({ enabled }: { enabled: boolean }) => {
        const { cancelAbandon, scheduleAbandon } = useDeferredAbandon();

        useEffect(() => {
          if (!enabled) {
            return undefined;
          }

          cancelAbandon();

          return () => scheduleAbandon(abandon);
        }, [cancelAbandon, enabled, scheduleAbandon]);
      },
      { initialProps: { enabled: true } },
    );

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the deferred work when a teardown has no follow-up setup', () => {
    const abandon = jest.fn();
    const { unmount } = renderConsumer(abandon);

    unmount();
    expect(abandon).not.toHaveBeenCalled();

    flushDeferredAbandon();
    expect(abandon).toHaveBeenCalledTimes(1);
  });

  it('discards the deferred work when a setup follows the teardown', () => {
    const abandon = jest.fn();
    const { rerender } = renderConsumer(abandon);

    rerender({ enabled: false });
    rerender({ enabled: true });
    flushDeferredAbandon();

    expect(abandon).not.toHaveBeenCalled();
  });

  it('replaces previously scheduled work', () => {
    const firstAbandon = jest.fn();
    const secondAbandon = jest.fn();
    const { result } = renderHook(() => useDeferredAbandon());

    act(() => {
      result.current.scheduleAbandon(firstAbandon);
      result.current.scheduleAbandon(secondAbandon);
    });
    flushDeferredAbandon();

    expect(firstAbandon).not.toHaveBeenCalled();
    expect(secondAbandon).toHaveBeenCalledTimes(1);
  });

  it('still reports a real exit after an earlier probe was cancelled', () => {
    const abandon = jest.fn();
    const { rerender, unmount } = renderConsumer(abandon);

    rerender({ enabled: false });
    rerender({ enabled: true });
    unmount();
    flushDeferredAbandon();

    expect(abandon).toHaveBeenCalledTimes(1);
  });
});
