import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { pendingConfirmationsSortedSelector } from '../selectors';
import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../confirmation/templates';
import {
  CONFIRM_TRANSACTION_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { isCorrectSignatureApprovalType } from '../../../../shared/lib/confirmation.utils';

export function useConfirmationNavigation() {
  const pendingConfirmations = useSelector(pendingConfirmationsSortedSelector);
  const history = useHistory();

  const getIndex = useCallback(
    (confirmationId?: string) => {
      if (!confirmationId) {
        return 0;
      }

      return pendingConfirmations.findIndex(({ id }) => id === confirmationId);
    },
    [pendingConfirmations],
  );

  const navigateToId = useCallback(
    (confirmationId?: string) => {
      if (pendingConfirmations?.length <= 0 || !confirmationId) {
        return;
      }

      const nextConfirmation = pendingConfirmations.find(
        (confirmation) => confirmation.id === confirmationId,
      );

      if (!nextConfirmation) {
        return;
      }

      const isTemplate = TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(
        nextConfirmation.type as ApprovalType,
      );

      if (isTemplate) {
        history.replace(`/confirmation/${nextConfirmation.id}`);
        return;
      }

      let route = `${CONFIRM_TRANSACTION_ROUTE}/${nextConfirmation.id}`;

      if (
        isCorrectSignatureApprovalType(nextConfirmation.type as ApprovalType)
      ) {
        route += SIGNATURE_REQUEST_PATH;
      }

      history.replace(route);
    },
    [pendingConfirmations, history],
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      const nextConfirmation = pendingConfirmations[index];
      navigateToId(nextConfirmation?.id);
    },
    [pendingConfirmations, navigateToId],
  );

  const count = pendingConfirmations.length;

  return { count, getIndex, navigateToId, navigateToIndex };
}
