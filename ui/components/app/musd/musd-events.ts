/**
 * MUSD Conversion Analytics Events
 *
 * Event property constants, types, and helpers for the mUSD conversion feature.
 * Event names live in MetaMetricsEventName (shared/constants/metametrics.ts).
 * Event category lives in MetaMetricsEventCategory (shared/constants/metametrics.ts).
 */

// ============================================================================
// Event Constants
// ============================================================================

/**
 * Constants used in event properties
 */
export const MUSD_EVENTS_CONSTANTS = {
  /** Event providers */
  EVENT_PROVIDERS: {
    CONSENSYS: 'consensys',
  },

  /** Event locations */
  EVENT_LOCATIONS: {
    HOME_SCREEN: 'home_screen',
    TOKEN_LIST_ITEM: 'token_list_item',
    ASSET_OVERVIEW: 'asset_overview',
    CLAIM_BONUS_BOTTOM_SHEET: 'claim_bonus_bottom_sheet',
    CONVERSION_EDUCATION_SCREEN: 'conversion_education_screen',
    CUSTOM_AMOUNT_SCREEN: 'custom_amount_screen',
    BUY_SCREEN: 'buy_screen',
  },

  /** CTA types */
  MUSD_CTA_TYPES: {
    /** Primary CTA - "Buy/Get mUSD" above asset list */
    PRIMARY: 'musd_conversion_primary_cta',
    /** Secondary CTA - "Convert to mUSD" on token list item */
    SECONDARY: 'musd_conversion_secondary_cta',
    /** Tertiary CTA - Asset overview CTA */
    TERTIARY: 'musd_conversion_tertiary_cta',
  },

  /** Button types */
  BUTTON_TYPES: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
  },

  /** Redirect destinations */
  REDIRECT_DESTINATIONS: {
    CONVERSION_EDUCATION_SCREEN: 'conversion_education_screen',
    CUSTOM_AMOUNT_SCREEN: 'custom_amount_screen',
    BUY_SCREEN: 'buy_screen',
    HOME_SCREEN: 'home_screen',
  },

  /** CTA click targets */
  CTA_CLICK_TARGETS: {
    CTA_BUTTON: 'cta_button',
    CTA_TEXT_LINK: 'cta_text_link',
  },
} as const;

// ============================================================================
// Event Property Types
// ============================================================================

/**
 * Properties for MUSD_CONVERSION_CTA_CLICKED event
 */
export type MusdCtaClickedEventProperties = {
  /** Where the CTA was displayed */
  location:
    | 'home_screen'
    | 'token_list_item'
    | 'asset_overview'
    | 'claim_bonus_bottom_sheet';
  /** Where the user will be redirected */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  redirects_to:
    | 'conversion_education_screen'
    | 'custom_amount_screen'
    | 'buy_screen';
  /** Type of CTA clicked */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_type:
    | 'musd_conversion_primary_cta'
    | 'musd_conversion_secondary_cta'
    | 'musd_conversion_tertiary_cta';
  /** Text displayed on the CTA */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_text: string;
  /** What element was clicked */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_click_target?: 'cta_button' | 'cta_text_link';
  /** Network chain ID (hex) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: string | null;
  /** Network name */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
  /** Asset symbol if applicable */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  asset_symbol?: string;
};

/**
 * Properties for MUSD_FULLSCREEN_ANNOUNCEMENT_BUTTON_CLICKED event
 */
export type MusdEducationButtonClickedEventProperties = {
  /** Always 'conversion_education_screen' */
  location: 'conversion_education_screen';
  /** Which button was clicked */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  button_type: 'primary' | 'secondary';
  /** Text displayed on the button */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  button_text: string;
  /** Where the user will be redirected */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  redirects_to: 'custom_amount_screen' | 'buy_screen' | 'home_screen';
};

/**
 * Properties for MUSD_CONVERSION_STATUS_UPDATED event
 */
