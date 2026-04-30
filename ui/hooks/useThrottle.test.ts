import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    // Mock timers for testing
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useThrottle('initial', 1000));
    expect(result.current).toBe('initial');
  });

  it('should throttle value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: string; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: 'initial', limit: 1000 },
      },
    );

    // Change value immediately
    rerender({ value: 'updated', limit: 1000 });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast forward time by 500ms (less than limit)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial'); // Should still be initial

    // Fast forward time by another 500ms (total 1000ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated'); // Should now be updated
  });

  it('should handle multiple rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: string; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: 'initial', limit: 1000 },
      },
    );

    // Make multiple rapid changes
    rerender({ value: 'first', limit: 1000 });
    rerender({ value: 'second', limit: 1000 });
    rerender({ value: 'third', limit: 1000 });

    expect(result.current).toBe('initial'); // Should still be initial

    // Advance time by 1000ms
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe('third'); // Should be the last value
  });

  it('should work with different data types', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: number; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: 0, limit: 500 },
      },
    );

    rerender({ value: 42, limit: 500 });
    expect(result.current).toBe(0);

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe(42);
  });

  it('should work with objects', () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, limit }: { value: { name: string }; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: initialObj, limit: 1000 },
      },
    );

    rerender({ value: updatedObj, limit: 1000 });
    expect(result.current).toBe(initialObj);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(updatedObj);
  });

  it('should handle zero limit', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: string; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: 'initial', limit: 0 },
      },
    );

    rerender({ value: 'updated', limit: 0 });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('should clean up timeouts on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useThrottle('test', 1000));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should handle changing limit values', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: string; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: 'initial', limit: 2000 },
      },
    );

    // Change value with long limit
    rerender({ value: 'updated', limit: 2000 });
    expect(result.current).toBe('initial');

    // Change to shorter limit
    rerender({ value: 'updated', limit: 500 });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(result.current).toBe('updated');
  });

  it('should handle null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value, limit }: { value: null | undefined; limit: number }) =>
        useThrottle(value, limit),
      {
        initialProps: { value: null as null | undefined, limit: 1000 },
      },
    );

    rerender({ value: undefined, limit: 1000 });
    expect(result.current).toBe(null);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(undefined);
  });
});
