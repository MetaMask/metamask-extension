import { renderHook, act } from '@testing-library/react-hooks';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('BTC', 300));
    expect(result.current).toBe('BTC');
  });

  it('debounces value changes by the specified delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'BTC' } },
    );

    rerender({ value: 'ETH' });
    expect(result.current).toBe('BTC');

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('BTC');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('ETH');
  });

  it('collapses rapid changes — only the last value propagates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'BTC' } },
    );

    rerender({ value: 'ETH' });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ value: 'SOL' });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ value: 'DOGE' });

    expect(result.current).toBe('BTC');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('DOGE');
  });

  it('propagates falsy values immediately', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'BTC' as string | undefined } },
    );

    rerender({ value: undefined });
    expect(result.current).toBeUndefined();
  });

  it('propagates empty string immediately', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'BTC' } },
    );

    rerender({ value: '' });
    expect(result.current).toBe('');
  });

  it('debounces a truthy value that follows an immediate falsy clear', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'BTC' as string | undefined } },
    );

    rerender({ value: undefined });
    expect(result.current).toBeUndefined();

    rerender({ value: 'ETH' });
    expect(result.current).toBeUndefined();

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ETH');
  });
});
