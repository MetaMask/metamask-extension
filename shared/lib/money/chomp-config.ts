import { isObject } from '@metamask/utils';

/**
 * The LaunchDarkly flag carrying the CHOMP API configuration. The same flag
 * mobile reads, so both clients talk to the same CHOMP environment.
 */
export const MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME = 'moneyAccountChompConfig';

export type MoneyAccountChompConfig = {
  baseUrl: string;
};

const isValidUrl = (value: string): boolean => {
  try {
    return Boolean(new URL(value));
  } catch {
    return false;
  }
};

/**
 * Parses the raw `moneyAccountChompConfig` remote feature flag.
 *
 * @param raw - The raw remote feature flag value.
 * @returns The parsed config, or `undefined` if the base URL is missing or not
 * a valid URL, so callers fall back to their default rather than fetch from a
 * malformed origin.
 */
export const parseMoneyAccountChompConfig = (
  raw: unknown,
): MoneyAccountChompConfig | undefined => {
  if (!isObject(raw)) {
    return undefined;
  }

  const { baseUrl } = raw;
  if (typeof baseUrl !== 'string' || !isValidUrl(baseUrl)) {
    return undefined;
  }

  return { baseUrl };
};

/**
 * Reads and parses the CHOMP API config out of the remote feature flags.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns The parsed config, or `undefined` when the flag is unserved or
 * malformed.
 */
export function getMoneyAccountChompConfig(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): MoneyAccountChompConfig | undefined {
  return parseMoneyAccountChompConfig(
    remoteFeatureFlags?.[MONEY_ACCOUNT_CHOMP_CONFIG_FLAG_NAME],
  );
}
