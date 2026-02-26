import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { isEnforcedSimulationsEligible } from '../../../../../shared/lib/transaction/enforced-simulations';

export function useIsEnforcedSimulationsSupported() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  return isEnforcedSimulationsEligible(currentConfirmation);
}
