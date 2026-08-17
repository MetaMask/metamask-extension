import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { Hex } from '@metamask/utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  ResultType,
} from '../trust-signals';

/**
 * Default slippage percentage to apply when the
 * `confirmations_enforced_simulations` remote feature flag does not
 * provide a `slippage` value.
 */
export const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

const BASIS_POINTS_PER_PERCENT = 100;

const ENFORCED_SIMULATIONS_FEATURE_FLAG = 'confirmations_enforced_simulations';

/**
 * Shape of the `confirmations_enforced_simulations` remote feature flag
 * value. Both fields are optional; consumers fall back to safe defaults
 * (disabled / {@link DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE}) when absent.
 */
export type EnforcedSimulationsFeatureFlag = {
  enabled?: boolean;
  slippage?: number;
};

/**
 * State required by the enforced simulations trust signal check.
 */
export type EnforcedSimulationsState = {
  addressSecurityAlertResponses: Record<string, CachedScanAddressResponse>;
  eip7702SupportedChains: Hex[];
};

type RemoteFlagsWithEnforcedSimulations = {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  confirmations_enforced_simulations?: EnforcedSimulationsFeatureFlag;
};

type FeatureFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

/**
 * Reads the `enabled` field from the `confirmations_enforced_simulations`
 * remote feature flag. Defaults to `false` when the flag or field is
 * absent.
 *
 * @param source - An object holding the remote feature flags.
 * @returns Whether enforced simulations are enabled.
 */
export function getIsEnforcedSimulationsEnabled(
  source: FeatureFlagSource,
): boolean {
  return getEnforcedSimulationsFlag(source)?.enabled ?? false;
}

/**
 * Whether enforced simulations are force-enabled via the
 * `FORCE_ENFORCED_SIMULATIONS` build flag. When `true`, callers should
 * skip the remote feature flag check and bypass trust signals.
 * Intended for local development and QA only.
 *
 * @returns Whether enforced simulations are force-enabled.
 */
export function isEnforcedSimulationsForceEnabled(): boolean {
  return process.env.FORCE_ENFORCED_SIMULATIONS?.toString() === 'true';
}

/**
 * Reads the `slippage` field from the `confirmations_enforced_simulations`
 * remote feature flag. Falls back to
 * {@link DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE} when the flag or field is
 * absent.
 *
 * @param source - An object holding the remote feature flags.
 * @returns The slippage percentage to apply.
 */
export function getEnforcedSimulationsSlippage(
  source: FeatureFlagSource,
): number {
  return (
    getEnforcedSimulationsFlag(source)?.slippage ??
    DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE
  );
}

/**
 * Converts an enforced simulations slippage percentage to basis points.
 *
 * @param slippage - The slippage percentage.
 * @returns The slippage in basis points.
 */
export function getEnforcedSimulationsSlippageBasisPoints(
  slippage: number,
): number {
  return Math.round(slippage * BASIS_POINTS_PER_PERCENT);
}

/**
 * Determines whether a transaction is eligible for enforced simulations.
 *
 * Also requires that at least one recipient address is loaded and not
 * trusted, based on cached trust signal scan results keyed by chain and
 * address. A recipient with no cache entry, or one still loading, does not
 * disqualify the transaction; only a cached non-Trusted verdict does.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Trust signal state and EIP-7702 supported chains.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function isEnforcedSimulationsEligible(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  const { chainId, simulationData } = transactionMeta;

  if (
    !state.eip7702SupportedChains?.some(
      (supported) => supported.toLowerCase() === chainId?.toLowerCase(),
    )
  ) {
    return false;
  }

  if (!hasBalanceChanges(simulationData)) {
    return false;
  }

  if (isEnforcedSimulationsForceEnabled()) {
    return true;
  }

  if (isTrusted(transactionMeta, state)) {
    return false;
  }

  return true;
}

function getEnforcedSimulationsFlag({
  remoteFeatureFlags,
}: FeatureFlagSource): EnforcedSimulationsFeatureFlag | undefined {
  return (remoteFeatureFlags as RemoteFlagsWithEnforcedSimulations)?.[
    ENFORCED_SIMULATIONS_FEATURE_FLAG
  ];
}

function isTrusted(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  const { chainId, txParams, txParamsOriginal, nestedTransactions } =
    transactionMeta;

  // Trust verdicts are cache-driven on every chain: only a cached non-Trusted
  // verdict disqualifies a recipient, and chains the Security Alerts API
  // cannot screen resolve to ErrorResult once scanned, which is non-Trusted
  // and therefore enforces.
  //
  // Recipients that no scan path covers stay cache misses and are treated as
  // trusted here. The trust-signals middleware only scans a transaction's own
  // `to`, so nested `wallet_sendCalls` recipients are never scanned, and
  // nothing is scanned at all when the user has security alerts disabled.
  if (!chainId) {
    return false;
  }

  // Use the original `to` address before any container wrapping,
  // since containers may redirect to a trusted delegation manager.
  const originalTo = txParamsOriginal?.to ?? txParams?.to;
  const toAddresses = getToAddresses(originalTo, nestedTransactions);

  if (toAddresses.length === 0) {
    return true;
  }

  return !toAddresses.some((address) => {
    const cacheKey = createCacheKey(chainId, address);
    const cached = state.addressSecurityAlertResponses[cacheKey];

    if (!cached || cached.result_type === ResultType.Loading) {
      return false;
    }

    return cached.result_type !== ResultType.Trusted;
  });
}

function getToAddresses(
  primaryTo: string | undefined,
  nestedTransactions: TransactionMeta['nestedTransactions'],
): string[] {
  const addresses: string[] = [];

  if (primaryTo) {
    addresses.push(primaryTo);
  }

  if (nestedTransactions) {
    for (const nested of nestedTransactions) {
      if (nested.to) {
        addresses.push(nested.to);
      }
    }
  }

  return addresses;
}

function hasBalanceChanges(simulationData?: SimulationData | null): boolean {
  return (
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length)
  );
}
