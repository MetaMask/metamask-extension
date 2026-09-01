import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';

/**
 * Hook to determine if gas estimation has failed for the current transaction.
 *
 * Gas estimation is considered failed when:
 * - The simulation has failed (simulationFails is truthy)
 * - AND the user has not set a custom gas fee level
 *
 * When the user sets a custom gas fee level, we don't consider it a failure
 * because the user has explicitly chosen their gas settings.
 *
 * @returns `true` if gas estimation has failed, `false` otherwise.
 */
export function useEstimationFailed(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  return (
    Boolean(currentConfirmation?.simulationFails) &&
    currentConfirmation?.userFeeLevel !== UserFeeLevel.CUSTOM
  );
}
