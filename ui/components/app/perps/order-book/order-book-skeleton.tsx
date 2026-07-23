import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Skeleton,
} from '@metamask/design-system-react';

/**
 * Levels rendered per side in the loading skeleton. Matches the compact
 * ladder users typically see in the order-entry panel so the first real
 * update does not jump the buy/sell ratio or row block.
 */
export const ORDER_BOOK_SKELETON_LEVELS_PER_SIDE = 5;

/** Alternating price/value widths so the skeleton does not look like a grid. */
const ROW_SKELETON_WIDTHS = [
  { price: 'w-16', value: 'w-12' },
  { price: 'w-14', value: 'w-14' },
  { price: 'w-16', value: 'w-10' },
  { price: 'w-12', value: 'w-14' },
  { price: 'w-14', value: 'w-12' },
] as const;

type OrderBookRowSkeletonProps = {
  priceWidth: string;
  valueWidth: string;
};

const OrderBookRowSkeleton = ({
  priceWidth,
  valueWidth,
}: OrderBookRowSkeletonProps) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Between}
    gap={2}
    paddingLeft={2}
    paddingRight={4}
    className="h-8 shrink-0"
  >
    <Skeleton className={`h-3 ${priceWidth} rounded`} />
    <Skeleton className={`h-3 ${valueWidth} rounded`} />
  </Box>
);

export type PerpsOrderBookSkeletonProps = {
  /**
   * Levels to render on each side of the spread. Defaults to the compact
   * panel depth used for the live book.
   */
  levelsPerSide?: number;
  'data-testid'?: string;
};

/**
 * Loading placeholder that mirrors the live order-book ladder: ask rows,
 * spread, bid rows, and the buy/sell depth ratio. Same row height and
 * padding as the real content keeps layout shift minimal when data arrives.
 *
 * @param props - Component props.
 * @param props.levelsPerSide - Ask/bid skeleton count per side.
 * @param props.data-testid - Optional test id for the skeleton root.
 */
export const PerpsOrderBookSkeleton = ({
  levelsPerSide = ORDER_BOOK_SKELETON_LEVELS_PER_SIDE,
  'data-testid': dataTestId = 'perps-order-book-skeleton',
}: PerpsOrderBookSkeletonProps) => {
  const rowWidths = Array.from({ length: levelsPerSide }, (_, index) => {
    return ROW_SKELETON_WIDTHS[index % ROW_SKELETON_WIDTHS.length];
  });

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex-1 min-h-0 overflow-hidden"
      data-testid={dataTestId}
      aria-hidden="true"
    >
      <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
        {rowWidths.map(({ price, value }, index) => (
          <OrderBookRowSkeleton
            // Positional slots — same pattern as live ask/bid rows.
            // eslint-disable-next-line react/no-array-index-key
            key={`ask-skeleton-${index}`}
            priceWidth={price}
            valueWidth={value}
          />
        ))}
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Between}
        gap={2}
        paddingLeft={2}
        paddingRight={4}
        className="h-8 shrink-0"
      >
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </Box>

      <Box flexDirection={BoxFlexDirection.Column} className="shrink-0">
        {rowWidths.map(({ price, value }, index) => (
          <OrderBookRowSkeleton
            // eslint-disable-next-line react/no-array-index-key
            key={`bid-skeleton-${index}`}
            priceWidth={price}
            valueWidth={value}
          />
        ))}
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={1}
        paddingLeft={2}
        paddingRight={4}
        paddingTop={4}
        paddingBottom={3}
        className="shrink-0"
      >
        <Skeleton className="h-1 w-full rounded-full" />
        <Box
          flexDirection={BoxFlexDirection.Row}
          justifyContent={BoxJustifyContent.Between}
          className="w-full"
        >
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-3 w-14 rounded" />
        </Box>
      </Box>
    </Box>
  );
};

export default PerpsOrderBookSkeleton;
