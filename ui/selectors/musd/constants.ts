/**
 * MUSD Selector Default Constants
 *
 * Central defaults for all mUSD remote feature-flag selectors.
 * When a remote flag is absent these values are used as fallbacks.
 *
 * Literal values that already live in ui/components/app/musd/constants.ts
 * (e.g. DEFAULT_MUSD_BLOCKED_COUNTRIES, FALLBACK_MIN_ASSET_BALANCE_REQUIRED)
 * are imported rather than duplicated.
 */

import {
  DEFAULT_MUSD_BLOCKED_COUNTRIES,
  FALLBACK_MIN_ASSET_BALANCE_REQUIRED,
} from '../../components/app/musd/constants';
import type {
  MusdFeatureFlags,
  WildcardTokenList,
  GeoBlockingConfig,
} from '../../pages/musd/types';

/** Default for any boolean feature-flag that has not been set remotely. */
export const DEFAULT_MUSD_BOOLEAN_FLAG = false;

/** Default for any wildcard token list that has not been set remotely. */
export const DEFAULT_MUSD_WILDCARD_TOKEN_LIST: WildcardTokenList = {};

/** Default geo-blocking configuration when the remote flag is absent. */
export const DEFAULT_MUSD_GEO_BLOCKING_CONFIG: GeoBlockingConfig = {
  blockedRegions: DEFAULT_MUSD_BLOCKED_COUNTRIES,
};

/** Default minimum asset balance (USD) required for conversion eligibility. */
export const DEFAULT_MUSD_MIN_ASSET_BALANCE =
  FALLBACK_MIN_ASSET_BALANCE_REQUIRED;

/**
 * Complete set of defaults for all mUSD remote feature flags.
 * Used by selectAllMusdFeatureFlags and available for tests.
 */
export const DEFAULT_MUSD_REMOTE_FEATURE_FLAGS: MusdFeatureFlags = {
  earnMusdConversionFlowEnabled: DEFAULT_MUSD_BOOLEAN_FLAG,
  earnMusdCtaEnabled: DEFAULT_MUSD_BOOLEAN_FLAG,
  earnMusdConversionTokenListItemCtaEnabled: DEFAULT_MUSD_BOOLEAN_FLAG,
  earnMusdConversionAssetOverviewCtaEnabled: DEFAULT_MUSD_BOOLEAN_FLAG,
  earnMusdConversionRewardsUiEnabled: DEFAULT_MUSD_BOOLEAN_FLAG,
  earnMusdConversionCtaTokens: DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
  earnMusdConvertibleTokensAllowlist: DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
  earnMusdConvertibleTokensBlocklist: DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
  earnMusdConversionGeoBlockedCountries: DEFAULT_MUSD_GEO_BLOCKING_CONFIG,
  earnMusdConversionMinAssetBalanceRequired: DEFAULT_MUSD_MIN_ASSET_BALANCE,
  earnMerklCampaignClaiming: DEFAULT_MUSD_BOOLEAN_FLAG,
};
