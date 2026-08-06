import {
  getEffectiveRecipient,
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
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
  // trusted here. The trust-signals middleware scans dapp `eth_sendTransaction`
  // and `wallet_sendCalls` requests (each call's `to` plus approval spenders
  // and token-transfer recipients decoded from calldata), but nothing is
  // scanned when the user has security alerts disabled, and the outer batch
  // target (`txParamsOriginal.to`, the upgraded EOA for a 7702 batch) is
  // never scanned, so its cache miss never disqualifies.
  if (!chainId) {
    return false;
  }

  const toAddresses = getRecipientAddresses(
    txParams,
    txParamsOriginal,
    transactionMeta.type,
    nestedTransactions,
  );

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

/**
 * Collects the effective recipient of the transaction and of each nested
 * transaction. For classified ERC-20/721/1155 transfers,
 * {@link getEffectiveRecipient} returns the recipient decoded from calldata
 * rather than `to` (the token contract), so the trust verdict evaluated here
 * belongs to the address actually receiving the funds. Unclassified
 * transactions fall back to `to` unchanged.
 *
 * @param txParams - Current transaction params.
 * @param txParamsOriginal - Params before any container wrapping. Preferred,
 * since containers may redirect `to` to a trusted delegation manager.
 * @param type - Classified type of the (outer) transaction.
 * @param nestedTransactions - Nested transactions of a batch, each carrying
 * its own classified type.
 * @returns Recipient addresses to evaluate trust verdicts for.
 */
function getRecipientAddresses(
  txParams: TransactionMeta['txParams'],
  txParamsOriginal: TransactionMeta['txParamsOriginal'],
  type: TransactionMeta['type'],
  nestedTransactions: TransactionMeta['nestedTransactions'],
): string[] {
  const addresses: string[] = [];

  const primaryRecipient = getEffectiveRecipient({
    txParams: {
      to: txParamsOriginal?.to ?? txParams?.to,
      data: txParamsOriginal?.data ?? txParams?.data,
    },
    type,
  } as TransactionMeta);

  if (primaryRecipient) {
    addresses.push(primaryRecipient);
  }

  if (nestedTransactions) {
    for (const nested of nestedTransactions) {
      const recipient = getEffectiveRecipient({
        txParams: { to: nested.to, data: nested.data },
        type: nested.type,
      } as TransactionMeta);

      if (recipient) {
        addresses.push(recipient);
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
