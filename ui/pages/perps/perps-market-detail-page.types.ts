/**
 * Types for the Perps Market Detail Page
 */

import type {
  Position,
  Order,
  PerpsMarketData,
} from '../../components/app/perps/types';

/**
 * Route params for the perps market detail page
 */
export interface PerpsMarketDetailRouteParams {
  symbol: string;
}

/**
 * Props for the PerpsMarketDetailPage component
 * Currently empty as the component gets data from route params and mocks
 * Will be extended when integrating real data hooks
 */
export interface PerpsMarketDetailPageProps {
  // Props can be added here when needed for testing or composition
}

/**
 * Market detail view state
 */
export interface PerpsMarketDetailState {
  market: PerpsMarketData | undefined;
  position: Position | undefined;
  orders: Order[];
  isLoading: boolean;
  error: string | null;
}
