import type { OrderBookData } from '@metamask/perps-controller';

export type OrderBookGrouping = 0.1 | 1 | 10 | 100 | 1000;

export type OrderBookTableProps = {
  orderBook: OrderBookData | null;
  symbol: string;
  isLoading?: boolean;
  grouping?: OrderBookGrouping;
};

export type ExpandableOrderBookProps = {
  symbol: string;
  onExpandChange?: (isExpanded: boolean) => void;
};

export type OrderBookToggleProps = {
  isExpanded: boolean;
  onToggle: () => void;
};

export type OrderBookPanelProps = {
  symbol: string;
};
