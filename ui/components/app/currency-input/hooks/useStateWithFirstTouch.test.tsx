import { renderHook, act } from '@testing-library/react-hooks';
import useStateWithFirstTouch from './useStateWithFirstTouch';

describe('useStateWithFirstTouch', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useStateWithFirstTouch('test'));

    expect(result.current[0]).toBe('test');
    expect(result.current[2]).toBe(true);
  });

  it('should return initial value', () => {
    const { result } = renderHook(() => useStateWithFirstTouch('test'));

    expect(result.current[0]).toBe('test');
    expect(result.current[2]).toBe(true);
  });

  it('should update value', () => {
    const { result } = renderHook(() => useStateWithFirstTouch('test'));

    act(() => {
      result.current[1]('new value');
    });

    expect(result.current[0]).toBe('new value');
    expect(result.current[2]).toBe(false);
  });

  it('should handle initial value of INITIAL_VALUE string', () => {
    const { result } = renderHook(() =>
      useStateWithFirstTouch('INITIAL_VALUE'),
    );

    expect(result.current[0]).toBe('INITIAL_VALUE');
    expect(result.current[2]).toBe(true);
  });
});
