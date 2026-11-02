import {
  getOffsetWithinScrollParent,
  measureVirtualItem,
} from './virtualized-list';

describe('getOffsetWithinScrollParent', () => {
  it('measures the list against the scroll container instead of offsetParent', () => {
    const element = {
      getBoundingClientRect: () => ({ top: 480 }),
    } as HTMLElement;
    const scrollParent = {
      getBoundingClientRect: () => ({ top: 80 }),
      scrollTop: 220,
    } as HTMLElement;

    // 480 - 80 + 220. offsetTop against a sticky tab bar would have dropped
    // the account header above the list.
    expect(getOffsetWithinScrollParent(element, scrollParent)).toBe(620);
  });

  it('clamps a negative offset to zero', () => {
    const element = {
      getBoundingClientRect: () => ({ top: 10 }),
    } as HTMLElement;
    const scrollParent = {
      getBoundingClientRect: () => ({ top: 40 }),
      scrollTop: 0,
    } as HTMLElement;

    expect(getOffsetWithinScrollParent(element, scrollParent)).toBe(0);
  });
});

describe('measureVirtualItem', () => {
  const instance = {
    options: {
      horizontal: false,
      estimateSize: () => 62,
    },
    indexFromElement: () => 0,
    measurementsCache: [] as { size: number }[],
  };

  it('keeps the estimated row size when the row has not laid out yet', () => {
    const element = { offsetHeight: 0, offsetWidth: 0 } as HTMLElement;

    expect(measureVirtualItem(element, undefined, instance)).toBe(62);
  });

  it('uses a real measured size', () => {
    const element = { offsetHeight: 62, offsetWidth: 100 } as HTMLElement;

    expect(measureVirtualItem(element, undefined, instance)).toBe(62);
  });

  it('keeps a previously measured size instead of collapsing to zero', () => {
    const element = { offsetHeight: 0, offsetWidth: 0 } as HTMLElement;

    expect(
      measureVirtualItem(element, undefined, {
        ...instance,
        measurementsCache: [{ size: 62 }],
      }),
    ).toBe(62);
  });
});
