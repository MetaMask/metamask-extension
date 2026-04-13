import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  EnforcedSimulationsState,
  isEnforcedSimulationsEligible,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { useConfirmContext } from '../context/confirm';

export function useIsEnforcedSimulationsEligible(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const addressSecurityAlertResponses = useSelector(
    (state: {
      metamask: Pick<EnforcedSimulationsState, 'addressSecurityAlertResponses'>;
    }) => state.metamask.addressSecurityAlertResponses ?? {},
  );

  if (!currentConfirmation) {
    return false;
  }

  return isEnforcedSimulationsEligible(currentConfirmation, {
    addressSecurityAlertResponses,
  });
}
