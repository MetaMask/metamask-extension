/* eslint-env node */
/* eslint-disable import-x/unambiguous -- Jest manual mock uses `module.exports`; ESLint parses this glob as `sourceType: 'module'`. */
/**
 * Jest stub for `@metamask/perps-controller`.
 *
 * The real package pulls in `@nktkas/hyperliquid` → ESM `@noble/hashes`, which Jest
 * does not transform. Many UI tests import `ui/components/app/perps` (e.g. via
 * account overview tabs) which eventually loads `usePerpsEventTracking` and the
 * controller package. This mock keeps those suites loadable without listing
 * `jest.mock` in every test file.
 *
 * Tests that need the real controller (or a fuller fake) should call
 * `jest.mock('@metamask/perps-controller', () => ({ ... }))` in that file; it
 * overrides this mapping for that suite.
 *
 * The objects below are named `mock…` so it is obvious they are not the real
 * `@metamask/perps-controller` module. `module.exports` still uses the real
 * export names (`PERPS_EVENT_PROPERTY`, etc.) so `import { … } from '@metamask/perps-controller'`
 * resolves correctly under Jest.
 */

/** @type {Record<string, string>} Minimal mock property keys for tests (subset of the real package). */
const mockPerpsEventPropertyKeys = {
  TIMESTAMP: 'timestamp',
  SCREEN_TYPE: 'screen_type',
  INTERACTION_TYPE: 'interaction_type',
  PREVIOUS_SCREEN: 'previous_screen',
  CURRENT_SCREEN: 'current_screen',
  TAB_NAME: 'tab_name',
  ASSET: 'asset',
  BUTTON_CLICKED: 'button_clicked',
  CANDLE_PERIOD: 'candle_period',
  STATUS: 'status',
  FAILURE_REASON: 'failure_reason',
  ORDER_TYPE: 'order_type',
  DIRECTION: 'direction',
  SELECTED_ORDER_TYPE: 'selected_order_type',
  PERCENTAGE_CLOSED: 'percentage_closed',
  ERROR_TYPE: 'error_type',
  ERROR_MESSAGE: 'error_message',
  LEVERAGE: 'leverage',
  UTM_SOURCE: 'utm_source',
  SCREEN_NAME: 'screen_name',
  SOURCE: 'source',
  HAS_PERP_BALANCE: 'has_perp_balance',
  BUTTON_LOCATION: 'button_location',
  BUTTON_TYPE: 'button_type',
  OPEN_POSITION: 'open_position',
  OPEN_ORDER: 'open_order',
  MAX_SLIPPAGE_PCT: 'max_slippage_pct',
  MAX_SLIPPAGE_SOURCE: 'max_slippage_source',
  ESTIMATED_SLIPPAGE_PCT: 'estimated_slippage_pct',
  SETTING_TYPE: 'setting_type',
  ACTION_TYPE: 'action_type',
  ORDER_TIMESTAMP: 'order_timestamp',
  ENTRY_POINT: 'entry_point',
  DISCOVERY_SOURCE: 'discovery_source',
  PERP_DISCOVERY_SOURCE: 'perp_discovery_source',
  HL_FEE_RATE: 'hl_fee_rate',
  BULK_ACTION_ID: 'bulk_action_id',
  METAMASK_FEE: 'metamask_fee',
  SIZE: 'size',
  ACTION: 'action',
  TYPE: 'type',
  MARKET_CATEGORY_FILTER: 'market_category_filter',
  NUMBER_POSITIONS_CLOSED: 'number_positions_closed',
  // UTM attribution.
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
  UTM_CONTENT: 'utm_content',
  UTM_TERM: 'utm_term',
  // Watchlist membership at event time.
  WATCHLISTED: 'watchlisted',
  // Sort / filter.
  SORT_FIELD: 'sort_field',
  SORT_DIRECTION: 'sort_direction',
  FILTER_CATEGORY: 'filter_category',
  // Client environment.
  ENVIRONMENT_TYPE: 'environment_type',
  // Order funnel + defaults.
  ORDER_CONTEXT: 'order_context',
  ORDER_SIZE: 'order_size',
  ORDER_SIZE_PERCENT: 'order_size_percent',
  INPUT_METHOD: 'input_method',
  ORDER_HAS_TP: 'order_has_tp',
  ORDER_HAS_SL: 'order_has_sl',
  TRADE_WITH_TOKEN: 'trade_with_token',
  SAVED_ORDER: 'saved_order',
  DEFAULT_PAYMENT_TOKEN: 'default_payment_token',
  DEFAULT_SIZE_AMOUNT: 'default_size_amount',
  DEFAULT_LEVERAGE: 'default_leverage',
  DEFAULT_AUTO_CLOSE: 'default_auto_close',
  QUOTE_LATENCY_MS: 'quote_latency_ms',
  ORDER_EXECUTION_LATENCY_MS: 'order_execution_latency_ms',
  ERROR_REASON: 'error_reason',
  FROM_TOKEN: 'from_token',
  FROM_CHAIN: 'from_chain',
  TO_TOKEN: 'to_token',
  TO_CHAIN: 'to_chain',
};

