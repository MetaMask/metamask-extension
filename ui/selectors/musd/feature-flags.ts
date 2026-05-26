/**
 * MUSD Feature Flag Selectors
 *
 * Selectors for accessing mUSD-related feature flags from remote configuration.
 * Uses the shared getRemoteFeatureFlags selector which properly merges
 * manifest overrides with state flags.
 *
 * Supports version-gated flags in both direct and progressive rollout formats:
 * - Direct: { enabled: true, minimumVersion: '12.0.0' }
 * - Wrapped: { name: 'rollout', value: { enabled: true, minimumVersion: '12.0.0' } }
 */

import { createSelector } from 'reselect';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import { MUSD_BUYABLE_CHAIN_IDS } from '../../components/app/musd/constants';
import type {
  MusdFeatureFlags,
  WildcardTokenList,
  GeoBlockingConfig,
} from '../../pages/musd/types';
import { getRemoteFeatureFlags } from '../remote-feature-flags';
import {
  DEFAULT_MUSD_BOOLEAN_FLAG,
  DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
  DEFAULT_MUSD_GEO_BLOCKING_CONFIG,
  DEFAULT_MUSD_MIN_ASSET_BALANCE,
  DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
} from './constants';

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
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMusdConversionFlowEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(
      flags.earnMusdConversionFlowEnabled,
      DEFAULT_MUSD_BOOLEAN_FLAG,
    ),
);

/**
 * Select whether the mUSD CTA (Call-to-Action) is enabled
 * Controls visibility of "Get mUSD" / "Buy mUSD" banners
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMusdCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(flags.earnMusdCtaEnabled, DEFAULT_MUSD_BOOLEAN_FLAG),
);

/**
 * Select whether the token list item CTA is enabled
 * Controls the "Convert to mUSD" link on token rows
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMusdTokenListItemCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(
      flags.earnMusdConversionTokenListItemCtaEnabled,
      DEFAULT_MUSD_BOOLEAN_FLAG,
    ),
);

/**
 * Select whether the asset overview CTA is enabled
 * Controls the boost card on token detail pages
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMusdAssetOverviewCtaEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(
      flags.earnMusdConversionAssetOverviewCtaEnabled,
      DEFAULT_MUSD_BOOLEAN_FLAG,
    ),
);

/**
 * Select whether the rewards UI is enabled
 * Controls Merkl rewards display elements
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMusdRewardsUiEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(
      flags.earnMusdConversionRewardsUiEnabled,
      DEFAULT_MUSD_BOOLEAN_FLAG,
    ),
);

/**
 * Select whether Merkl campaign claiming is enabled
 * Supports version-gated and progressive rollout flag formats
 */
export const selectIsMerklClaimingEnabled = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): boolean =>
    getBooleanFeatureFlag(
      flags.earnMerklCampaignClaiming,
      DEFAULT_MUSD_BOOLEAN_FLAG,
    ),
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
  (flags): WildcardTokenList =>
    flags.earnMusdConversionCtaTokens ?? DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
);

/**
 * Select the convertible tokens allowlist
 * Tokens that can be used as payment for mUSD conversion
 */
export const selectMusdConvertibleTokensAllowlist = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): WildcardTokenList =>
    flags.earnMusdConvertibleTokensAllowlist ??
    DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
);

/**
 * Select the convertible tokens blocklist
 * Tokens that cannot be used for mUSD conversion
 */
export const selectMusdConvertibleTokensBlocklist = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): WildcardTokenList =>
    flags.earnMusdConvertibleTokensBlocklist ??
    DEFAULT_MUSD_WILDCARD_TOKEN_LIST,
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
    flags.earnMusdConversionGeoBlockedCountries ??
    DEFAULT_MUSD_GEO_BLOCKING_CONFIG,
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
    DEFAULT_MUSD_MIN_ASSET_BALANCE,
);

// ============================================================================
// Composite Selectors
// ============================================================================

/** Valid mUSD feature flag keys from defaults */
const MUSD_FLAG_KEYS = Object.keys(
  DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
) as (keyof MusdFeatureFlags)[];

/**
 * Select all mUSD feature flags as a single object.
 * Only includes flags defined in MusdFeatureFlags type, not all remote flags.
 */
export const selectAllMusdFeatureFlags = createSelector(
  selectMusdRemoteFeatureFlags,
  (flags): MusdFeatureFlags => {
    // Filter to only include keys that are part of MusdFeatureFlags
    const musdFlags = Object.fromEntries(
      Object.entries(flags).filter(
        ([key, value]) =>
          MUSD_FLAG_KEYS.includes(key as keyof MusdFeatureFlags) &&
          value !== undefined,
      ),
    );
    return {
      ...DEFAULT_MUSD_REMOTE_FEATURE_FLAGS,
      ...musdFlags,
    };
  },
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
