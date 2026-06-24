import type { OrderBookData } from '@metamask/perps-controller';

export type OrderBookTableProps = {
  orderBook: OrderBookData | null;
  symbol: string;
  isLoading?: boolean;
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
