import { renderHook, act } from '@testing-library/react-hooks';
import { useEventListener } from './useEventListener';

describe('useEventListener', () => {
  it('listens on window by default', () => {
    const handler = jest.fn();

    renderHook(() => useEventListener('click', handler));

    act(() => {
      window.dispatchEvent(new Event('click'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('removes the listener on unmount', () => {
    const handler = jest.fn();

    const { unmount } = renderHook(() => useEventListener('click', handler));

    unmount();

    act(() => {
      window.dispatchEvent(new Event('click'));
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
