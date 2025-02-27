import { ApprovalRequest } from '@metamask/approval-controller';
import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { AlertActionKey } from '../../../../components/app/confirm/info/row/constants';
import { getMemoizedUnapprovedConfirmations } from '../../../../selectors';
import { useConfirmationNavigation } from '../../hooks/useConfirmationNavigation';

export const useAlertsActions = (
  hideAlertModal: () => void,
  pendingConfirmation: ApprovalRequest<{ id: string }>,
) => {
  const pendingConfirmations = useSelector(getMemoizedUnapprovedConfirmations);

  const { getIndex, navigateToIndex } = useConfirmationNavigation();

  const processAction = useCallback(
    (actionKey: string) => {
      switch (actionKey) {
        case AlertActionKey.ShowPendingConfirmation: {
          const { id, origin } = pendingConfirmation;
          const pendingConfirmationsFromSameOrigin =
            pendingConfirmations?.filter(
              (confirmation) =>
                confirmation.origin === origin && confirmation.id !== id,
            );
          const nextIndex = getIndex(pendingConfirmationsFromSameOrigin[0]?.id);
          navigateToIndex(nextIndex);
          hideAlertModal();
          break;
        }
        default:
          console.error('Unknown alert action key:', actionKey);
          break;
      }
    },
    [
      getIndex,
      pendingConfirmation,
      pendingConfirmations,
      hideAlertModal,
      navigateToIndex,
    ],
  );

  return processAction;
};
