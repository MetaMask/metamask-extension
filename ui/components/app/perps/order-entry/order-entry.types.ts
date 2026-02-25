import { OrderType } from '../types';

/**
 * Order direction for perps trading
 * - 'long': Betting the asset price will increase
 * - 'short': Betting the asset price will decrease
 */
export type OrderDirection = 'long' | 'short';

/**
 * Unit type for TP/SL values
 * - 'percent': Value as percentage gain/loss
 * - 'usd': Value as absolute USD amount
 */
export type TPSLUnit = 'percent' | 'usd';

/**
 * Order mode for the order entry component
 * - 'new': Creating a new position
 * - 'modify': Modifying an existing position (add margin, adjust TP/SL)
 * - 'close': Closing an existing position (partial or full)
 */
export type OrderMode = 'new' | 'modify' | 'close';

/**
 * Existing position data for pre-populating the order form
 * Used in 'modify' and 'close' modes
 */
export type ExistingPositionData = {
  /** Asset symbol (e.g., 'ETH', 'BTC') - used for tracking position identity */
  symbol?: string;
  /** Position size (signed: positive = long, negative = short) */
  size: string;
  /** Current leverage multiplier */
  leverage: number;
  /** Entry price for reference display */
  entryPrice: string;
  /** Take profit price (if set) */
  takeProfitPrice?: string;
  /** Stop loss price (if set) */
  stopLossPrice?: string;
};

/**
 * Form state for the order entry component
 * Manages all user inputs for creating a perps order
 */
export type OrderFormState = {
  /** Asset symbol (e.g., 'BTC', 'ETH') */
  asset: string;
  /** Order direction - long or short */
  direction: OrderDirection;
  /** USD amount to trade (string for input handling) */
  amount: string;
  /** Leverage multiplier (1-50x typically) */
  leverage: number;
  /** Percentage of available balance (0-100) */
  balancePercent: number;
  /** Take profit price (optional) */
  takeProfitPrice: string;
  /** Stop loss price (optional) */
  stopLossPrice: string;
  /** Limit price for limit orders */
  limitPrice: string;
  /** Order type - market or limit */
  type: OrderType;
  /** Whether auto-close (TP/SL) section is enabled */
  autoCloseEnabled: boolean;
};

/**
 * Calculated values derived from form state
 * These are read-only display values
 */
export type OrderCalculations = {
  /** Position size in asset units */
  positionSize: string | null;
  /** Margin required for the position */
  marginRequired: string | null;
  /** Estimated liquidation price */
  liquidationPrice: string | null;
  /** Total order value in USD */
  orderValue: string | null;
  /** Estimated trading fees */
  estimatedFees: string | null;
};

/**
 * Props for the main OrderEntry component
 */
export type OrderEntryProps = {
  /** Asset symbol to trade (e.g., 'BTC', 'ETH') */
  asset: string;
  /** Current asset price in USD */
  currentPrice: number;
  /** Maximum leverage allowed for this asset */
  maxLeverage: number;
  /** Available balance for trading */
  availableBalance: number;
  /** Initial order direction (defaults to 'long') */
  initialDirection?: OrderDirection;
  /** Callback when order is submitted (used when showSubmitButton is true) */
  onSubmit?: (formState: OrderFormState) => void;
  /** Callback when form state changes (used when showSubmitButton is false) */
  onFormStateChange?: (formState: OrderFormState) => void;
  /** Whether to show the internal submit button (defaults to true) */
  showSubmitButton?: boolean;
  /** Order mode: 'new' for opening, 'modify' for adjusting, 'close' for closing (defaults to 'new') */
  mode?: OrderMode;
  /** Existing position data for pre-populating form in modify/close modes */
  existingPosition?: ExistingPositionData;
  /** Order type: 'market' or 'limit' (defaults to 'market') */
  orderType?: OrderType;
  /** Mid price from top-of-book for limit order presets */
  midPrice?: number;
  /** Best bid price from top-of-book for limit order presets */
  bidPrice?: number;
  /** Best ask price from top-of-book for limit order presets */
  askPrice?: number;
};

/**
 * Props for DirectionTabs component
 */
export type DirectionTabsProps = {
  /** Currently selected direction */
  direction: OrderDirection;
  /** Callback when direction changes */
  onDirectionChange: (direction: OrderDirection) => void;
};

/**
 * Props for AmountInput component
 */
export type AmountInputProps = {
  /** Current amount value */
  amount: string;
  /** Callback when amount changes */
  onAmountChange: (amount: string) => void;
  /** Current balance percentage (0-100) */
  balancePercent: number;
  /** Callback when balance percentage changes */
  onBalancePercentChange: (percent: number) => void;
  /** Available balance for calculating percentages */
  availableBalance: number;
  /** Current leverage (affects max amount) */
  leverage: number;
  /** Asset symbol for token conversion display */
  asset: string;
  /** Current asset price for token conversion */
  currentPrice: number;
};

/**
 * Props for LeverageSlider component
 */
export type LeverageSliderProps = {
  /** Current leverage value */
  leverage: number;
  /** Callback when leverage changes */
  onLeverageChange: (leverage: number) => void;
  /** Maximum allowed leverage */
  maxLeverage: number;
  /** Minimum allowed leverage (default: 1) */
  minLeverage?: number;
};

/**
 * Props for OrderSummary component
 */
export type OrderSummaryProps = {
  /** Margin required for the position */
  marginRequired: string | null;
  /** Estimated trading fees */
  estimatedFees: string | null;
  /** Estimated liquidation price */
  liquidationPrice: string | null;
};

/**
 * Props for AutoCloseSection component
 */
export type AutoCloseSectionProps = {
  /** Whether auto-close is enabled */
  enabled: boolean;
  /** Callback when enabled state changes */
  onEnabledChange: (enabled: boolean) => void;
  /** Take profit price */
  takeProfitPrice: string;
  /** Callback when TP price changes */
  onTakeProfitPriceChange: (price: string) => void;
  /** Stop loss price */
  stopLossPrice: string;
  /** Callback when SL price changes */
  onStopLossPriceChange: (price: string) => void;
  /** Current order direction (affects TP/SL validation) */
  direction: OrderDirection;
  /** Current asset price (for TP/SL calculations and new orders) */
  currentPrice: number;
  /** Position entry price (for modify mode - use instead of currentPrice for accurate % calc) */
  entryPrice?: number;
};

/**
 * Props for CloseAmountSection component
 * Used in 'close' mode to select how much of the position to close
 */
export type CloseAmountSectionProps = {
  /** Total position size (absolute value) */
  positionSize: string;
  /** Percentage of position to close (0-100, default 100) */
  closePercent: number;
  /** Callback when close percentage changes */
  onClosePercentChange: (percent: number) => void;
  /** Asset symbol for display */
  asset: string;
  /** Current asset price for USD value calculation */
  currentPrice: number;
};
