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
};

/** @type {Record<string, Record<string, string>>} Minimal mock enum-like values for tests (subset of the real package). */
const mockPerpsEventValueLiterals = {
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

module.exports = {
  PERPS_EVENT_PROPERTY: mockPerpsEventPropertyKeys,
  PERPS_EVENT_VALUE: mockPerpsEventValueLiterals,
  PerpsAnalyticsEvent: mockPerpsAnalyticsEventNames,
};
