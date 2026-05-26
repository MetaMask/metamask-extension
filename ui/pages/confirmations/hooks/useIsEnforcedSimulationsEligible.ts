import { TransactionMeta } from '@metamask/transaction-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { useSelector } from 'react-redux';
import {
  EnforcedSimulationsState,
  isEnforcedSimulationsEligible,
} from '../../../../shared/lib/transaction/enforced-simulations';
import { getEip7702SupportedChains } from '../../../../shared/lib/eip7702-support-utils';
import { useConfirmContext } from '../context/confirm';

const EMPTY_RESPONSES: EnforcedSimulationsState['addressSecurityAlertResponses'] =
  {};

export function useIsEnforcedSimulationsEligible(): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const addressSecurityAlertResponses = useSelector(
    (state: { metamask: EnforcedSimulationsState }) =>
      state.metamask.addressSecurityAlertResponses ?? EMPTY_RESPONSES,
  );

  const eip7702SupportedChains = useSelector(
    (state: { metamask: RemoteFeatureFlagControllerState }) =>
      getEip7702SupportedChains(state.metamask),
  );

  if (!currentConfirmation) {
    return false;
  }

  return isEnforcedSimulationsEligible(currentConfirmation, {
    addressSecurityAlertResponses,
    eip7702SupportedChains,
  });
}
