type ObserverRecord = {
  callback: ResizeObserverCallback;
  instance: ResizeObserver;
  targets: Set<Element>;
};

export type ResizeObserverMock = {
  /** Constructor spy; one call per observer created. */
  constructorSpy: jest.Mock;
  observe: jest.Mock;
  disconnect: jest.Mock;
  /**
   * Reports a new content width to every observer, or only to those
   * watching `target` when given.
   */
  resize: (width: number, target?: Element) => void;
  restore: () => void;
};

/**
 * Replaces the global ResizeObserver with a controllable mock. jsdom has no
 * layout, so tests drive widths through `resize`.
 *
 * @returns Spies and a `resize` helper. Call `restore` after each test.
 */
export function mockResizeObserver(): ResizeObserverMock {
  const original = window.ResizeObserver;
  const records: ObserverRecord[] = [];
  const observe = jest.fn();
  const disconnect = jest.fn();

  const constructorSpy = jest.fn((callback: ResizeObserverCallback) => {
    const record: ObserverRecord = {
      callback,
      targets: new Set(),
      instance: {
        observe: (target: Element) => {
          observe(target);
          record.targets.add(target);
        },
        unobserve: (target: Element) => {
          record.targets.delete(target);
        },
        disconnect: () => {
          disconnect();
          record.targets.clear();
        },
      },
    };
    records.push(record);
    return record.instance;
  });

  window.ResizeObserver = constructorSpy as unknown as typeof ResizeObserver;

  const resize = (width: number, target?: Element) => {
    for (const record of records) {
      const entries = [...record.targets]
        .filter((observed) => !target || observed === target)
        .map(
          (observed) =>
            ({
              target: observed,
              contentRect: { width },
            }) as unknown as ResizeObserverEntry,
        );
      if (entries.length > 0) {
        record.callback(entries, record.instance);
      }
    }
  };

  return {
    constructorSpy,
    observe,
    disconnect,
    resize,
    restore: () => {
      window.ResizeObserver = original;
    },
  };
}
