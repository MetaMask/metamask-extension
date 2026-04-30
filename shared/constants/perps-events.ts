/**
 * Perps analytics event property keys and value enums.
 *
 * These constants are intentionally defined locally rather than imported from
 * `@metamask/perps-controller`.  The controller transitively pulls in
 * ESM-only packages (`@nktkas/hyperliquid` → `@noble/hashes`) that Jest
 * cannot transform, so a value import anywhere in the UI module graph
 * would break every test that transitively loads the importing file.
 *
 * The values here must stay in sync with the canonical definitions exported
 * by `@metamask/perps-controller`.
 */

export const PERPS_EVENT_PROPERTY = {
  TIMESTAMP: 'perps_timestamp',
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
  TYPE: 'type',
  SIZE: 'size',
  METAMASK_FEE: 'metamask_fee',
  ACTION: 'action',
  SOURCE: 'source',
  HAS_PERP_BALANCE: 'has_perp_balance',
  BUTTON_TYPE: 'button_type',
  BUTTON_LOCATION: 'button_location',
  MARKET_CATEGORY_FILTER: 'market_category_filter',
  OPEN_POSITION: 'open_position',
  OPEN_ORDER: 'open_order',
} as const;

export const PERPS_EVENT_VALUE = {
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
    FLIP_POSITION: 'flip_position',
    CREATE_TP_SL: 'create_tp_sl',
    UPDATE_TP_SL: 'update_tp_sl',
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
  },
  BUTTON_CLICKED: {
    DEPOSIT: 'deposit',
    WITHDRAW: 'withdraw',
    TUTORIAL: 'tutorial',
    SUPPORT: 'support',
    FEEDBACK: 'feedback',
    MARGIN: 'margin',
    INCREASE_EXPOSURE: 'increase_exposure',
    REDUCE_EXPOSURE: 'reduce_exposure',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    TRADE: 'trade',
  },
  DIRECTION: {
    LONG: 'long',
    SHORT: 'short',
  },
  STATUS: {
    FAILED: 'failed',
    SUCCESS: 'success',
  },
  ERROR_TYPE: {
    BACKEND: 'backend',
  },
  RISK_MANAGEMENT_TYPE: {
    CREATE_TPSL: 'create_tpsl',
    CREATE_TP: 'create_tp',
    CREATE_SL: 'create_sl',
    UPDATE_TPSL: 'update_tpsl',
    UPDATE_TP: 'update_tp',
    UPDATE_SL: 'update_sl',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
  },
  TRADE_ACTION: {
    CREATE_POSITION: 'create_position',
    INCREASE_POSITION: 'increase_position',
    FLIP_LONG_TO_SHORT: 'flip_long_to_short',
    FLIP_SHORT_TO_LONG: 'flip_short_to_long',
  },
  SOURCE: {
    WALLET_HOME_PERPS_TAB: 'wallet_home_perps_tab',
    HOMESCREEN_TAB: 'homescreen_tab',
    MARKET_LIST: 'market_list',
    ASSET_DETAILS: 'perps_asset_details_screen',
    DEEPLINK: 'deeplink',
    TRADING: 'trading',
  },
  BUTTON_LOCATION: {
    ASSET_DETAILS: 'asset_details',
    MARKET_LIST: 'market_list',
    TRADING: 'trading',
    WALLET_HOME_PERPS_TAB: 'wallet_home_perps_tab',
  },
} as const;

export enum PerpsAnalyticsEvent {
  WithdrawalTransaction = 'Perp Withdrawal Transaction',
  TradeTransaction = 'Perp Trade Transaction',
  PositionCloseTransaction = 'Perp Position Close Transaction',
  OrderCancelTransaction = 'Perp Order Cancel Transaction',
  ScreenViewed = 'Perp Screen Viewed',
  UiInteraction = 'Perp UI Interaction',
  RiskManagement = 'Perp Risk Management',
  PerpsError = 'Perp Error',
}
