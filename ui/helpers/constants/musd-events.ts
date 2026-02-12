/**
 * MUSD Conversion Analytics Events
 *
 * This file contains all analytics event constants for the mUSD conversion feature.
 * These events are tracked via MetaMetrics (Segment).
 */

// ============================================================================
// Event Names
// ============================================================================

/**
 * MetaMetrics event names for mUSD conversion feature
 * These should be added to MetaMetricsEventName enum in shared/constants/metametrics.ts
 */
export const MUSD_EVENT_NAMES = {
  /** User clicked any mUSD conversion CTA */
  MUSD_CONVERSION_CTA_CLICKED: 'MUSD Conversion CTA Clicked',
  /** Education screen was displayed */
  MUSD_FULLSCREEN_ANNOUNCEMENT_DISPLAYED:
    'MUSD Fullscreen Announcement Displayed',
  /** Button clicked on education screen */
  MUSD_FULLSCREEN_ANNOUNCEMENT_BUTTON_CLICKED:
    'MUSD Fullscreen Announcement Button Clicked',
  /** Transaction status changed */
  MUSD_CONVERSION_STATUS_UPDATED: 'MUSD Conversion Status Updated',
  /** User clicked claim bonus button (Merkl rewards) */
  MUSD_CLAIM_BONUS_BUTTON_CLICKED: 'MUSD Claim Bonus Button Clicked',
  /** Quote requested */
  MUSD_CONVERSION_QUOTE_REQUESTED: 'MUSD Conversion Quote Requested',
  /** Quote received */
  MUSD_CONVERSION_QUOTE_RECEIVED: 'MUSD Conversion Quote Received',
  /** Quote error */
  MUSD_CONVERSION_QUOTE_ERROR: 'MUSD Conversion Quote Error',
  /** Conversion started (transaction submitted) */
  MUSD_CONVERSION_STARTED: 'MUSD Conversion Started',
  /** Conversion completed successfully */
  MUSD_CONVERSION_COMPLETED: 'MUSD Conversion Completed',
  /** Conversion failed */
  MUSD_CONVERSION_FAILED: 'MUSD Conversion Failed',
} as const;

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
    HOME_SCREEN: 'home',
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
  redirects_to:
    | 'conversion_education_screen'
    | 'custom_amount_screen'
    | 'buy_screen';
  /** Type of CTA clicked */
  cta_type:
    | 'musd_conversion_primary_cta'
    | 'musd_conversion_secondary_cta'
    | 'musd_conversion_tertiary_cta';
  /** Text displayed on the CTA */
  cta_text: string;
  /** What element was clicked */
  cta_click_target?: 'cta_button' | 'cta_text_link';
  /** Network chain ID (hex) */
  network_chain_id: string | null;
  /** Network name */
  network_name: string;
  /** Asset symbol if applicable */
  asset_symbol?: string;
};

/**
 * Properties for MUSD_FULLSCREEN_ANNOUNCEMENT_BUTTON_CLICKED event
 */
export type MusdEducationButtonClickedEventProperties = {
  /** Always 'conversion_education_screen' */
  location: 'conversion_education_screen';
  /** Which button was clicked */
  button_type: 'primary' | 'secondary';
  /** Text displayed on the button */
  button_text: string;
  /** Where the user will be redirected */
  redirects_to: 'custom_amount_screen' | 'buy_screen' | 'home_screen';
};

/**
 * Properties for MUSD_CONVERSION_STATUS_UPDATED event
 */
export type MusdConversionStatusUpdatedEventProperties = {
  /** Transaction ID */
  transaction_id: string;
  /** Current transaction status */
  transaction_status: string;
  /** Transaction type - always 'musdConversion' */
  transaction_type: 'musdConversion';
  /** Token being converted */
  asset_symbol: string;
  /** Network chain ID (hex) */
  network_chain_id: string;
  /** Network name */
  network_name: string;
  /** Amount in decimal format */
  amount_decimal: string;
  /** Amount in hex format */
  amount_hex: string;
};

/**
 * Properties for MUSD_CLAIM_BONUS_BUTTON_CLICKED event
 */
export type MusdClaimBonusButtonClickedEventProperties = {
  /** Where the button was displayed */
  location: 'claim_bonus_bottom_sheet';
  /** Claim amount in mUSD */
  claim_amount: string;
  /** Network chain ID (hex) */
  network_chain_id: string;
  /** Network name */
  network_name: string;
};

/**
 * Properties for quote-related events
 */
export type MusdQuoteEventProperties = {
  /** Source token symbol */
  source_token_symbol: string;
  /** Source token address */
  source_token_address: string;
  /** Amount being converted */
  amount: string;
  /** Network chain ID (hex) */
  chain_id: string;
  /** Network name */
  network_name: string;
  /** Error message if applicable */
  error_message?: string;
  /** Quote response time in ms (for received event) */
  response_time_ms?: number;
};

/**
 * Properties for conversion completion/failure events
 */
export type MusdConversionResultEventProperties = {
  /** Transaction ID */
  transaction_id: string;
  /** Transaction hash */
  transaction_hash?: string;
  /** Source token symbol */
  source_token_symbol: string;
  /** Amount converted */
  amount_converted: string;
  /** mUSD amount received */
  musd_amount_received?: string;
  /** Network chain ID (hex) */
  chain_id: string;
  /** Network name */
  network_name: string;
  /** Error message if applicable */
  error_message?: string;
  /** Time from start to completion in ms */
  duration_ms?: number;
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
// Event Category
// ============================================================================

/**
 * Analytics event category for mUSD conversion
 * Should be added to MetaMetricsEventCategory enum
 */
export const MUSD_EVENT_CATEGORY = 'MUSD Conversion';

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
): { network_chain_id: string | null; network_name: string } => ({
  network_chain_id: chainId,
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
  redirects_to: params.redirectsTo,
  cta_type: params.ctaType,
  cta_text: params.ctaText,
  cta_click_target: params.clickTarget,
  network_chain_id: params.chainId,
  network_name: params.chainName,
  asset_symbol: params.assetSymbol,
});
