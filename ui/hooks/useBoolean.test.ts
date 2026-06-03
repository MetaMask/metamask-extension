import { act, renderHook } from '@testing-library/react-hooks';
import { useBoolean } from './useBoolean';

describe('useBoolean', () => {
  it('defaults to false', () => {
    const { result } = renderHook(() => useBoolean());

    expect(result.current.value).toBe(false);
  });

  it('supports a custom initial value', () => {
    const { result } = renderHook(() => useBoolean(true));

    expect(result.current.value).toBe(true);
  });

  it('sets the value to true', () => {
    const { result } = renderHook(() => useBoolean());

    act(() => {
      result.current.setTrue();
    });

    expect(result.current.value).toBe(true);
  });

  it('sets the value to false', () => {
    const { result } = renderHook(() => useBoolean(true));

    act(() => {
      result.current.setFalse();
    });

    expect(result.current.value).toBe(false);
  });

  it('toggles the value', () => {
    const { result } = renderHook(() => useBoolean());

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(true);

    act(() => {
      result.current.toggle();
    });

    expect(result.current.value).toBe(false);
  });

  it('exposes the raw setter for custom flows', () => {
    const { result } = renderHook(() => useBoolean());

    act(() => {
      result.current.setValue((currentValue) => !currentValue);
    });

    expect(result.current.value).toBe(true);
  });
});