/** @type {Record<string, Record<string, string>>} Minimal mock enum-like values for tests (subset of the real package). */
const mockPerpsEventValueLiterals = {
  SCREEN_TYPE: {
    WALLET_HOME_PERPS_TAB: 'wallet_home_perps_tab',
    MARKET_LIST: 'market_list',
    TRADING: 'trading',
    ASSET_DETAILS: 'asset_details',
    ACTIVITY: 'activity',
    TUTORIAL: 'tutorial',
    POSITION_CLOSE: 'position_close',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    INCREASE_EXPOSURE: 'increase_exposure',
    COMPLIANCE_BLOCK_NOTIF: 'compliance_block_notif',
    FLIP_POSITION: 'flip_position',
    ERROR: 'error',
  },
  SCREEN_NAME: {
    PERPS_HOME: 'perps_home',
    PERPS_MARKET_DETAILS: 'perps_market_details',
    PERPS_ACTIVITY_HISTORY: 'perps_activity_history',
    PERPS_ORDER: 'perps_order',
  },
  INTERACTION_TYPE: {
    ORDER_TYPE_SELECTED: 'order_type_selected',
    TAP: 'tap',
    BUTTON_CLICKED: 'button_clicked',
    LEVERAGE_CHANGED: 'leverage_changed',
    CANDLE_PERIOD_CHANGED: 'candle_period_changed',
    FAVORITE_TOGGLED: 'favorite_toggled',
    SEARCH_CLICKED: 'search_clicked',
    TUTORIAL_STARTED: 'tutorial_started',
    TUTORIAL_COMPLETED: 'tutorial_completed',
    TUTORIAL_NAVIGATION: 'tutorial_navigation',
    CLOSE_ALL_TAPPED: 'close_all_tapped',
    CLOSE_ALL_CONFIRMED: 'close_all_confirmed',
    CLOSE_ALL_CANCELLED: 'close_all_cancelled',
    SLIPPAGE_CONFIG_OPENED: 'slippage_config_opened',
    SLIPPAGE_CONFIG_CHANGED: 'slippage_config_changed',
    SLIPPAGE_LIMIT_BLOCKED_ORDER: 'slippage_limit_blocked_order',
    SORT_APPLIED: 'sort_applied',
    FILTER_APPLIED: 'filter_applied',
    PAYMENT_TOKEN_SELECTOR_DISMISSED: 'payment_token_selector_dismissed',
  },
  BUTTON_CLICKED: {
    DEPOSIT: 'deposit',
    WITHDRAW: 'withdraw',
    TRADE: 'place_order',
    PLACE_ORDER: 'place_order',
    CLOSE: 'close',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    MARGIN: 'margin',
    INCREASE_EXPOSURE: 'increase_exposure',
    REDUCE_EXPOSURE: 'reduce_exposure',
    TUTORIAL: 'tutorial',
    SUPPORT: 'support',
    FEEDBACK: 'give_feedback',
    GIVE_FEEDBACK: 'give_feedback',
  },
  MAX_SLIPPAGE_SOURCE: {
    DEFAULT: 'default',
    USER_CONFIGURED: 'user_configured',
  },
  SETTING_TYPE: {
    SLIPPAGE: 'slippage',
  },
  PERPS_HISTORY_TABS: {
    TRADES: 'trades',
  },
  ACTION_TYPE: {
    ADL_LEARN_MORE: 'adl_learn_more',
  },
  DIRECTION: {
    LONG: 'long',
    SHORT: 'short',
  },
  STATUS: {
    FAILED: 'failed',
    SUCCESS: 'success',
    SUBMITTED: 'submitted',
    EXECUTED: 'executed',
  },
  ERROR_TYPE: {
    BACKEND: 'backend',
    VALIDATION: 'validation',
    WARNING: 'warning',
    NETWORK: 'network',
  },
  SOURCE: {
    HOMESCREEN_TAB: 'homescreen_tab',
    MARKET_LIST: 'perps_market_list_all',
    ASSET_DETAILS: 'asset_detail_screen',
    TRADING: 'trade_screen',
    DEEPLINK: 'deeplink',
    TRADE_SCREEN: 'trade_screen',
    WALLET_HOME_PERPS_TAB: 'homescreen_tab',
    ASSET_DETAIL_SCREEN: 'asset_detail_screen',
    PERPS_MARKET_LIST_ALL: 'perps_market_list_all',
  },
  ACTION: {
    CREATE_POSITION: 'create_position',
    INCREASE_EXPOSURE: 'increase_exposure',
    FLIP_LONG_TO_SHORT: 'flip_long_to_short',
    FLIP_SHORT_TO_LONG: 'flip_short_to_long',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    CREATE_TP_SL: 'create_tp_sl',
    EDIT_TP_SL: 'edit_tp_sl',
    TP: 'tp',
    SL: 'sl',
  },
  TRADE_ACTION: {
    CREATE_POSITION: 'create_position',
    INCREASE_POSITION: 'increase_exposure',
    FLIP_LONG_TO_SHORT: 'flip_long_to_short',
    FLIP_SHORT_TO_LONG: 'flip_short_to_long',
  },
  RISK_MANAGEMENT_TYPE: {
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    CREATE_TPSL: 'create_tp_sl',
    UPDATE_TPSL: 'edit_tp_sl',
  },
  BUTTON_LOCATION: {
    MARKET_LIST: 'market_list',
    ASSET_DETAILS: 'asset_details',
    TRADING: 'trading',
    WALLET_HOME_PERPS_TAB: 'perps_tab',
    PERPS_TAB: 'perps_tab',
  },
};

