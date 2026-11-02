import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  useVirtualizer,
  type VirtualizerOptions,
} from '@tanstack/react-virtual';
import { useScrollContainer } from '../../../contexts/scroll-container';

/**
 * Distance from the top of the scroll container's content to `element`.
 * `offsetTop` is not used: it is relative to `offsetParent`, which on Home is
 * a sticky tab bar rather than the scroller, so it drops the account header.
 *
 * @param element - List element positioned inside the scroll container.
 * @param scrollParent - Element that actually scrolls.
 * @returns Non-negative content offset in pixels.
 */
export function getOffsetWithinScrollParent(
  element: HTMLElement,
  scrollParent: HTMLElement,
): number {
  const elementRect = element.getBoundingClientRect();
  const parentRect = scrollParent.getBoundingClientRect();

  return Math.max(
    0,
    Math.round(elementRect.top - parentRect.top + scrollParent.scrollTop),
  );
}

type MeasurableVirtualizer = {
  options: {
    horizontal: boolean;
    estimateSize: (index: number) => number;
  };
  indexFromElement: (node: Element) => number;
  measurementsCache: { size: number }[];
};

/**
 * Row size for the virtualizer. A connected row can report 0 before its cell
 * lays out (account switch renders an empty frame, or `TokenCell` returns
 * null). Caching that 0 makes every following row start at the same Y, so the
 * lists paint on top of each other. Keep the estimate until a real size exists.
 *
 * @param element - Row element being measured.
 * @param entry - ResizeObserver entry, when the measure came from the observer.
 * @param instance - Virtualizer that owns the row.
 * @returns Pixel size to cache for the row.
 */
export function measureVirtualItem(
  element: Element,
  entry: ResizeObserverEntry | undefined,
  instance: MeasurableVirtualizer,
): number {
  const borderBox = entry?.borderBoxSize?.[0];
  const measured = borderBox
    ? Math.round(
        instance.options.horizontal
          ? borderBox.inlineSize
          : borderBox.blockSize,
      )
    : (element as HTMLElement)[
        instance.options.horizontal ? 'offsetWidth' : 'offsetHeight'
      ];

  if (measured > 0) {
    return measured;
  }

  const index = instance.indexFromElement(element);
  const cached = instance.measurementsCache[index]?.size ?? 0;
  if (cached > 0) {
    return cached;
  }

  return instance.options.estimateSize(index);
}

type ScrollToFn = VirtualizerOptions<HTMLDivElement, Element>['scrollToFn'];

export const noAdjustmentsScroll: ScrollToFn = (offset, options, instance) => {
  instance.scrollElement?.scrollTo?.({
    top: offset,
    behavior: options.behavior,
  });
};

type Props<TItem> = {
  data: TItem[];
  estimatedItemSize: number | ((item: TItem, index: number) => number);
  keyExtractor?: (item: TItem, index: number) => string;
  itemRef?: (
    node: HTMLDivElement | null,
    info: { item: TItem; index: number },
  ) => void;
  listEmptyComponent?: ReactNode;
  listFooterComponent?: ReactNode;
  overscan?: number;
  renderItem: (info: { item: TItem; index: number }) => ReactNode;
  scrollToFn?: ScrollToFn;
  enableScrollMargin?: boolean;
};

export const VirtualizedList = <TItem,>({
  data,
  estimatedItemSize,
  keyExtractor,
  itemRef,
  listEmptyComponent,
  listFooterComponent,
  overscan = 5,
  renderItem,
  scrollToFn,
  enableScrollMargin,
}: Props<TItem>) => {
  const scrollContainerRef = useScrollContainer();
  const disabled = process.env.IN_TEST;
  const [scrollMargin, setScrollMargin] = useState(0);
  const listNodeRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () =>
      disabled ? null : (scrollContainerRef?.current ?? null),
    estimateSize: (index) =>
      typeof estimatedItemSize === 'function'
        ? estimatedItemSize(data[index], index)
        : estimatedItemSize,
    getItemKey: (index) =>
      keyExtractor ? keyExtractor(data[index], index) : index,
    overscan,
    measureElement: (element, entry, instance) =>
      measureVirtualItem(element, entry, instance),
    ...(scrollToFn ? { scrollToFn } : {}),
    ...(enableScrollMargin ? { scrollMargin } : {}),
  });

  const listRef = useCallback((node: HTMLDivElement | null) => {
    listNodeRef.current = node;
  }, []);

  useLayoutEffect(() => {
    if (!enableScrollMargin) {
      return undefined;
    }

    const scrollElement = scrollContainerRef?.current;
    const listElement = listNodeRef.current;
    if (!scrollElement || !listElement) {
      return undefined;
    }

    const measureOffset = () => {
      const nextOffset = getOffsetWithinScrollParent(
        listElement,
        scrollElement,
      );
      setScrollMargin((current) =>
        current === nextOffset ? current : nextOffset,
      );
    };

    measureOffset();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(measureOffset);
    observer.observe(scrollElement);
    Array.from(scrollElement.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        observer.observe(child);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [data.length, enableScrollMargin, scrollContainerRef]);

  useEffect(() => {
    if (scrollContainerRef?.current) {
      virtualizer.measure();
    }
  }, [scrollContainerRef, virtualizer]);

  if (data.length === 0) {
    return (
      <>
        {listEmptyComponent}
        {listFooterComponent}
      </>
    );
  }

  if (disabled) {
    return (
      <>
        {data.map((item, index) => {
          const key = keyExtractor
            ? keyExtractor(item, index)
            : index.toString();
          return (
            <div key={key} ref={(node) => itemRef?.(node, { item, index })}>
              {renderItem({ item, index })}
            </div>
          );
        })}
        {listFooterComponent}
      </>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      <div
        ref={listRef}
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const { index } = virtualItem;
          const item = data[index];
          const key = keyExtractor
            ? keyExtractor(item, index)
            : virtualItem.key.toString();

          return (
            <div
              key={key}
              data-index={index}
              ref={(node) => {
                virtualizer.measureElement(node);
                itemRef?.(node, { item, index });
              }}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${
                  virtualItem.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {renderItem({ item, index })}
            </div>
          );
        })}
      </div>
      {listFooterComponent}
    </>
  );
};
