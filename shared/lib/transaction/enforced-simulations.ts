import {
  SimulationData,
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { Hex, createProjectLogger } from '@metamask/utils';
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

const BASIS_POINTS_PER_PERCENT = 100;

const ENFORCED_SIMULATIONS_FEATURE_FLAG = 'confirmations_enforced_simulations';

const log = createProjectLogger('enforced-simulations-eligibility');

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
  /** Addresses of the user's own internal EVM accounts; excluded from trust evaluation. */
  internalAddresses: string[];
};

type RemoteFlagsWithEnforcedSimulations = {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  confirmations_enforced_simulations?: EnforcedSimulationsFeatureFlag;
};

type FeatureFlagSource = Pick<
  RemoteFeatureFlagControllerState,
  'remoteFeatureFlags'
>;

function isInternalAddress(
  address: string,
  internalAddresses: string[],
): boolean {
  const normalized = address.toLowerCase();
  return internalAddresses.some((a) => a.toLowerCase() === normalized);
}

/**
 * Returns the EVM addresses of the given internal accounts.
 *
 * @param accounts - Array of internal accounts.
 * @returns Array of EVM account addresses.
 */
export function getInternalEvmAddresses(accounts: InternalAccount[]): string[] {
  return accounts.filter((a) => isEvmAccountType(a.type)).map((a) => a.address);
}

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
  const { chainId, origin, simulationData, type } = transactionMeta;

  if (!origin || origin === ORIGIN_METAMASK) {
    return false;
  }

  if (
    !state.eip7702SupportedChains?.some(
      (supported) => supported.toLowerCase() === chainId?.toLowerCase(),
    )
  ) {
    log('Not eligible - chain does not support EIP-7702', {
      chainId,
      type,
    });
    return false;
  }

  if (!hasBalanceChanges(simulationData)) {
    log('Not eligible - no simulated balance changes', { type });
    return false;
  }

  if (isEnforcedSimulationsForceEnabled()) {
    log('Eligible - force enabled', { type });
    return true;
  }

  if (isTrusted(transactionMeta, state)) {
    log('Not eligible - transaction trusted', { type });
    return false;
  }

  log('Eligible', { chainId, type });
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
  const { chainId, type, txParams, txParamsOriginal, nestedTransactions } =
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
  const data = txParamsOriginal?.data ?? txParams?.data;

  // All calls the transaction performs: the outer call plus any nested (batch)
  // calls, treated uniformly.
  const calls = [{ to: originalTo, data, type }, ...(nestedTransactions ?? [])];

  let trusted = true;

  for (let index = 0; index < calls.length; index++) {
    const { to, data: callData, type: callType } = calls[index];
    const label = `Address ${index + 1}`;
    const props = { address: to, type: callType, data: callData };

    if (!to) {
      log(`${label} - Trusted - No Recipient`, props);
      continue;
    }

    if (isInternalAddress(to, state.internalAddresses)) {
      log(`${label} - Trusted - Internal Address`, props);
      continue;
    }

    if (callType === TransactionType.simpleSend) {
      log(`${label} - Trusted - Simple Send`, props);
      continue;
    }

    const cached =
      state.addressSecurityAlertResponses[createCacheKey(supportedChain, to)];

    // Unknown or still-loading signals don't make a call untrusted.
    if (!cached || cached.result_type === ResultType.Loading) {
      log(`${label} - Trusted - Unknown Signal`, {
        ...props,
        resultType: cached?.result_type,
      });
      continue;
    }

    if (cached.result_type === ResultType.Trusted) {
      log(`${label} - Trusted - Trusted Signal`, props);
      continue;
    }

    log(`${label} - Not Trusted - ${cached.result_type}`, props);
    trusted = false;
  }

  return trusted;
}

function hasBalanceChanges(simulationData?: SimulationData | null): boolean {
  return (
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length)
  );
}
