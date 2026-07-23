import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  useVirtualizer,
  type VirtualizerOptions,
} from '@tanstack/react-virtual';
import { useScrollContainer } from '../../../contexts/scroll-container';

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
    initialOffset: scrollContainerRef?.current?.scrollTop,
    ...(scrollToFn ? { scrollToFn } : {}),
    ...(enableScrollMargin ? { scrollMargin } : {}),
  });

  const listRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!enableScrollMargin || !node) {
        return;
      }

      setScrollMargin(node.offsetTop);
    },
    [enableScrollMargin],
  );

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
