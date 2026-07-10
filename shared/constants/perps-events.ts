/**
 * Canonical perps analytics contract from `@metamask/perps-controller`.
 *
 * Values come from the controller package (Jest-mapped via
 * `test/mocks/metamask-perps-controller.js`). A thin Extension compatibility
 * layer aliases historical Extension key names onto controller string values
 * so existing UI call sites keep compiling while emitting the controller
 * contract. Prefer controller key names in new code.
 */
import {
  PERPS_EVENT_PROPERTY as CONTROLLER_PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE as CONTROLLER_PERPS_EVENT_VALUE,
  PerpsAnalyticsEvent,
} from '@metamask/perps-controller';

export { PerpsAnalyticsEvent };

/**
 * Controller property keys plus Extension UI-only keys not yet in the package.
 */
export const PERPS_EVENT_PROPERTY = {
  ...CONTROLLER_PERPS_EVENT_PROPERTY,
  /** @deprecated Prefer ORDER_SIZE or POSITION_SIZE from the controller contract. */
  SIZE: 'size',
  /** Extension UI interaction property (button identity). */
  BUTTON_TYPE: 'button_type',
  /** Extension market-list filter property. */
  MARKET_CATEGORY_FILTER: 'market_category_filter',
  /** Extension close-all summary property. */
  NUMBER_POSITIONS_CLOSED: 'number_positions_closed',
} as const;

/**
 * Controller value enums plus Extension aliases / UI-only values.
 * Alias keys keep historical Extension names; values match the controller
 * contract (or prior Extension strings when no controller equivalent exists).
 */
export const PERPS_EVENT_VALUE = {
  ...CONTROLLER_PERPS_EVENT_VALUE,
  SOURCE: {
    ...CONTROLLER_PERPS_EVENT_VALUE.SOURCE,
    /** @deprecated Use ASSET_DETAIL_SCREEN */
    ASSET_DETAILS: CONTROLLER_PERPS_EVENT_VALUE.SOURCE.ASSET_DETAIL_SCREEN,
    /** @deprecated Use PERPS_MARKET_LIST_ALL */
    MARKET_LIST: CONTROLLER_PERPS_EVENT_VALUE.SOURCE.PERPS_MARKET_LIST_ALL,
    /** @deprecated Use TRADE_SCREEN */
    TRADING: CONTROLLER_PERPS_EVENT_VALUE.SOURCE.TRADE_SCREEN,
    /** @deprecated Use HOMESCREEN_TAB */
    WALLET_HOME_PERPS_TAB: CONTROLLER_PERPS_EVENT_VALUE.SOURCE.HOMESCREEN_TAB,
  },
  SCREEN_TYPE: {
    ...CONTROLLER_PERPS_EVENT_VALUE.SCREEN_TYPE,
    /** @deprecated Use CREATE_TPSL */
    CREATE_TP_SL: CONTROLLER_PERPS_EVENT_VALUE.SCREEN_TYPE.CREATE_TPSL,
    /** @deprecated Use EDIT_TPSL */
    UPDATE_TP_SL: CONTROLLER_PERPS_EVENT_VALUE.SCREEN_TYPE.EDIT_TPSL,
    /**
     * Extension-only: controller dropped FLIP_POSITION; keep historical
     * `flip_position` so flip screen views are not misclassified as
     * increase_exposure.
     */
    FLIP_POSITION: 'flip_position',
  },
  BUTTON_LOCATION: {
    ...CONTROLLER_PERPS_EVENT_VALUE.BUTTON_LOCATION,
    /** @deprecated Use PERPS_TAB / PERPS_HOME */
    WALLET_HOME_PERPS_TAB:
      CONTROLLER_PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_TAB,
    /** @deprecated Use TRADE_MENU_ACTION / keep trading location string */
    TRADING: 'trading',
  },
  BUTTON_CLICKED: {
    ...CONTROLLER_PERPS_EVENT_VALUE.BUTTON_CLICKED,
    /** @deprecated Use PLACE_ORDER / OPEN_POSITION */
    TRADE: CONTROLLER_PERPS_EVENT_VALUE.BUTTON_CLICKED.PLACE_ORDER,
    /** Extension support CTA */
    SUPPORT: 'support',
    /** @deprecated Use GIVE_FEEDBACK */
    FEEDBACK: CONTROLLER_PERPS_EVENT_VALUE.BUTTON_CLICKED.GIVE_FEEDBACK,
    MARGIN: 'margin',
    ADD_MARGIN: CONTROLLER_PERPS_EVENT_VALUE.ACTION.ADD_MARGIN,
    REMOVE_MARGIN: CONTROLLER_PERPS_EVENT_VALUE.ACTION.REMOVE_MARGIN,
    INCREASE_EXPOSURE: CONTROLLER_PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE,
    REDUCE_EXPOSURE:
      CONTROLLER_PERPS_EVENT_VALUE.BUTTON_CLICKED.REDUCE_EXPOSURE,
  },
  INTERACTION_TYPE: {
    ...CONTROLLER_PERPS_EVENT_VALUE.INTERACTION_TYPE,
    /** Extension close-all funnel (not yet in controller contract). */
    CLOSE_ALL_TAPPED: 'close_all_tapped',
    CLOSE_ALL_CONFIRMED: 'close_all_confirmed',
    CLOSE_ALL_CANCELLED: 'close_all_cancelled',
  },
  /** @deprecated Prefer ACTION from the controller contract. */
  TRADE_ACTION: {
    CREATE_POSITION: CONTROLLER_PERPS_EVENT_VALUE.ACTION.CREATE_POSITION,
    INCREASE_POSITION: CONTROLLER_PERPS_EVENT_VALUE.ACTION.INCREASE_EXPOSURE,
    FLIP_LONG_TO_SHORT: CONTROLLER_PERPS_EVENT_VALUE.ACTION.FLIP_LONG_TO_SHORT,
    FLIP_SHORT_TO_LONG: CONTROLLER_PERPS_EVENT_VALUE.ACTION.FLIP_SHORT_TO_LONG,
  },
  /** @deprecated Prefer ACTION / SCREEN_TYPE TP-SL values. */
  RISK_MANAGEMENT_TYPE: {
    CREATE_TPSL: CONTROLLER_PERPS_EVENT_VALUE.ACTION.CREATE_TP_SL,
    CREATE_TP: CONTROLLER_PERPS_EVENT_VALUE.ACTION.TP,
    CREATE_SL: CONTROLLER_PERPS_EVENT_VALUE.ACTION.SL,
    UPDATE_TPSL: CONTROLLER_PERPS_EVENT_VALUE.ACTION.EDIT_TP_SL,
    UPDATE_TP: CONTROLLER_PERPS_EVENT_VALUE.ACTION.TP,
    UPDATE_SL: CONTROLLER_PERPS_EVENT_VALUE.ACTION.SL,
    ADD_MARGIN: CONTROLLER_PERPS_EVENT_VALUE.ACTION.ADD_MARGIN,
    REMOVE_MARGIN: CONTROLLER_PERPS_EVENT_VALUE.ACTION.REMOVE_MARGIN,
  },
} as const;

/**
 * verify-locales scans quoted strings in `shared/` and treats them as locale
 * keys. Keep the former mirror's `'tutorial'` literal so removing the hand-
 * maintained enum does not fail locale verification.
 */
export const PERPS_VERIFY_LOCALE_FALSE_POSITIVES = ['tutorial'] as const;
