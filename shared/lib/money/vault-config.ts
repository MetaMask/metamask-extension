import {
  isObject,
  isStrictHexString,
  isValidHexAddress,
  type Hex,
} from '@metamask/utils';

/**
 * The LaunchDarkly flag carrying the Money Account vault contracts. The same
 * flag `@metamask/money-account-balance-service` reads, so the parsed chain id
 * here is the chain the balance service talks to.
 */
export const MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME = 'moneyAccountVaultConfig';

export type MoneyAccountVaultConfig = {
  chainId: Hex;
  boringVault: Hex;
  tellerAddress: Hex;
  accountantAddress: Hex;
  lensAddress: Hex;
  underlyingToken: Hex;
};

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
 * This lives in `shared/lib/money/` rather than `ui/selectors/` because both the
 * UI and the background need it .
 *
 * @param raw - The raw remote feature flag value.
 * @returns The parsed vault config, or `undefined` if any field is missing or
 * malformed.
 */
export const parseMoneyAccountVaultConfig = (
  raw: unknown,
): MoneyAccountVaultConfig | undefined => {
  if (!isObject(raw)) {
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
  const underlyingToken = parseAddress(raw.underlyingToken);

  if (
    !boringVault ||
    !tellerAddress ||
    !accountantAddress ||
    !lensAddress ||
    !underlyingToken
  ) {
    return undefined;
  }

  return {
    chainId,
    boringVault,
    tellerAddress,
    accountantAddress,
    lensAddress,
    underlyingToken,
  };
};

/**
 * Reads and parses the Money Account vault config out of the remote feature
 * flags.
 *
 * @param remoteFeatureFlags - The remote feature flags.
 * @returns The parsed vault config, or `undefined` when the flag is unserved or
 * malformed.
 */
export function getMoneyAccountVaultConfig(
  remoteFeatureFlags: Record<string, unknown> | undefined,
): MoneyAccountVaultConfig | undefined {
  return parseMoneyAccountVaultConfig(
    remoteFeatureFlags?.[MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME],
  );
}
