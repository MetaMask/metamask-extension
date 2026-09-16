import { renderHook, act } from '@testing-library/react';
import { useIntersectionObserver } from './useIntersectionObserver';

type ObserverInstance = {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  observed: Element[];
  disconnect: jest.Mock;
};

/**
 * Installs a fake `IntersectionObserver` that records each instance and
 * exposes its callback so tests can emit entries.
 *
 * @returns The list of created observer instances.
 */
function mockIntersectionObserver(): ObserverInstance[] {
  const instances: ObserverInstance[] = [];

  window.IntersectionObserver = class {
    thresholds: readonly number[];

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      const threshold = options?.threshold ?? 0;
      this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
      instances.push({
        callback,
        options,
        observed: [],
        disconnect: jest.fn(),
      });
    }

    observe(element: Element) {
      instances[instances.length - 1].observed.push(element);
    }

    unobserve() {
      return undefined;
    }

    disconnect() {
      instances[instances.length - 1].disconnect();
    }
  } as unknown as typeof IntersectionObserver;

  return instances;
}

function emit(
  instance: ObserverInstance,
  entry: Partial<IntersectionObserverEntry>,
) {
  act(() => {
    instance.callback(
      [entry as IntersectionObserverEntry],
      instance as unknown as IntersectionObserver,
    );
  });
}

describe('useIntersectionObserver', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  afterEach(() => {
    // Assigning `undefined` back would leave an own property that the hook's
    // `'IntersectionObserver' in globalThis` guard still sees.
    if (originalIntersectionObserver === undefined) {
      Reflect.deleteProperty(window, 'IntersectionObserver');
    } else {
      window.IntersectionObserver = originalIntersectionObserver;
    }
    jest.restoreAllMocks();
  });

  it('reports the initial intersection state before an entry arrives', () => {
    mockIntersectionObserver();

    const { result } = renderHook(() =>
      useIntersectionObserver({ initialIsIntersecting: true }),
    );

    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry).toBeUndefined();
  });

  it('defaults to not intersecting', () => {
    mockIntersectionObserver();

    const { result } = renderHook(() => useIntersectionObserver());

    expect(result.current.isIntersecting).toBe(false);
  });

  it('observes the element passed to the returned ref', () => {
    const instances = mockIntersectionObserver();
    const element = document.createElement('div');

    const { result } = renderHook(() =>
      useIntersectionObserver({ rootMargin: '-24px 0px 0px 0px' }),
    );

    act(() => {
      result.current.ref(element);
    });

    expect(instances).toHaveLength(1);
    expect(instances[0].observed).toStrictEqual([element]);
    expect(instances[0].options?.rootMargin).toBe('-24px 0px 0px 0px');
  });

  it('updates state and calls onChange when an entry intersects', () => {
    const instances = mockIntersectionObserver();
    const onChange = jest.fn();
    const element = document.createElement('div');

    const { result } = renderHook(() => useIntersectionObserver({ onChange }));

    act(() => {
      result.current.ref(element);
    });
    emit(instances[0], {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    });

    expect(result.current.isIntersecting).toBe(true);
    expect(result.current.entry?.target).toBe(element);
    expect(onChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ target: element }),
    );
  });

  it('treats an entry below the threshold as not intersecting', () => {
    const instances = mockIntersectionObserver();
    const element = document.createElement('div');

    const { result } = renderHook(() =>
      useIntersectionObserver({ threshold: [0.5] }),
    );

    act(() => {
      result.current.ref(element);
    });
    emit(instances[0], {
      isIntersecting: true,
      intersectionRatio: 0.1,
      target: element,
    });

    expect(result.current.isIntersecting).toBe(false);
  });

  it('resets to the initial state when the ref is detached', () => {
    const instances = mockIntersectionObserver();
    const element = document.createElement('div');

    const { result } = renderHook(() => useIntersectionObserver());

    act(() => {
      result.current.ref(element);
    });
    emit(instances[0], {
      isIntersecting: true,
      intersectionRatio: 1,
      target: element,
    });
    expect(result.current.isIntersecting).toBe(true);

    act(() => {
      result.current.ref(null);
    });

    expect(result.current.isIntersecting).toBe(false);
    expect(result.current.entry).toBeUndefined();
  });

  it('disconnects the observer on unmount', () => {
    const instances = mockIntersectionObserver();
    const element = document.createElement('div');

    const { result, unmount } = renderHook(() => useIntersectionObserver());

    act(() => {
      result.current.ref(element);
    });
    unmount();

    expect(instances[0].disconnect).toHaveBeenCalled();
  });

  it('does not observe when IntersectionObserver is unavailable', () => {
    Reflect.deleteProperty(window, 'IntersectionObserver');
    const element = document.createElement('div');

    const { result } = renderHook(() =>
      useIntersectionObserver({ initialIsIntersecting: true }),
    );

    expect(() => {
      act(() => {
        result.current.ref(element);
      });
    }).not.toThrow();
    expect(result.current.isIntersecting).toBe(true);
  });

  it('exposes the same values as a tuple and as named properties', () => {
    mockIntersectionObserver();

    const { result } = renderHook(() =>
      useIntersectionObserver({ initialIsIntersecting: true }),
    );
    const [ref, isIntersecting, entry] = result.current;

    expect(ref).toBe(result.current.ref);
    expect(isIntersecting).toBe(result.current.isIntersecting);
    expect(entry).toBe(result.current.entry);
  });
});
