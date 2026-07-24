/** Currency the metric column is denominated in. */
export type OrderBookListCurrency = 'base' | 'usd';

/** Metric shown in the value column: per-level size or cumulative total. */
export type OrderBookListMetric = 'size' | 'total';

export type PerpsOrderBookProps = {
  /** Symbol to display the order book for (e.g. 'BTC', 'ETH'). */
  symbol: string;
  /**
   * Whether the order book panel is currently visible. When false the live
   * channel read is disabled to avoid unnecessary work while hidden.
   */
  isOpen: boolean;
  /**
   * Current mid/market price, used to derive sensible price-grouping options
   * when the order book has not yet produced its own mid price.
   */
  marketPrice?: number;
  /**
   * Asset-specific base-size decimal precision (Hyperliquid `szDecimals`), used
   * to format base-denominated amounts consistently with the rest of the UI.
   */
  szDecimals?: number;
  /**
   * Called with a level's raw price string when the user taps a bid/ask row.
   * Used to switch the order form to a limit order prefilled with that price.
   * When omitted, rows are not interactive.
   */
  onSelectPrice?: (price: string) => void;
  /** Test id for the container. */
  'data-testid'?: string;
};

export type PerpsOrderBookConfigModalProps = {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** DOM id for the dialog, referenced by the trigger's `aria-controls`. */
  id?: string;
  /** Display symbol for the base currency toggle (e.g. 'BTC'). */
  baseSymbol: string;
  /** Currently applied currency. */
  currency: OrderBookListCurrency;
  /** Currently applied metric. */
  metric: OrderBookListMetric;
  /** Currently applied price grouping. */
  grouping: number | null;
  /** Available price-grouping options. */
  groupingOptions: number[];
  /** Called with the chosen settings when the user taps Apply. */
  onApply: (next: {
    currency: OrderBookListCurrency;
    metric: OrderBookListMetric;
    grouping: number;
  }) => void;
  /** Called when the modal is dismissed. */
  onClose: () => void;
  /** Test id for the modal. */
  'data-testid'?: string;
};
