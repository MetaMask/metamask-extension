import { createSelector } from 'reselect';
import {
  isStrictHexString,
  isValidHexAddress,
  type Hex,
} from '@metamask/utils';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { getBooleanFeatureFlag } from '../../../shared/lib/remote-feature-flag-utils';

/**
 * The Money Account vault contracts, parsed from the
 * `moneyAccountVaultConfig` remote feature flag.
 *
 * Every field is `Hex` because these values are handed to
 * `@metamask/money-account-utils`, which types them that way: `boringVault`
 * becomes the `spender` of an ERC-20 `approve`, and the other three are call
 * targets.
 */
export type MoneyAccountVaultConfig = {
  chainId: Hex;
  boringVault: Hex;
  tellerAddress: Hex;
  accountantAddress: Hex;
  lensAddress: Hex;
};

/**
 * The APY controls from the `earnMoneyVaultApyControl` remote feature flag.
 */
export type MoneyVaultApyRemoteConfig = {
  /** Used when the live APY is unavailable (third-party outage). */
  vaultApyFallback: number | undefined;
  /** When configured, always shown instead of the live APY. */
  vaultApyOverride: number | undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Parses one raw vault-config field into an address.
 *
 * `isValidHexAddress` accepts an all-lowercase address or a valid ERC-55
 * checksum, which is what ethers accepts when it encodes the calldata. The
 * address is deliberately not normalised, so a checksummed address passes
 * through unchanged.
 *
 * @param value - The raw field value.
 * @returns The address, or `undefined` if it is missing or malformed.
 */
const parseAddress = (value: unknown): Hex | undefined =>
  isStrictHexString(value) && isValidHexAddress(value) ? value : undefined;

/**
 * Parses the raw `moneyAccountVaultConfig` remote feature flag into a config
 * whose chain id and addresses are known-good `Hex`.
 *
 * Parsing happens once, here, rather than being asserted with `as Hex` at each
 * call site: a malformed flag yields `undefined`, which callers treat as "the
 * Money Account is unavailable", so the entry points stay hidden instead of
 * failing partway through a confirmation.
 *
 * @param raw - The raw remote feature flag value.
 * @returns The parsed vault config, or `undefined` if any field is missing or
 * malformed.
 */
export const parseMoneyAccountVaultConfig = (
  raw: unknown,
): MoneyAccountVaultConfig | undefined => {
  if (!isRecord(raw)) {
    return undefined;
  }

  const { chainId } = raw;
  if (!isStrictHexString(chainId)) {
    return undefined;
  }

  const boringVault = parseAddress(raw.boringVault);
  const tellerAddress = parseAddress(raw.tellerAddress);
  const accountantAddress = parseAddress(raw.accountantAddress);
  const lensAddress = parseAddress(raw.lensAddress);

  if (!boringVault || !tellerAddress || !accountantAddress || !lensAddress) {
    return undefined;
  }

  return {
    chainId,
    boringVault,
    tellerAddress,
    accountantAddress,
    lensAddress,
  };
};

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
 * Selects the Money Account vault config, or `undefined` when the flag is
 * unserved or malformed.
 *
 * @param state - The MetaMask state object.
 * @returns The parsed vault config, or `undefined`.
 */
export const selectMoneyAccountVaultConfig = createSelector(
  getRemoteFeatureFlags,
  (flags) => parseMoneyAccountVaultConfig(flags?.moneyAccountVaultConfig),
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
    const control = isRecord(raw) ? raw : undefined;

    return {
      vaultApyFallback: parseNonNegativeFinite(control?.vaultApyFallback),
      vaultApyOverride: parseNonNegativeFinite(control?.vaultApyOverride),
    };
  },
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
