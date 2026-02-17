/**
 * MUSD Feature Flag Selectors
 *
 * Selectors for accessing mUSD-related feature flags from remote configuration.
 * Uses the shared getRemoteFeatureFlags selector which properly merges
 * manifest overrides with state flags.
 */

import { createSelector } from 'reselect';
import {
  DEFAULT_MUSD_BLOCKED_COUNTRIES,
  FALLBACK_MIN_ASSET_BALANCE_REQUIRED,
  MUSD_BUYABLE_CHAIN_IDS,
} from '../../../shared/constants/musd';
import type {
  MusdFeatureFlags,
  WildcardTokenList,
  GeoBlockingConfig,
} from '../../pages/musd-conversion/types';
import { getRemoteFeatureFlags } from '../remote-feature-flags';

// ============================================================================
// Base Selector
// ============================================================================

/**
 * Casts the merged remote feature flags (which are typed as Record<string, Json>)
 * to the mUSD-specific flag shape for type-safe access in downstream selectors.
 */
const selectMusdRemoteFeatureFlags = createSelector(
  getRemoteFeatureFlags,
  (flags) => flags as unknown as Partial<MusdFeatureFlags>,
);

// ============================================================================
// Individual Feature Flag Selectors
// ============================================================================

/**
 * Select whether the mUSD conversion flow is enabled
 * This is the master toggle for the entire feature
 */
export const selectIsMusdConversionFlowEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMusdConversionFlowEnabled ?? false,
);

/**
 * Select whether the mUSD CTA (Call-to-Action) is enabled
 * Controls visibility of "Get mUSD" / "Buy mUSD" banners
 */
export const selectIsMusdCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMusdCtaEnabled ?? false,
);

/**
 * Select whether the token list item CTA is enabled
 * Controls the "Convert to mUSD" link on token rows
 */
export const selectIsMusdTokenListItemCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMusdConversionTokenListItemCtaEnabled ?? false,
);

/**
 * Select whether the asset overview CTA is enabled
 * Controls the boost card on token detail pages
 */
export const selectIsMusdAssetOverviewCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMusdConversionAssetOverviewCtaEnabled ?? false,
);

/**
 * Select whether the rewards UI is enabled
 * Controls Merkl rewards display elements
 */
export const selectIsMusdRewardsUiEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMusdConversionRewardsUiEnabled ?? false,
);

/**
 * Select whether Merkl campaign claiming is enabled
 */
export const selectIsMerklClaimingEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean => flags.earnMerklCampaignClaiming ?? false,
);

// ============================================================================
// Token List Selectors
// ============================================================================

/**
 * Select the CTA tokens wildcard list
 * Determines which tokens show the mUSD CTA
 */
export const selectMusdCtaTokens = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): WildcardTokenList => flags.earnMusdConversionCtaTokens ?? {},
);

/**
 * Select the convertible tokens allowlist
 * Tokens that can be used as payment for mUSD conversion
 */
export const selectMusdConvertibleTokensAllowlist = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): WildcardTokenList => flags.earnMusdConvertibleTokensAllowlist ?? {},
);

/**
 * Select the convertible tokens blocklist
 * Tokens that cannot be used for mUSD conversion
 */
export const selectMusdConvertibleTokensBlocklist = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): WildcardTokenList => flags.earnMusdConvertibleTokensBlocklist ?? {},
);

// ============================================================================
// Geo-blocking Selectors
// ============================================================================

/**
 * Select the geo-blocked countries configuration
 */
export const selectMusdGeoBlockedCountries = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): GeoBlockingConfig =>
    flags.earnMusdConversionGeoBlockedCountries ?? {
      blockedRegions: DEFAULT_MUSD_BLOCKED_COUNTRIES,
    },
);

/**
 * Select just the blocked regions array for convenience
 */
export const selectMusdBlockedRegions = createSelector(
  selectMusdGeoBlockedCountries,
  (config): string[] => config.blockedRegions,
);

// ============================================================================
// Threshold Selectors
// ============================================================================

/**
 * Select the minimum asset balance required for conversion eligibility
 * Returns the configured value or the fallback default
 */
export const selectMusdMinAssetBalanceRequired = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): number =>
    flags.earnMusdConversionMinAssetBalanceRequired ??
    FALLBACK_MIN_ASSET_BALANCE_REQUIRED,
);

// ============================================================================
// Composite Selectors
// ============================================================================

/**
 * Select all mUSD feature flags as a single object
 */
export const selectAllMusdFeatureFlags = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): MusdFeatureFlags => ({
    earnMusdConversionFlowEnabled: flags.earnMusdConversionFlowEnabled ?? false,
    earnMusdCtaEnabled: flags.earnMusdCtaEnabled ?? false,
    earnMusdConversionTokenListItemCtaEnabled:
      flags.earnMusdConversionTokenListItemCtaEnabled ?? false,
    earnMusdConversionAssetOverviewCtaEnabled:
      flags.earnMusdConversionAssetOverviewCtaEnabled ?? false,
    earnMusdConversionRewardsUiEnabled:
      flags.earnMusdConversionRewardsUiEnabled ?? false,
    earnMusdConversionCtaTokens: flags.earnMusdConversionCtaTokens ?? {},
    earnMusdConvertibleTokensAllowlist:
      flags.earnMusdConvertibleTokensAllowlist ?? {},
    earnMusdConvertibleTokensBlocklist:
      flags.earnMusdConvertibleTokensBlocklist ?? {},
    earnMusdConversionGeoBlockedCountries:
      flags.earnMusdConversionGeoBlockedCountries ?? {
        blockedRegions: DEFAULT_MUSD_BLOCKED_COUNTRIES,
      },
    earnMusdConversionMinAssetBalanceRequired:
      flags.earnMusdConversionMinAssetBalanceRequired ??
      FALLBACK_MIN_ASSET_BALANCE_REQUIRED,
    earnMerklCampaignClaiming: flags.earnMerklCampaignClaiming ?? false,
  }),
);

/**
 * Select whether any mUSD CTA should be shown
 * Combines master toggle with individual CTA toggles
 */
export const selectShouldShowAnyMusdCta = createSelector(
  selectIsMusdConversionFlowEnabled,
  selectIsMusdCtaEnabled,
  selectIsMusdTokenListItemCtaEnabled,
  selectIsMusdAssetOverviewCtaEnabled,
  (flowEnabled, ctaEnabled, tokenListEnabled, assetOverviewEnabled): boolean =>
    flowEnabled && (ctaEnabled || tokenListEnabled || assetOverviewEnabled),
);

/**
 * Select the buyable chain IDs for mUSD
 * This combines the constant with any remote configuration
 */
export const selectMusdBuyableChainIds = createSelector(
  selectMusdRemoteFeatureFlags,
  // Could add remote config for additional chains here
  (): string[] => MUSD_BUYABLE_CHAIN_IDS as string[],
);
