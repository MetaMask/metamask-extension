/**
 * Types for the Perps Market Detail Page
 */

import type {
  Position,
  Order,
  PerpsMarketData,
} from '@metamask/perps-controller';

/**
 * Route params for the perps market detail page
 */
export type PerpsMarketDetailRouteParams = {
  symbol: string;
};

/**
 * Props for the PerpsMarketDetailPage component
 * Currently empty as the component gets data from route params and mocks
 * Will be extended when integrating real data hooks
 */
export type PerpsMarketDetailPageProps = {
  // Props can be added here when needed for testing or composition
};

/**
 * Market detail view state
 */
export type PerpsMarketDetailState = {
  market: PerpsMarketData | undefined;
  position: Position | undefined;
  orders: Order[];
  isLoading: boolean;
  error: string | null;
};
