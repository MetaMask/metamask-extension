import React, { useCallback, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useScrollContainer } from '../../../contexts/scroll-container';

type RenderItemParams<Item> = {
  item: Item;
  index: number;
};

export type VirtualizedListProps<Item> = {
  data: readonly Item[];
  renderItem: (params: RenderItemParams<Item>) => React.ReactNode;
  keyExtractor: (item: Item, index: number) => string;
  estimatedItemSize: number;
  getItemSize?: (item: Item, index: number) => number;
  className?: string;
  style?: React.CSSProperties;
  overscan?: number;
};

export const VirtualizedList = <Item,>({
  data,
  renderItem,
  keyExtractor,
  estimatedItemSize,
  getItemSize,
  className,
  style,
  overscan = 10,
}: VirtualizedListProps<Item>) => {
  const scrollContainerRef = useScrollContainer();

  const getScrollElement = useCallback(
    () => scrollContainerRef?.current || null,
    [scrollContainerRef],
  );

  const estimateSize = useCallback(
    (index: number) => {
      const item = data[index];

      if (getItemSize && item) {
        return getItemSize(item, index);
      }

      return estimatedItemSize;
    },
    [data, getItemSize, estimatedItemSize],
  );

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement,
    estimateSize,
    overscan,
    initialOffset: scrollContainerRef?.current?.scrollTop,
  });

  const containerClassName = useMemo(
    () => ['relative w-full', className].filter(Boolean).join(' '),
    [className],
  );

  return (
    <div
      className={containerClassName}
      style={{
        ...style,
        height: `${virtualizer.getTotalSize()}px`,
      }}
    >
      {virtualizer.getVirtualItems().map((virtualItem) => {
        const item = data[virtualItem.index];

        if (!item) {
          return null;
        }

        return (
          <div
            key={keyExtractor(item, virtualItem.index)}
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
  );
};

export default VirtualizedList;
