import { renderHook, act } from '@testing-library/react';
import { useSnapUiFieldState } from './useSnapUiFieldState';

describe('useSnapUiFieldState', () => {
  it('uses the external value on first render', () => {
    const { result } = renderHook(() => useSnapUiFieldState('eth', ''));

    expect(result.current[0]).toBe('eth');
  });

  it('uses the fallback when the external value is unset', () => {
    const { result } = renderHook(() =>
      useSnapUiFieldState(undefined, false),
    );

    expect(result.current[0]).toBe(false);
  });

  it('updates local state when the external value changes', () => {
    const { result, rerender } = renderHook(
      ({ externalValue }) => useSnapUiFieldState(externalValue, ''),
      { initialProps: { externalValue: 'a' as string | undefined } },
    );

    rerender({ externalValue: 'b' });

    expect(result.current[0]).toBe('b');
  });

  it('keeps local state when the external value is cleared', () => {
    const { result, rerender } = renderHook(
      ({ externalValue }) => useSnapUiFieldState(externalValue, ''),
      { initialProps: { externalValue: 'a' as string | null | undefined } },
    );

    rerender({ externalValue: undefined });

    expect(result.current[0]).toBe('a');
  });

  it('restores local state after the external value is cleared then set again', () => {
    const { result, rerender } = renderHook(
      ({ externalValue }) => useSnapUiFieldState(externalValue, ''),
      { initialProps: { externalValue: 'a' as string | null | undefined } },
    );

    act(() => {
      result.current[1]('user-pick');
    });
    rerender({ externalValue: undefined });
    rerender({ externalValue: 'a' });

    expect(result.current[0]).toBe('a');
  });

  it('lets the caller update local state', () => {
    const { result } = renderHook(() => useSnapUiFieldState('a', ''));

    act(() => {
      result.current[1]('b');
    });

    expect(result.current[0]).toBe('b');
  });
});
