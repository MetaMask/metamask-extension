import defaultWalletBalanceProfile from './default-wallet-balance-profile.json';

type Profile = typeof defaultWalletBalanceProfile;

export type { Profile as DefaultWalletBalanceProfile };

/**
 * Scalar inputs for default E2E balances (`default-wallet-balance-profile.json`).
 * `mock-e2e.js` reads the same file so Accounts API v5 defaults match assertion helpers.
 */
export const defaultE2EWalletBalanceProfile: Profile =
  defaultWalletBalanceProfile;

/**
 * Default native ETH (human-readable string) per EVM chain for Accounts API v5 mocks.
 * Same numeric basis as {@link defaultE2EWalletBalanceProfile.nativeEthHumanPerChain}.
 */
export function getDefaultAccountsApiV5NativeEthHumanString(): string {
  return String(defaultE2EWalletBalanceProfile.nativeEthHumanPerChain);
}

/**
 * Total native ETH (human) across the default multichain homepage aggregation
 * (per-chain balance × chain count).
 */
export function getDefaultTotalNativeEthHumanForAggregatedFiat(): number {
  const { nativeEthHumanPerChain, evmChainCountForAggregatedHomepageFiat } =
    defaultE2EWalletBalanceProfile;
  return nativeEthHumanPerChain * evmChainCountForAggregatedHomepageFiat;
}

/**
 * Total USD for the default multichain aggregated homepage balance:
 * `(nativeEthHumanPerChain × evmChainCount) × ethConversionRateUsd`.
 */
export function getDefaultMultichainAggregatedFiatUsd(): number {
  return (
    getDefaultTotalNativeEthHumanForAggregatedFiat() *
    defaultE2EWalletBalanceProfile.ethConversionRateUsd
  );
}

/**
 * Formatted homepage aggregated fiat for the default multichain profile.
 */
export function getDefaultMultichainAggregatedFiatDisplay(): string {
  const totalUsd = getDefaultMultichainAggregatedFiatUsd();
  return `$${totalUsd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Historical `login()` / homepage strings to map onto {@link getDefaultMultichainAggregatedFiatDisplay}. */
const DEPRECATED_AGGREGATED_FIAT_ASSERTIONS: readonly string[] = [
  '$225,730.11',
  '225,730.11',
];

/**
 * Resolves legacy hardcoded fiat expectations to the canonical default from the profile.
 * Other strings (e.g. `'25'` ETH, `'$85,025'`) pass through unchanged.
 * @param expectedBalance
 */
export function resolveDefaultMultichainAggregatedFiatAssertion(
  expectedBalance: string,
): string {
  if (DEPRECATED_AGGREGATED_FIAT_ASSERTIONS.includes(expectedBalance)) {
    return getDefaultMultichainAggregatedFiatDisplay();
  }
  return expectedBalance;
}
