import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('returns the initial value synchronously on first render', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 200));
    expect(result.current).toBe('initial');
  });

  it('delays updates by delayMs and emits only the final value', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'a' } },
    );

    act(() => {
      rerender({ value: 'ab' });
      rerender({ value: 'abc' });
    });

    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(199);
    });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('abc');
  });

  it('keeps debounced state in sync when switching from immediate to delayed mode', () => {
    const { result, rerender } = renderHook(
      ({ value, delayMs }: { value: string; delayMs: number }) =>
        useDebouncedValue(value, delayMs),
      { initialProps: { value: 'a', delayMs: 0 } },
    );

    act(() => {
      rerender({ value: 'b', delayMs: 0 });
    });
    expect(result.current).toBe('b');

    act(() => {
      rerender({ value: 'b', delayMs: 200 });
    });
    expect(result.current).toBe('b');
  });

  it('tracks the source synchronously when delayMs <= 0', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebouncedValue(value, 0),
      { initialProps: { value: 1 } },
    );

    act(() => {
      rerender({ value: 2 });
    });
    expect(result.current).toBe(2);
  });

  it('cancels a pending update when the source changes again before the window closes', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'first' } },
    );

    act(() => {
      rerender({ value: 'second' });
    });

    act(() => {
      jest.advanceTimersByTime(50);
    });
    act(() => {
      rerender({ value: 'third' });
    });

    act(() => {
      jest.advanceTimersByTime(99);
    });
    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('third');
  });
});
