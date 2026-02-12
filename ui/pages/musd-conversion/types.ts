/**
 * MUSD Conversion Feature Types
 *
 * TypeScript type definitions for the mUSD stablecoin conversion feature.
 * These types define the data structures used throughout the conversion flow.
 */

import type { Hex } from '@metamask/utils';

// Re-export shared types for backward compatibility
export type {
  ConvertibleToken,
  WildcardTokenList,
} from '../../../shared/lib/musd/types';

/**
 * mUSD token information
 */
export type MusdTokenInfo = {
  /** Token contract address */
  address: Hex;
  /** Token symbol - always 'MUSD' */
  symbol: 'MUSD';
  /** Token name - always 'MUSD' */
  name: 'MUSD';
  /** Token decimals - always 6 */
  decimals: 6;
  /** Chain ID where the token exists */
  chainId: Hex;
  /** Token balance in smallest unit (wei) */
  balance?: string;
  /** Token balance in fiat (USD) */
  fiatBalance?: string;
};

// ============================================================================
// Conversion Flow State Types
// ============================================================================

/**
 * States for the mUSD conversion flow
 */
export enum MusdConversionFlowState {
  /** Initial state, user on wallet home */
  IDLE = 'idle',
  /** Checking if education screen is needed */
  CHECKING_EDUCATION = 'checking_education',
  /** Showing education screen */
  EDUCATION = 'education',
  /** Creating placeholder transaction */
  CREATING_TRANSACTION = 'creating_transaction',
  /** User on confirmation screen entering amount */
  CONFIRMATION_SCREEN = 'confirmation_screen',
  /** Fetching Relay quote */
  LOADING_QUOTE = 'loading_quote',
  /** Quote ready for user review */
  QUOTE_READY = 'quote_ready',
  /** Transaction being confirmed/signed */
  CONFIRMING_TRANSACTION = 'confirming_transaction',
  /** Transaction submitted, waiting for confirmation */
  PENDING_TX = 'pending_tx',
  /** Transaction confirmed successfully */
  SUCCESS = 'success',
  /** Transaction or quote failed */
  ERROR = 'error',
}

/**
 * mUSD conversion Redux state
 */
export type MusdConversionState = {
  /** Current flow state */
  flowState: MusdConversionFlowState;
  /** Selected payment token for conversion */
  selectedPaymentToken: ConvertibleToken | null;
  /** Amount to convert in fiat (USD) */
  inputAmountFiat: string;
  /** Amount to convert in token's smallest unit */
  inputAmountWei: string;
  /** Expected output amount in mUSD (smallest unit) */
  outputAmountWei: string;
  /** Current quote from Relay */
  quote: MusdConversionQuote | null;
  /** Quote loading state */
  isQuoteLoading: boolean;
  /** Quote error */
  quoteError: string | null;
  /** Transaction ID (if transaction created) */
  transactionId: string | null;
  /** Transaction hash (after submission) */
  transactionHash: string | null;
  /** Transaction error */
  transactionError: string | null;
  /** Has user seen education screen */
  educationSeen: boolean;
  /** Dismissed CTA keys (chainId-tokenAddress format) */
  dismissedCtaKeys: string[];
};

// ============================================================================
// Quote Types
// ============================================================================

/**
 * Fee information from Relay quote
 */
export type RelayFees = {
  /** Network/gas fee */
  gas: { amountUsd: string };
  /** Relayer fee */
  relayer: { amountUsd: string };
  /** Relayer gas component */
  relayerGas: { amountUsd: string };
  /** Relayer service component */
  relayerService: { amountUsd: string };
  /** App fee (currently 0) */
  app: { amountUsd: string };
  /** Subsidized amount */
  subsidized: { amountUsd: string };
};

/**
 * Currency details in Relay quote
 */
export type RelayCurrencyDetails = {
  currency: {
    chainId: number;
    address: string;
    symbol: string;
    decimals: number;
  };
  amount: string;
  amountFormatted: string;
  amountUsd: string;
};

