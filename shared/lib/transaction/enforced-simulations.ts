import {
  SimulationData,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';

const DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE = 10;

/**
 * Checks whether a transaction is eligible for enforced simulations.
 *
 * Requires all of:
 * - The ENABLE_ENFORCED_SIMULATIONS env flag is set
 * - The transaction origin is external (not MetaMask-initiated)
 * - The account has a delegation address (is upgraded)
 * - The simulation produced balance changes
 *
 * @param transactionMeta - The transaction metadata to check.
 * @returns Whether the transaction is eligible for enforced simulations.
 */
export function isEnforcedSimulationsEligible(
  transactionMeta: Pick<
    TransactionMeta,
    'delegationAddress' | 'origin' | 'simulationData'
  >,
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

/**
 * Returns the default slippage percentage for enforced simulations.
 *
 * @returns The slippage percentage.
 */
export function getEnforcedSimulationsSlippage(): number {
  return DEFAULT_ENFORCED_SIMULATIONS_SLIPPAGE;
}

function hasBalanceChanges(simulationData?: SimulationData | null): boolean {
  return (
    Boolean(simulationData?.nativeBalanceChange) ||
    Boolean(simulationData?.tokenBalanceChanges?.length)
  );
}
