import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';
import { useSpinDelay } from './useSpinDelay';

describe('useSpinDelay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('does not show the spinner while idle', () => {
    const { result } = renderHook(() => useSpinDelay(false));
    expect(result.current).toBe(false);
  });

  it('does not show the spinner before the delay elapses', () => {
    const { result } = renderHook(() =>
      useSpinDelay(true, { delay: 300, minDuration: 400 }),
    );

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe(false);
  });

  it('never shows the spinner when loading resolves before the delay', () => {
    const { result, rerender } = renderHook(
      ({ loading }: { loading: boolean }) =>
        useSpinDelay(loading, { delay: 300, minDuration: 400 }),
      { initialProps: { loading: true } },
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ loading: false });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(false);
  });

  it('shows the spinner once the delay elapses while still loading', () => {
    const { result } = renderHook(() =>
      useSpinDelay(true, { delay: 300, minDuration: 400 }),
    );

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);
  });

  it('keeps the spinner visible for at least minDuration after it appears', () => {
    const { result, rerender } = renderHook(
      ({ loading }: { loading: boolean }) =>
        useSpinDelay(loading, { delay: 300, minDuration: 400 }),
      { initialProps: { loading: true } },
    );

    // Cross the delay threshold: spinner now shown.
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(true);

    // Loading resolves almost immediately after the spinner appears.
    rerender({ loading: false });
    act(() => {
      jest.advanceTimersByTime(399);
    });
    expect(result.current).toBe(true);

    // Once the minimum duration elapses, the spinner hides.
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('hides the spinner immediately once loading ends after minDuration', () => {
    const { result, rerender } = renderHook(
      ({ loading }: { loading: boolean }) =>
        useSpinDelay(loading, { delay: 300, minDuration: 400 }),
      { initialProps: { loading: true } },
    );

    act(() => {
      jest.advanceTimersByTime(700);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    expect(result.current).toBe(false);
  });

  it('uses default options when none are provided', () => {
    const { result } = renderHook(() => useSpinDelay(true));

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe(true);
  });

  it('cleans up timeouts on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useSpinDelay(true));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
