import { ApprovalRequest } from '@metamask/approval-controller';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { AlertActionKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmationNavigation } from '../../hooks/useConfirmationNavigation';
import {
  ApprovalsMetaMaskState,
  getApprovalsByOrigin,
} from '../../../../selectors';

export const useAlertsActions = (
  hideAlertModal: () => void,
  pendingConfirmation: ApprovalRequest<{ id: string }>,
) => {
  const pendingConfirmationsFromOrigin = useSelector((state) =>
    getApprovalsByOrigin(
      state as ApprovalsMetaMaskState,
      pendingConfirmation?.origin,
    ),
  );

  const { getIndex, navigateToIndex } = useConfirmationNavigation();

  const navigateToPendingConfirmation = useCallback(() => {
    const { id } = pendingConfirmation;
    const pendingConfirmations = pendingConfirmationsFromOrigin?.filter(
      (confirmation) => confirmation.id !== id,
    );
    const nextIndex = getIndex(pendingConfirmations[0]?.id);
    navigateToIndex(nextIndex);
    hideAlertModal();
  }, [
    getIndex,
    pendingConfirmation,
    pendingConfirmationsFromOrigin,
    hideAlertModal,
    navigateToIndex,
  ]);

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.ShowPendingConfirmation:
          navigateToPendingConfirmation();
          break;
        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [navigateToPendingConfirmation],
  );

  return processAction;
};
