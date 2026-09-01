/**
 * Perps Transaction History Types
 *
 * Types for representing unified transaction history in the Perps UI.
 * Includes trades, orders, funding payments, and deposits/withdrawals.
 */

/**
 * Order transaction status display values
 */
export enum PerpsOrderTransactionStatus {
  Filled = 'Filled',
  Canceled = 'Canceled',
  Rejected = 'Rejected',
  Triggered = 'Triggered',
  Queued = 'Queued',
  Open = '',
}

/**
 * Order transaction status type for styling
 */
export enum PerpsOrderTransactionStatusType {
  Filled = 'filled',
  Canceled = 'canceled',
  Pending = 'pending',
}

/**
 * Fill type for distinguishing trade execution types
 */
export enum FillType {
  Standard = 'standard',
  Liquidation = 'liquidation',
  TakeProfit = 'take_profit',
  StopLoss = 'stop_loss',
  AutoDeleveraging = 'auto_deleveraging',
}

/**
 * Unified transaction type for all perps transaction types
 */
export type PerpsTransaction = {
  /** Unique identifier for the transaction */
  id: string;
  /** Transaction type */
  type: 'trade' | 'order' | 'funding' | 'deposit' | 'withdrawal';
  /** Transaction category for display */
  category:
    | 'position_open'
    | 'position_close'
    | 'limit_order'
    | 'funding_fee'
    | 'deposit'
    | 'withdrawal';
  /** Display title (e.g., "Opened long", "Limit buy") */
  title: string;
  /** Display subtitle - asset amount (e.g., "2.01 ETH") */
  subtitle: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Asset symbol */
  symbol: string;

  /** For trades: fill execution info */
  fill?: {
    /** Short title for compact display (e.g., "Opened long") */
    shortTitle: string;
    /** Display amount with sign (e.g., "+$43.99" or "-$400") */
    amount: string;
    /** Numeric amount value */
    amountNumber: number;
    /** Whether the amount is positive (for styling) */
    isPositive: boolean;
    /** Fill size in asset units */
    size: string;
    /** Entry/execution price */
    entryPrice: string;
    /** Points earned (if applicable) */
    points: string;
    /** Realized PnL */
    pnl: string;
    /** Trading fee */
    fee: string;
    /** Action type (e.g., "Opened", "Closed") */
    action: string;
    /** Fee token symbol */
    feeToken: string;
    /** Liquidation info if applicable */
    liquidation?: {
      /** Address of the liquidated user */
      liquidatedUser: string;
      /** Mark price at liquidation */
      markPx: string;
      /** Liquidation method */
      method: string;
    };
    /** Type of fill execution */
    fillType: FillType;
  };

  /** For orders: order lifecycle info */
  order?: {
    /** Status display text */
    text: PerpsOrderTransactionStatus;
    /** Status type for styling */
    statusType: PerpsOrderTransactionStatusType;
    /** Order type */
    type: 'limit' | 'market';
    /** Order size in USD */
    size: string;
    /** Limit price */
    limitPrice: string;
    /** Filled percentage (e.g., "50%") */
    filled: string;
  };

  /** For funding: funding payment info */
  fundingAmount?: {
    /** Whether funding was received (positive) or paid (negative) */
    isPositive: boolean;
    /** Display fee with sign (e.g., "+$5.00" or "-$3.20") */
    fee: string;
    /** Numeric fee value */
    feeNumber: number;
    /** Funding rate (e.g., "0.01%") */
    rate: string;
  };

  /** For deposits/withdrawals: deposit or withdrawal info */
  depositWithdrawal?: {
    /** Display amount with sign */
    amount: string;
    /** Numeric amount value */
    amountNumber: number;
    /** Whether positive (deposit) or negative (withdrawal) for styling */
    isPositive: boolean;
    /** Asset symbol */
    asset: string;
    /** Transaction hash */
    txHash: string;
    /** Transaction status */
    status: 'completed' | 'failed' | 'pending' | 'bridging';
    /** Transaction type */
    type: 'deposit' | 'withdrawal';
  };
};

/**
 * Filter type for transaction list
 */
export type PerpsTransactionFilter =
  | 'trade'
  | 'order'
  | 'funding'
  | 'deposit'
  | 'all';

/**
 * Type for date-grouped transaction sections
 */
export type TransactionSection = {
  /** Section header (e.g., "Today", "Jul 26") */
  title: string;
  /** Transactions in this section */
  data: PerpsTransaction[];
};
