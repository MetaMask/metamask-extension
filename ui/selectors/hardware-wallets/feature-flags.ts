/**
 * Hardware Wallet Feature Flag Selectors.
 *
 * Memoized selectors for hardware-wallet-related remote feature flags.
 * Uses the shared `getRemoteFeatureFlags` selector which merges manifest
 * overrides with state flags (manifest wins on conflict).
 *
 * Supports version-gated flags in both direct and progressive-rollout shapes:
 * Direct: `{ enabled: true, minimumVersion: '12.0.0' }`
 * Wrapped: `{ name: 'rollout', value: { enabled, minimumVersion } }`
 */

import { createSelector } from 'reselect';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { isDmkFeatureEnabled } from '../../../shared/lib/hardware-wallets/feature-flags';

/**
 * Select whether the Ledger DMK (Device Management Key) rollout is enabled.
 *
 * Resolves the `ledgerDmk` remote flag with `isDmkFeatureEnabled`, which:
 * Returns `false` for the disabled variant
 * `{ enabled: false, featureVersion: null, minimumVersion: null }`.
 * Returns `true` only when `enabled: true` AND the current extension
 * version is `>= minimumVersion`.
 * Returns the default value (`false`) if the flag is missing or invalid.
 */
export const getIsDmkEnabled = createSelector(
  getRemoteFeatureFlags,
  (remoteFeatureFlags): boolean => isDmkFeatureEnabled(remoteFeatureFlags),
);
