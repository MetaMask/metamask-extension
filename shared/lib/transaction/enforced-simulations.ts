import { TransactionMeta } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  CachedScanAddressResponse,
  createCacheKey,
  mapChainIdToSupportedEVMChain,
  ResultType,
} from '../trust-signals';

const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

/**
 * State required by the enforced simulations eligibility check.
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
 * @param transactionMeta - The transaction metadata.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function getIsEnforcedSimulationsEligible(
  transactionMeta: TransactionMeta,
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

  return true;
}

export function isAddressTrusted(
  address: string,
  chainId: string,
  state: EnforcedSimulationsState,
): boolean {
  const supportedChain = mapChainIdToSupportedEVMChain(chainId);

  if (!supportedChain) {
    return false;
  }

  const cacheKey = createCacheKey(supportedChain, address);
  const cached = state.addressSecurityAlertResponses[cacheKey];

  return cached?.result_type === ResultType.Trusted;
}

function hasBalanceChanges(
  simulationData?: TransactionMeta['simulationData'],
): boolean {
  return (
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length)
  );
}