/**
 * Quote details from Relay
 */
export type RelayQuoteDetails = {
  operation: 'swap' | 'bridge';
  sender: string;
  recipient: string;
  currencyIn: RelayCurrencyDetails;
  currencyOut: RelayCurrencyDetails;
  totalImpact: { usd: string; percent: string };
  timeEstimate: number;
};

/**
 * Transaction step from Relay quote
 */
export type RelayQuoteStep = {
  id: string;
  action: string;
  description: string;
  kind: 'transaction' | 'signature';
  items: {
    status: 'incomplete' | 'complete';
    data: {
      from: string;
      to: string;
      data: string;
      value: string;
      chainId: number;
      gas?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    };
    check?: {
      endpoint: string;
      method: string;
    };
  }[];
  requestId: string;
};

/**
 * Complete quote response from Relay API
 */
export type MusdConversionQuote = {
  /** Transaction steps */
  steps: RelayQuoteStep[];
  /** Quote details */
  details: RelayQuoteDetails;
  /** Fee breakdown */
  fees: RelayFees;
  /** Quote expiry timestamp */
  expiresAt?: number;
};

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for Relay quote API
 */
export type RelayQuoteRequest = {
  /** User's wallet address */
  user: string;
  /** Source chain ID (decimal) */
  originChainId: number;
  /** Destination chain ID (decimal) - same as origin for mUSD */
  destinationChainId: number;
  /** Source token address */
  originCurrency: string;
  /** Destination token address (mUSD) */
  destinationCurrency: string;
  /** Amount in smallest unit */
  amount: string;
  /** Trade type - always EXACT_INPUT for mUSD conversion */
  tradeType: 'EXACT_INPUT';
};

/**
 * Response from Relay status API
 */
export type RelayStatusResponse = {
  status: 'pending' | 'success' | 'failed';
  txHashes?: string[];
};

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Parameters for creating a mUSD conversion transaction
 */
export type CreateMusdConversionTransactionParams = {
  /** Chain ID for conversion (hex) */
  chainId: Hex;
  /** User's wallet address */
  fromAddress: Hex;
  /** Recipient address (usually same as fromAddress) */
  recipientAddress: Hex;
  /** Amount in hex (wei) */
  amountHex: string;
  /** Optional network client ID for optimization */
  networkClientId?: string;
};

/**
 * Transaction status for tracking
 */
export enum MusdTransactionStatus {
  /** Transaction created, waiting for user approval */
  UNAPPROVED = 'unapproved',
  /** User approved, submitted to network */
  APPROVED = 'approved',
  /** Transaction mined and successful */
  CONFIRMED = 'confirmed',
  /** Transaction reverted */
  FAILED = 'failed',
  /** User rejected */
  REJECTED = 'rejected',
  /** Transaction dropped from mempool */
  DROPPED = 'dropped',
  /** Transaction cancelled by user */
  CANCELLED = 'cancelled',
}

// ============================================================================
// CTA Types
// ============================================================================

/**
 * CTA types for analytics
 */
export enum MusdCtaType {
  /** Primary CTA - "Get/Buy mUSD" banner on home screen */
  PRIMARY = 'musd_conversion_primary_cta',
  /** Secondary CTA - "Convert to mUSD" on token list item */
  SECONDARY = 'musd_conversion_secondary_cta',
  /** Tertiary CTA - Asset overview CTA */
  TERTIARY = 'musd_conversion_tertiary_cta',
}

/**
 * CTA click locations for analytics
 */
export enum MusdCtaLocation {
  HOME_SCREEN = 'home',
  TOKEN_LIST_ITEM = 'token_list_item',
  ASSET_OVERVIEW = 'asset_overview',
}

/**
 * CTA visibility result
 */
