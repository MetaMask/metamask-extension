/**
 * Perps event property keys and values - matching dashboard requirements exactly.
 * Event names are defined in MetaMetrics.events.ts as the single source of truth.
 */

/**
 * Event property keys - ensures consistent property naming
 */
export const PerpsEventProperties = {
  // Common properties
  TIMESTAMP: 'timestamp',
  ASSET: 'asset',
  DIRECTION: 'direction',
  SOURCE: 'source',
  TAB_NAME: 'tab_name',
  LOCATION: 'location',

  // Trade properties
  LEVERAGE: 'leverage',
  LEVERAGE_USED: 'leverage_used',
  ORDER_SIZE: 'order_size',
  MARGIN_USED: 'margin_used',
  ORDER_TYPE: 'order_type',
  ORDER_TIMESTAMP: 'order_timestamp',
  LIMIT_PRICE: 'limit_price',
  FEES: 'fees',
  FEE: 'fee',
  METAMASK_FEE: 'metamask_fee',
  METAMASK_FEE_RATE: 'metamask_fee_rate',
  DISCOUNT_PERCENTAGE: 'discount_percentage',
  ESTIMATED_REWARDS: 'estimated_rewards',
  ASSET_PRICE: 'asset_price',
  COMPLETION_DURATION: 'completion_duration',

  // Position properties
  OPEN_POSITION: 'open_position',
  OPEN_POSITION_SIZE: 'open_position_size',
  UNREALIZED_PNL_DOLLAR: 'unrealized_dollar_pnl',
  UNREALIZED_PNL_PERCENT: 'unrealized_percent_pnl',
  CLOSE_VALUE: 'close_value',
  CLOSE_PERCENTAGE: 'close_percentage',
  CLOSE_TYPE: 'close_type',
  PERCENTAGE_CLOSED: 'percentage_closed',
  PNL_DOLLAR: 'dollar_pnl',
  PNL_PERCENT: 'percent_pnl',
  RECEIVED_AMOUNT: 'received_amount',

  // Order type variations
  CURRENT_ORDER_TYPE: 'current_order_type',
  SELECTED_ORDER_TYPE: 'selected_order_type',

  // Funding properties
  SOURCE_CHAIN: 'source_chain',
  SOURCE_ASSET: 'source_asset',
  SOURCE_AMOUNT: 'source_amount',
  DESTINATION_AMOUNT: 'destination_amount',
  NETWORK_FEE: 'network_fee',
  WITHDRAWAL_AMOUNT: 'withdrawal_amount',

  // Risk management properties
  STOP_LOSS_PRICE: 'stop_loss_price',
  STOP_LOSS_PERCENT: 'stop_loss_percent',
  TAKE_PROFIT_PRICE: 'take_profit_price',
  TAKE_PROFIT_PERCENT: 'take_profit_percent',
  POSITION_SIZE: 'position_size',
  TAKE_PROFIT_PERCENTAGE: 'take_profit_percentage',
  STOP_LOSS_PERCENTAGE: 'stop_loss_percentage',

  // Other properties
  INPUT_METHOD: 'input_method',
  ACTION_TYPE: 'action_type',
  SETTING_TYPE: 'setting_type',
  ERROR_MESSAGE: 'error_message',
  STATUS: 'status',
  SCREEN_TYPE: 'screen_type',
  SCREEN_NAME: 'screen_name',
  ACTION: 'action',
  AMOUNT_FILLED: 'amount_filled',
  REMAINING_AMOUNT: 'remaining_amount',

  // TP/SL differentiation properties
  HAS_TAKE_PROFIT: 'has_take_profit',
  HAS_STOP_LOSS: 'has_stop_loss',
} as const;

/**
 * Property value constants
 */
export const PerpsEventValues = {
  DIRECTION: {
    LONG: 'long',
    SHORT: 'short',
  },
  ORDER_TYPE: {
    MARKET: 'market',
    LIMIT: 'limit',
  },
  SOURCE: {
    TP_SL_VIEW: 'tp_sl_view',
    POSITION_SCREEN: 'position_screen',
    TRADE_SCREEN: 'trade_screen',
  },
  STATUS: {
    VIEWED: 'viewed',
    STARTED: 'started',
    COMPLETED: 'completed',
    INITIATED: 'initiated',
    SUBMITTED: 'submitted',
    EXECUTED: 'executed',
    PARTIALLY_FILLED: 'partially_filled',
    FAILED: 'failed',
    SUCCESS: 'success',
  },
  SCREEN_TYPE: {
    CREATE_TPSL: 'create_tpsl',
    EDIT_TPSL: 'edit_tpsl',
  },
  CLOSE_TYPE: {
    FULL: 'full',
    PARTIAL: 'partial',
  },
} as const;
