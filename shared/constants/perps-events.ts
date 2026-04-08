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
} as const;

export const PERPS_EVENT_VALUE = {
  SCREEN_TYPE: {
    MARKET_LIST: 'market_list',
    TRADING: 'trading',
    ASSET_DETAILS: 'asset_details',
    ACTIVITY: 'activity',
    TUTORIAL: 'tutorial',
    POSITION_CLOSE: 'position_close',
    ADD_MARGIN: 'add_margin',
    REMOVE_MARGIN: 'remove_margin',
    INCREASE_EXPOSURE: 'increase_exposure',
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
} as const;