export type MusdCtaVisibility = {
  /** Whether to show primary CTA */
  showPrimaryCta: boolean;
  /** Whether to show "Get mUSD" or "Buy mUSD" */
  ctaVariant: 'get' | 'buy' | null;
  /** Whether to show secondary CTAs on token list */
  showSecondaryCta: boolean;
  /** Whether to show tertiary CTA on asset overview */
  showTertiaryCta: boolean;
  /** Reason if CTAs are hidden */
  hiddenReason?: 'geo_blocked' | 'feature_disabled' | 'no_convertible_tokens';
};

// ============================================================================
// Feature Flag Types
// ============================================================================

/**
 * mUSD feature flags from remote configuration
 */
export type MusdFeatureFlags = {
  /** Master toggle for mUSD conversion */
  earnMusdConversionFlowEnabled: boolean;
  /** Enable Buy/Get mUSD CTA */
  earnMusdCtaEnabled: boolean;
  /** Enable secondary CTA on token list */
  earnMusdConversionTokenListItemCtaEnabled: boolean;
  /** Enable tertiary CTA on asset overview */
  earnMusdConversionAssetOverviewCtaEnabled: boolean;
  /** Enable rewards UI elements */
  earnMusdConversionRewardsUiEnabled: boolean;
  /** Wildcard list for CTA-enabled tokens */
  earnMusdConversionCtaTokens: WildcardTokenList;
  /** Wildcard list for allowed payment tokens */
  earnMusdConvertibleTokensAllowlist: WildcardTokenList;
  /** Wildcard list for blocked payment tokens */
  earnMusdConvertibleTokensBlocklist: WildcardTokenList;
  /** Geo-blocked countries configuration */
  earnMusdConversionGeoBlockedCountries: GeoBlockingConfig;
  /** Minimum token balance in USD for conversion eligibility */
  earnMusdConversionMinAssetBalanceRequired: number;
  /** Enable Merkl rewards claiming */
  earnMerklCampaignClaiming: boolean;
};

// WildcardTokenList is re-exported from shared/lib/musd/types.ts above

/**
 * Geo-blocking configuration
 */
export type GeoBlockingConfig = {
  /** List of blocked country/region codes (e.g., "GB", "GB-ENG", "US-CA") */
  blockedRegions: string[];
};

// ============================================================================
// User Preference Types
// ============================================================================

/**
 * mUSD-related user preferences stored in state
 */
export type MusdUserPreferences = {
  /** Has user seen education screen */
  musdConversionEducationSeen: boolean;
  /** Dismissed CTAs by key (chainId-tokenAddress format) */
  musdConversionAssetDetailCtasSeen: Record<string, boolean>;
};

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Route parameters for mUSD education screen
 */
export type MusdEducationRouteParams = {
  /** Whether opened via deeplink */
  isDeeplink?: boolean;
  /** Preferred payment token for conversion */
  preferredPaymentToken?: {
    address: Hex;
    chainId: Hex;
  };
};

/**
 * Route parameters for mUSD confirmation screen
 */
export type MusdConfirmationRouteParams = {
  /** Transaction ID */
  transactionId: string;
  /** Selected payment token */
  paymentToken?: {
    address: Hex;
    chainId: Hex;
    symbol: string;
  };
};

// ============================================================================
// Toast Types
// ============================================================================

/**
 * Toast types for mUSD conversion
 */
export enum MusdToastType {
  /** Conversion in progress */
  IN_PROGRESS = 'in_progress',
  /** Conversion successful */
  SUCCESS = 'success',
  /** Conversion failed */
  FAILED = 'failed',
}

/**
 * Toast data for mUSD conversion
 */
export type MusdToastData = {
  type: MusdToastType;
  /** Token symbol being converted (e.g., 'USDC') */
  tokenSymbol?: string;
  /** Estimated time in seconds */
  timeEstimate?: number;
  /** Transaction hash for tracking */
  transactionHash?: string;
};
