import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  mapChainIdToSupportedEVMChain,
  ResultType,
} from '../trust-signals';

const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

/**
 * State required by the enforced simulations trust signal check.
 */
export type EnforcedSimulationsState = {
  addressSecurityAlertResponses: Record<string, CachedScanAddressResponse>;
};

/**
 * Returns the default slippage percentage for enforced simulations.
 *
 * @returns The slippage percentage.
 */
export function getEnforcedSimulationsSlippage(): number {
  return DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE;
}

/**
 * Determines whether a transaction is eligible for enforced simulations.
 *
 * When state is provided and the chain supports trust signals, also
 * requires that at least one recipient address is loaded and not trusted.
 * If the chain is unsupported by trust signals, the transaction remains
 * eligible since we cannot verify trust. When state is omitted (e.g.
 * background hook), only the base eligibility checks are applied.
 *
 * @param transactionMeta - The transaction metadata.
 * @param state - Optional trust signal state. When provided, the trust
 * signal for the recipient must be loaded and not trusted.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function isEnforcedSimulationsEligible(
  transactionMeta: TransactionMeta,
  state?: EnforcedSimulationsState,
): boolean {
  const { delegationAddress, origin, simulationData } = transactionMeta;

  if (!process.env.ENABLE_ENFORCED_SIMULATIONS) {
    return false;
  }

  if (!origin || origin === ORIGIN_METAMASK) {
    return false;
  }

  if (!delegationAddress) {
    return false;
  }

  if (!hasBalanceChanges(simulationData)) {
    return false;
  }

  if (state && isTrusted(transactionMeta, state)) {
    return false;
  }

  return true;
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
