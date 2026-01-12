import React, { type CSSProperties, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useScrollContainer } from '../../../contexts/scroll-container';

type Props<TItem> = {
  data: TItem[];
  estimatedItemSize: number;
  itemStyle?: CSSProperties;
  keyExtractor?: (item: TItem, index: number) => string;
  listEmptyComponent?: ReactNode;
  listFooterComponent?: ReactNode;
  overscan?: number;
  renderItem: (info: { item: TItem; index: number }) => ReactNode;
};

export const VirtualizedList = <TItem,>({
  data,
  estimatedItemSize,
  itemStyle,
  keyExtractor,
  listEmptyComponent,
  listFooterComponent,
  overscan = 5,
  renderItem,
}: Props<TItem>) => {
  const scrollContainer = useScrollContainer();

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => scrollContainer,
    estimateSize: () => estimatedItemSize,
    overscan,
  });

  // Wait for scroll container to be available when using context
  if (!scrollContainer) {
    return null;
  }

  if (data.length === 0) {
    return (
      <>
        {listEmptyComponent}
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
                ...itemStyle,
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
