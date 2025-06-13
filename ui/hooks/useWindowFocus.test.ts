import { renderHook, act } from '@testing-library/react-hooks';
import { useWindowFocus } from './useWindowFocus';

describe('useWindowFocus', () => {
  it('return true if the window is focused initially', () => {
    jest.spyOn(document, 'hasFocus').mockReturnValue(true);

    const { result } = renderHook(() => useWindowFocus());

    expect(result.current).toBe(true);
  });

  it('return false if the window is not focused initially', () => {
    jest.spyOn(document, 'hasFocus').mockReturnValue(false);

    const { result } = renderHook(() => useWindowFocus());

    expect(result.current).toBe(false);
  });

  it('update to true when window gains focus', () => {
    const { result } = renderHook(() => useWindowFocus());

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current).toBe(true);
  });

  it('update to false when window loses focus', () => {
    const { result } = renderHook(() => useWindowFocus());

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(result.current).toBe(false);
  });
});