export type MusdConversionStatusUpdatedEventProperties = {
  /** Transaction ID */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_id: string;
  /** Current transaction status */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_status: string;
  /** Transaction type - always 'musdConversion' */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_type: 'musdConversion';
  /** Token being converted */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  asset_symbol: string;
  /** Network chain ID (hex) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: string;
  /** Network name */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
  /** Amount in decimal format */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  amount_decimal: string;
  /** Amount in hex format */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  amount_hex: string;
};

/**
 * Properties for MUSD_CLAIM_BONUS_BUTTON_CLICKED event
 */
export type MusdClaimBonusButtonClickedEventProperties = {
  /** Where the button was displayed */
  location: 'claim_bonus_bottom_sheet';
  /** Claim amount in mUSD */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  claim_amount: string;
  /** Network chain ID (hex) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: string;
  /** Network name */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
};

/**
 * Properties for quote-related events
 */
export type MusdQuoteEventProperties = {
  /** Source token symbol */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  source_token_symbol: string;
  /** Source token address */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  source_token_address: string;
  /** Amount being converted */
  amount: string;
  /** Network chain ID (hex) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: string;
  /** Network name */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
  /** Error message if applicable */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_message?: string;
  /** Quote response time in ms (for received event) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  response_time_ms?: number;
};

/**
 * Properties for conversion completion/failure events
 */
export type MusdConversionResultEventProperties = {
  /** Transaction ID */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_id: string;
  /** Transaction hash */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  transaction_hash?: string;
  /** Source token symbol */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  source_token_symbol: string;
  /** Amount converted */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  amount_converted: string;
  /** mUSD amount received */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  musd_amount_received?: string;
  /** Network chain ID (hex) */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  chain_id: string;
  /** Network name */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
  /** Error message if applicable */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  error_message?: string;
  /** Time from start to completion in ms */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  duration_ms: number;
};

// ============================================================================
// Trace Names (Sentry Performance)
// ============================================================================

/**
 * Trace names for performance monitoring
 */
export const MUSD_TRACE_NAMES = {
  /** Navigation to conversion screen */
  MUSD_CONVERSION_NAVIGATION: 'MusdConversionNavigation',
  /** Quote fetching time */
  MUSD_CONVERSION_QUOTE: 'MusdConversionQuote',
  /** Transaction confirmation time */
  MUSD_CONVERSION_CONFIRM: 'MusdConversionConfirm',
} as const;

/**
 * Trace operations for categorization
 */
export const MUSD_TRACE_OPERATIONS = {
  OPERATION: 'musd.conversion.operation',
  DATA_FETCH: 'musd.conversion.data_fetch',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create standard mUSD event properties with network info
 *
 * @param chainId - The chain ID in hex format
 * @param chainName - The network name
 * @returns Base event properties with network info
 */
export const createMusdNetworkEventProperties = (
  chainId: string | null,
  chainName: string,
): {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: string | null;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: string;
} => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: chainId,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: chainName,
});

/**
 * Create CTA clicked event properties
 *
 * @param params - Event parameters
 * @param params.location
 * @param params.redirectsTo
 * @param params.ctaType
 * @param params.ctaText
 * @param params.chainId
 * @param params.chainName
 * @param params.assetSymbol
 * @param params.clickTarget
 * @returns Complete event properties object
 */
export const createMusdCtaClickedEventProperties = (params: {
  location: MusdCtaClickedEventProperties['location'];
  redirectsTo: MusdCtaClickedEventProperties['redirects_to'];
  ctaType: MusdCtaClickedEventProperties['cta_type'];
  ctaText: string;
  chainId: string | null;
  chainName: string;
  assetSymbol?: string;
  clickTarget?: MusdCtaClickedEventProperties['cta_click_target'];
}): MusdCtaClickedEventProperties => ({
  location: params.location,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  redirects_to: params.redirectsTo,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_type: params.ctaType,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_text: params.ctaText,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  cta_click_target: params.clickTarget,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_chain_id: params.chainId,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  network_name: params.chainName,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  asset_symbol: params.assetSymbol,
});
