import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';

/**
 * Whether the enforced simulations ("Added protection") row is displayed for
 * the current confirmation. Container types are undefined until they have been
 * applied, so their presence indicates the row has content to render,
 * regardless of whether enforced simulations are currently enabled.
 *
 * @returns True if the enforced simulations row is displayed.
 */
export function useIsEnforcedSimulationsDisplayed(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  return currentConfirmation?.containerTypes !== undefined;
}
