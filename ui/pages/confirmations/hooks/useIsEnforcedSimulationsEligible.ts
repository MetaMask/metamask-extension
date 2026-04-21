import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import {
  EnforcedSimulationsState,
  isEnforcedSimulationsEligible,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { useConfirmContext } from '../context/confirm';

const EMPTY_RESPONSES: EnforcedSimulationsState['addressSecurityAlertResponses'] =
  {};

export function useIsEnforcedSimulationsEligible(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const addressSecurityAlertResponses = useSelector(
    (state: { metamask: EnforcedSimulationsState }) =>
      state.metamask.addressSecurityAlertResponses ?? EMPTY_RESPONSES,
  );

  if (!currentConfirmation) {
    return false;
  }

  return isEnforcedSimulationsEligible(currentConfirmation, {
    addressSecurityAlertResponses,
  });
}
