import type { OrderBookData } from '@metamask/perps-controller';

export type OrderBookTableProps = {
  orderBook: OrderBookData | null;
  symbol: string;
  isLoading?: boolean;
};

export type ExpandableOrderBookProps = {
  symbol: string;
};
