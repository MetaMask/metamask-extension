import React, { type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useScrollContainer } from '../../../contexts/scroll-container';

type Props<TItem> = {
  data: TItem[];
  estimatedItemSize: number;
  keyExtractor?: (item: TItem, index: number) => string;
  listEmptyComponent?: ReactNode;
  listFooterComponent?: ReactNode;
  overscan?: number;
  renderItem: (info: { item: TItem; index: number }) => ReactNode;
};

export const VirtualizedList = <TItem,>({
  data,
  estimatedItemSize,
  keyExtractor,
  listEmptyComponent,
  listFooterComponent,
  overscan = 5,
  renderItem,
}: Props<TItem>) => {
  const scrollContainerRef = useScrollContainer();
  const disabled = process.env.IN_TEST;

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () =>
      disabled ? null : (scrollContainerRef?.current ?? null),
    estimateSize: () => estimatedItemSize,
    overscan,
    initialOffset: scrollContainerRef?.current?.scrollTop,
  });

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
          return <div key={key}>{renderItem({ item, index })}</div>;
        })}
        {listFooterComponent}
      </>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualItem) => {
          const item = data[virtualItem.index];
          const key = keyExtractor
            ? keyExtractor(item, virtualItem.index)
            : virtualItem.index.toString();

          return (
            <div
              key={key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem({ item, index: virtualItem.index })}
            </div>
          );
        })}
      </div>
      {listFooterComponent}
    </>
  );
};
