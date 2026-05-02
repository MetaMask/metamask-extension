import { act, renderHook } from '@testing-library/react-hooks';
import { useIntersectionObserver } from './useIntersectionObserver';

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();
const mockIntersectionObserver = jest.fn();
let lastObserverCallback: IntersectionObserverCallback | undefined;

class MockIntersectionObserver {
  readonly thresholds: ReadonlyArray<number>;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    lastObserverCallback = callback;
    mockIntersectionObserver(callback, options);
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold ?? 0];
  }

  observe = mockObserve;

  disconnect = mockDisconnect;
}

describe('useIntersectionObserver', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      writable: true,
      value: MockIntersectionObserver,
    });
    jest.clearAllMocks();
    lastObserverCallback = undefined;
  });

  it('observes the assigned element', () => {
    const element = document.createElement('div');
    const { result } = renderHook(() => useIntersectionObserver());

    act(() => {
      result.current.ref(element);
    });

    expect(mockObserve).toHaveBeenCalledWith(element);
  });

  it('calls onChange when the element intersects', () => {
    const element = document.createElement('div');
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useIntersectionObserver({ onChange, threshold: 0.5 }),
    );

    act(() => {
      result.current.ref(element);
    });

    const entry = {
      isIntersecting: true,
      intersectionRatio: 0.75,
    } as IntersectionObserverEntry;

    act(() => {
      lastObserverCallback?.([entry], {} as IntersectionObserver);
    });

    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry).toBe(entry);
    expect(onChange).toHaveBeenCalledWith(true, entry);
  });

  it('disconnects the observer when unmounted', () => {
    const element = document.createElement('div');
    const { result, unmount } = renderHook(() => useIntersectionObserver());

    act(() => {
      result.current.ref(element);
    });

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
