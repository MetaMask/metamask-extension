import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { isAddressScanSupportedChainId } from '@metamask/phishing-controller';
import { Hex, createProjectLogger } from '@metamask/utils';
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
 * Also requires that Blockaid address screening supports the chain. On
 * unsupported chains, `scanAddress` returns Error without hitting the API;
 * that must not turn enforcement on. Then requires that at least one
 * recipient address is loaded and not trusted, based on cached trust signal
 * scan results keyed by chain and address. A recipient with no cache entry,
 * or one still loading, does not disqualify the transaction; only a cached
 * non-Trusted verdict does. Callers that persist a trust-dependent default
 * must separately wait for pending signals via
 * {@link hasPendingEnforcedSimulationsTrustSignals}.
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

  if (!simulationData) {
    log('Not eligible - simulation not complete', { type });
    return false;
  }

  if (isEnforcedSimulationsForceEnabled()) {
    log('Eligible - force enabled', { type });
    return true;
  }

  if (!chainId || !isAddressScanSupportedChainId(chainId)) {
    log('Not eligible - address screening does not support chain', {
      chainId,
      type,
    });
    return false;
  }

  if (isTrusted(transactionMeta, state)) {
    log('Not eligible - transaction trusted', { type });
    return false;
  }

  log('Eligible', { chainId, type });
  return true;
}

/**
 * Determines whether an eligible transaction should have enforced
 * simulations enabled by default.
 *
 * Enforced simulations are enabled by default when at least one relevant
 * recipient has a Warning or Malicious trust signal. Force-enabled
 * transactions keep the existing enabled-by-default behavior.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Trust signal state and EIP-7702 supported chains.
 * @returns Whether enforced simulations should be enabled by default.
 */
export function isEnforcedSimulationsDefaultEnabled(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  if (isEnforcedSimulationsForceEnabled()) {
    return true;
  }

  return getRelevantTrustSignalResults(transactionMeta, state).some(
    (resultType) =>
      resultType === ResultType.Warning || resultType === ResultType.Malicious,
  );
}

/**
 * Determines whether any relevant recipient still has a pending trust signal.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Trust signal state and EIP-7702 supported chains.
 * @returns Whether a relevant recipient trust signal is still loading.
 */
export function hasPendingEnforcedSimulationsTrustSignals(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): boolean {
  if (isEnforcedSimulationsForceEnabled()) {
    return false;
  }

  return getRelevantTrustSignalResults(transactionMeta, state).includes(
    ResultType.Loading,
  );
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
  return getRelevantTrustSignalResults(transactionMeta, state)
    .filter((resultType) => resultType !== ResultType.Loading)
    .every((resultType) => resultType === ResultType.Trusted);
}

function getRelevantTrustSignalResults(
  transactionMeta: TransactionMeta,
  state: EnforcedSimulationsState,
): ResultType[] {
  const { chainId, type, txParams, txParamsOriginal, nestedTransactions } =
    transactionMeta;

  // Trust verdicts are cache-driven. Only a cached non-Trusted verdict
  // disqualifies a recipient. Unsupported chains are excluded earlier in
  // isEnforcedSimulationsEligible, so an ErrorResult here is a scan failure
  // on a supported chain (timeout / API error), not "this chain isn't
  // supported".
  //
  // Addresses that no scan path covers stay cache misses and are treated as
  // trusted here. The trust-signals middleware scans dapp `eth_sendTransaction`
  // and `wallet_sendCalls` requests (each call's `to` plus approval spenders
  // and token-transfer recipients decoded from calldata), but nothing is
  // scanned when the user has security alerts disabled, and the outer batch
  // target (`txParamsOriginal.to`, the upgraded EOA for a 7702 batch) is
  // never scanned, so its cache miss never disqualifies.
  //
  // This gate deliberately evaluates `to` (the contract being executed) and
  // NOT the decoded recipient of a token transfer. Enforced simulations
  // defend against red-pill contracts that detect simulation and change
  // behavior on-chain; only executing code can do that, so what matters is
  // whether the interaction target is a verified/Trusted contract
  // (CONF-1078). A `Trusted` verdict is a contract-verification signal, so
  // for a USDC transfer the exemption keys off USDC itself; the transfer
  // recipient cannot alter the simulation. Recipient verdicts are still
  // scanned into this same cache, but they power UI trust signals
  // (e.g. flagging a malicious payee), not this enforcement gate.
  if (!chainId) {
    return [];
  }

  // Use the original `to` address before any container wrapping,
  // since containers may redirect to a trusted delegation manager.
  const originalTo = txParamsOriginal?.to ?? txParams?.to;
  const data = txParamsOriginal?.data ?? txParams?.data;

  // All calls the transaction performs: the outer call plus any nested (batch)
  // calls, treated uniformly.
  const calls = [{ to: originalTo, data, type }, ...(nestedTransactions ?? [])];

  const resultTypes: ResultType[] = [];

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
      state.addressSecurityAlertResponses[createCacheKey(chainId, to)];

    // Unknown or still-loading signals don't make a call untrusted.
    if (!cached) {
      log(`${label} - Trusted - Unknown Signal`, props);
      continue;
    }

    if (cached.result_type === ResultType.Loading) {
      log(`${label} - Trusted - Loading Signal`, props);
      resultTypes.push(cached.result_type);
      continue;
    }

    if (cached.result_type === ResultType.Trusted) {
      log(`${label} - Trusted - Trusted Signal`, props);
    } else {
      log(`${label} - Not Trusted - ${cached.result_type}`, props);
    }

    resultTypes.push(cached.result_type);
  }

  return resultTypes;
}
