import { createSelector } from 'reselect';
import { isObject } from '@metamask/utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';
import {
  isMoneyAccountEnabled,
  isMoneyEarningSectionEnabled,
} from '../../../shared/lib/money/feature-flags';
import { getMoneyAccountVaultConfig } from '../../../shared/lib/money/vault-config';

/**
 * The APY controls from the `earnMoneyVaultApyControl` remote feature flag.
 */
export type MoneyVaultApyRemoteConfig = {
  /** Used when the live APY is unavailable (third-party outage). */
  vaultApyFallback: number | undefined;
  /** When configured, always shown instead of the live APY. */
  vaultApyOverride: number | undefined;
};

export const FALLBACK_MONEY_DEPOSIT_MIN_BALANCE = 0.01;

/**
 * Parses a raw flag value into a non-negative finite number.
 *
 * @param raw - The raw value, a number or a numeric string.
 * @returns The number, or `undefined` if it is not a non-negative finite
 * number.
 */
const parseNonNegativeFinite = (raw: unknown): number | undefined => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? raw : undefined;
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }
  return undefined;
};

/**
 * Selects whether the `moneyEnableMoneyAccount` flag is on.
 *
 * Deliberately the same parser the background's availability gate calls
 * (`isMoneyAccountEnabled`) over the same `RemoteFeatureFlagController` state,
 * read here through its Redux mirror. One flag, one version-gate
 * interpretation, so the UI cannot disagree with the gate about whether the
 * feature is on.
 *
 * On its own this is **not** enough to show anything: an enabled flag with no
 * upgraded money account still shows nothing. Use `useMoneyAccountInfo`.
 *
 * @param state - The MetaMask state object.
 * @returns Whether the Money Account feature flag is enabled.
 */
export const selectMoneyAccountFeatureEnabled = createSelector(
  getRemoteFeatureFlags,
  isMoneyAccountEnabled,
);

/**
 * Selects whether the realized Earnings section on Money Home is enabled.
 *
 * @param state - The MetaMask state object.
 * @returns Whether the Earnings section is enabled.
 */
export const selectMoneyEarningSectionEnabled = createSelector(
  getRemoteFeatureFlags,
  isMoneyEarningSectionEnabled,
);

/**
 * Selects the Money Account vault config, or `undefined` when the flag is
 * unserved or malformed.
 *
 * @param state - The MetaMask state object.
 * @returns The parsed vault config, or `undefined`.
 */
export const selectMoneyAccountVaultConfig = createSelector(
  getRemoteFeatureFlags,
  getMoneyAccountVaultConfig,
);

/**
 * Selects the Money vault APY fallback and override.
 *
 * @param state - The MetaMask state object.
 * @returns The APY fallback and override, each `undefined` when unconfigured.
 */
export const selectMoneyVaultApyRemoteConfig = createSelector(
  getRemoteFeatureFlags,
  (flags): MoneyVaultApyRemoteConfig => {
    const raw = flags?.earnMoneyVaultApyControl;
    const control = isObject(raw) ? raw : undefined;

    return {
      vaultApyFallback: parseNonNegativeFinite(control?.vaultApyFallback),
      vaultApyOverride: parseNonNegativeFinite(control?.vaultApyOverride),
    };
  },
);

/**
 * Selects the minimum wallet-asset balance required for Money deposits.
 *
 * @param state - The MetaMask state object.
 * @returns The minimum fiat balance, defaulting to one cent.
 */
export const selectMoneyDepositMinBalance = createSelector(
  getRemoteFeatureFlags,
  (flags): number =>
    parseNonNegativeFinite(flags?.earnMoneyDepositMinAssetBalance) ??
    FALLBACK_MONEY_DEPOSIT_MIN_BALANCE,
);

/**
 * Selects whether the optimized Money Account deposit quote pipeline is
 * enabled. Supports a plain boolean as well as the version-gated and
 * progressive-rollout flag shapes.
 *
 * @param state - The MetaMask state object.
 * @returns Whether the deposit quote pipeline is enabled.
 */
export const selectMoneyAccountDepositQuotePipelineEnabled = createSelector(
  getRemoteFeatureFlags,
  (flags) =>
    getBooleanFeatureFlag(flags?.moneyAccountDepositQuotePipeline, false),
);
