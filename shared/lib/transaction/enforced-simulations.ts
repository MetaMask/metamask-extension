import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { Hex } from '@metamask/utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  mapChainIdToSupportedEVMChain,
  ResultType,
} from '../trust-signals';

/**
 * Default slippage percentage to apply when the
 * `confirmations_enforced_simulations` remote feature flag does not
 * provide a `slippage` value.
 */
export const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

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

type RemoteFlagsWithEnforcedSimulations = {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  confirmations_enforced_simulations?: EnforcedSimulationsFeatureFlag;
};

function getEnforcedSimulationsFlag(
  remoteFeatureFlags: RemoteFeatureFlagControllerState['remoteFeatureFlags'],
): EnforcedSimulationsFeatureFlag | undefined {
  return (remoteFeatureFlags as RemoteFlagsWithEnforcedSimulations)?.[
    ENFORCED_SIMULATIONS_FEATURE_FLAG
  ];
}

/**
 * Reads the `slippage` field from the `confirmations_enforced_simulations`
 * remote feature flag. Falls back to
 * {@link DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE} when the flag or field is
 * absent.
 *
 * @param state - The remote feature flag controller state.
 * @param state.remoteFeatureFlags - The remote feature flags object.
 * @returns The slippage percentage to apply.
 */
export function getEnforcedSimulationsSlippage({
  remoteFeatureFlags,
}: RemoteFeatureFlagControllerState): number {
  return (
    getEnforcedSimulationsFlag(remoteFeatureFlags)?.slippage ??
    DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE
  );
}

/**
 * State required by the enforced simulations trust signal check.
 */
export type EnforcedSimulationsState = {
  addressSecurityAlertResponses: Record<string, CachedScanAddressResponse>;
  eip7702SupportedChains: Hex[];
};

/**
 * Determines whether a transaction is eligible for enforced simulations.
 *
 * When the chain supports trust signals, also requires that at least one
 * recipient address is loaded and not trusted. If the chain is
 * unsupported by trust signals, the transaction remains eligible since
 * we cannot verify trust.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Trust signal state and EIP-7702 supported chains.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function isEnforcedSimulationsEligible(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  const { chainId, origin, simulationData } = transactionMeta;

  if (!origin || origin === ORIGIN_METAMASK) {
    return false;
  }

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

  // When forcing is enabled, skip the trust signal check so enforced
  // simulations always applies as long as balance changes are present.
  // Intended for local development and QA only.
  if (isForceEnabled()) {
    return true;
  }

  if (isTrusted(transactionMeta, state)) {
    return false;
  }

  return true;
}

function isForceEnabled(): boolean {
  return process.env.FORCE_ENABLE_SIMULATIONS === 'true';
}

function isTrusted(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  const { chainId, txParams, txParamsOriginal, nestedTransactions } =
    transactionMeta;

  const supportedChain = chainId
    ? mapChainIdToSupportedEVMChain(chainId)
    : undefined;

  // If trust signals don't support this chain, we can't verify trust —
  // treat as not trusted so the user still gets protection.
  if (!supportedChain) {
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
    const cacheKey = createCacheKey(supportedChain, address);
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
