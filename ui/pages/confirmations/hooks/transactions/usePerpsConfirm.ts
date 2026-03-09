import { TransactionMeta, TransactionType } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

/**
 * Determines the post-confirmation route for perps deposit transactions.
 *
 * The perps view is a tab on the Home page (not a standalone route), so we
 * navigate to DEFAULT_ROUTE with ?tab=perps rather than PERPS_ROUTE which
 * has no route handler.
 *
 * @param txMeta - The current transaction meta
 * @returns The route to navigate to after confirmation, or undefined
 */
export function usePerpsConfirm(txMeta?: TransactionMeta) {
  const postConfirmRoute = useMemo(() => {
    if (txMeta?.type === TransactionType.perpsDeposit) {
      return `${DEFAULT_ROUTE}?tab=perps`;
    }
    return undefined;
  }, [txMeta?.type]);

  return { postConfirmRoute };
}
