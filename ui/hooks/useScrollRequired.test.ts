import { act, renderHook } from '@testing-library/react';
import { useScrollRequired } from './useScrollRequired';

type ScrollMetrics = {
  scrollHeight: number;
  clientHeight: number;
  offsetHeight: number;
  scrollTop: number;
};

function createScrollElement(metrics: ScrollMetrics) {
  const element = document.createElement('div');
  const state = { ...metrics };

  Object.defineProperties(element, {
    scrollHeight: {
      get: () => state.scrollHeight,
      configurable: true,
    },
    clientHeight: {
      get: () => state.clientHeight,
      configurable: true,
    },
    offsetHeight: {
      get: () => state.offsetHeight,
      configurable: true,
    },
    scrollTop: {
      get: () => state.scrollTop,
      set: (value: number) => {
        state.scrollTop = value;
      },
      configurable: true,
    },
  });

  element.scrollTo = jest.fn((options?: ScrollToOptions | number) => {
    if (typeof options === 'object' && options?.top !== undefined) {
      state.scrollTop = options.top;
    }
  });

  return { element, state };
}

describe('useScrollRequired', () => {
  it('attaches the scroll element through the callback ref', () => {
    const { element } = createScrollElement({
      scrollHeight: 400,
      clientHeight: 100,
      offsetHeight: 100,
      scrollTop: 0,
    });
    const { result } = renderHook(() => useScrollRequired());

    act(() => {
      result.current.ref(element);
    });

    expect(result.current.scrollElement).toBe(element);
    expect(result.current.isScrollable).toBe(true);
    expect(result.current.isScrolledToBottom).toBe(false);
  });

  it('recalculates scrollability when dependencies change', () => {
    const { element, state } = createScrollElement({
      scrollHeight: 100,
      clientHeight: 100,
      offsetHeight: 100,
      scrollTop: 0,
    });
    const { result, rerender } = renderHook(
      ({ dependencies }: { dependencies: string[] }) =>
        useScrollRequired(dependencies),
      { initialProps: { dependencies: ['first'] } },
    );

    act(() => {
      result.current.ref(element);
    });
    expect(result.current.isScrollable).toBe(false);

    state.scrollHeight = 400;
    rerender({ dependencies: ['second'] });

    expect(result.current.isScrollable).toBe(true);
  });

  it('updates scrolled-to-bottom after the debounce window', () => {
    jest.useFakeTimers();
    const { element } = createScrollElement({
      scrollHeight: 400,
      clientHeight: 100,
      offsetHeight: 100,
      scrollTop: 0,
    });
    const { result } = renderHook(() => useScrollRequired());

    act(() => {
      result.current.ref(element);
    });
    expect(result.current.isScrolledToBottom).toBe(false);

    act(() => {
      element.scrollTop = 400;
      result.current.onScroll();
    });
    expect(result.current.isScrolledToBottom).toBe(false);

    act(() => {
      jest.advanceTimersByTime(25);
    });
    expect(result.current.isScrolledToBottom).toBe(true);

    jest.useRealTimers();
  });

  it('cancels a pending debounced scroll update on unmount', () => {
    jest.useFakeTimers();
    const { element } = createScrollElement({
      scrollHeight: 400,
      clientHeight: 100,
      offsetHeight: 100,
      scrollTop: 0,
    });
    const { result, unmount } = renderHook(() => useScrollRequired());

    act(() => {
      result.current.ref(element);
    });
    act(() => {
      element.scrollTop = 400;
      result.current.onScroll();
    });

    unmount();

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(25);
      });
    }).not.toThrow();

    jest.useRealTimers();
  });
});
