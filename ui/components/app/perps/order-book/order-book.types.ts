/** Unit used for the "Total" column of the order book. */
export type OrderBookUnit = 'base' | 'usd';

export type PerpsOrderBookProps = {
  /** Symbol to display the order book for (e.g. 'BTC', 'ETH'). */
  symbol: string;
  /**
   * Whether the order book panel is currently visible. When false the live
   * channel read is disabled to avoid unnecessary work while hidden.
   */
  isOpen: boolean;
  /** Called when the user requests to close the panel. */
  onClose: () => void;
  /** Test id for the container. */
  'data-testid'?: string;
};