/** @type {Record<string, string>} Mock analytics event name strings (subset of `PerpsAnalyticsEvent`). */
const mockPerpsAnalyticsEventNames = {
  WithdrawalTransaction: 'Perp Withdrawal Transaction',
  TradeTransaction: 'Perp Trade Transaction',
  PositionCloseTransaction: 'Perp Position Close Transaction',
  OrderCancelTransaction: 'Perp Order Cancel Transaction',
  ScreenViewed: 'Perp Screen Viewed',
  UiInteraction: 'Perp UI Interaction',
  RiskManagement: 'Perp Risk Management',
  PerpsError: 'Perp Error',
};

const mockMarketCategories = [
  'crypto',
  'stock',
  'pre-ipo',
  'index',
  'etf',
  'commodity',
  'forex',
];

function mockIsHip3Market(market) {
  return Boolean(market?.isHip3) || Boolean(market?.marketSource);
}

function mockGetMarketTypeFilter(market) {
  if (market?.marketType) {
    return market.marketType;
  }

  return mockIsHip3Market(market) ? 'new' : 'crypto';
}

/**
 * Proxy-based mock for PERPS_ERROR_CODES.
 * Any property access returns the property name as a string, so code like
 * `PERPS_ERROR_CODES.CLIENT_NOT_INITIALIZED` evaluates to `'CLIENT_NOT_INITIALIZED'`
 * without needing to enumerate every key.
 */
const mockPerpsErrorCodes = new Proxy(
  {},
  { get: (_target, prop) => String(prop) },
);

const mockOrderSlippageConfig = {
  DefaultMarketSlippageBps: 300,
  DefaultTpslSlippageBps: 1000,
  DefaultLimitSlippageBps: 100,
};

const mockMaxSlippageBounds = {
  MinBps: 10,
  MaxBps: 1000,
  StepBps: 10,
};

const mockPerformanceConfig = {
  SlippageEstimateThrottleMs: 250,
  SlippageEstimateBookLevels: 10,
};

const mockTradingDefaults = {
  leverage: 3,
  marginPercent: 10,
  takeProfitPercent: 0.3,
  stopLossPercent: 0.1,
  amount: {
    mainnet: 10,
    testnet: 10,
  },
};

/**
 * Simplified max-amount helper for unit tests (matches controller shape; omits
 * position-size rounding details that are covered by controller tests).
 *
 * @param {object} params
 * @param {number} params.spendableBalance
 * @param {number} params.assetPrice
 * @param {number} params.assetSzDecimals
 * @param {number} params.leverage
 * @returns {number}
 */
function mockGetMaxAllowedAmount({
  spendableBalance,
  assetPrice,
  assetSzDecimals,
  leverage,
}) {
  if (spendableBalance === 0 || !assetPrice || assetSzDecimals === undefined) {
    return 0;
  }
  return Math.max(0, Math.floor(spendableBalance * leverage * 0.99));
}

module.exports = {
  PERPS_EVENT_PROPERTY: mockPerpsEventPropertyKeys,
  PERPS_EVENT_VALUE: mockPerpsEventValueLiterals,
  PerpsAnalyticsEvent: mockPerpsAnalyticsEventNames,
  PERPS_ERROR_CODES: mockPerpsErrorCodes,
  ORDER_SLIPPAGE_CONFIG: mockOrderSlippageConfig,
  MAX_SLIPPAGE_BOUNDS: mockMaxSlippageBounds,
  PERFORMANCE_CONFIG: mockPerformanceConfig,
  TRADING_DEFAULTS: mockTradingDefaults,
  getMaxAllowedAmount: mockGetMaxAllowedAmount,
  BASIS_POINTS_DIVISOR: 10000,
  MARKET_CATEGORIES: mockMarketCategories,
  isHip3Market: mockIsHip3Market,
  getMarketTypeFilter: mockGetMarketTypeFilter,
};
