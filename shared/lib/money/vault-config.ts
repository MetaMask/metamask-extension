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
 * This lives in `shared/lib/money/` rather than `ui/selectors/` because both the
 * UI and the background need it — the availability gate reads the money chain
 * from it — and `import-x/no-restricted-paths` bars imports between those two
 * layers in either direction. It is deliberately **not** upstreamed into
 * `@metamask/money-account-utils`: what each client accepts from the flag may
 * legitimately diverge between mobile and the extension.
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
 * Reads and parses the Money Account vault config out of the remote feature
 * flags.
 *
 * The flag name is read in exactly one place so the UI selector and the
 * background availability gate cannot end up looking at different flags.
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
