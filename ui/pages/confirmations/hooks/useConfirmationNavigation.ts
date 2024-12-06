import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { ApprovalType } from '@metamask/controller-utils';
import { isEqual } from 'lodash';
import { pendingConfirmationsSortedSelector } from '../selectors';
import { TEMPLATED_CONFIRMATION_APPROVAL_TYPES } from '../confirmation/templates';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRMATION_V_NEXT_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { isSignatureTransactionType } from '../utils';

export function useConfirmationNavigation() {
  const confirmations = useSelector(
    pendingConfirmationsSortedSelector,
    isEqual,
  );

  const history = useHistory();

  const getIndex = useCallback(
    (confirmationId?: string) => {
      if (!confirmationId) {
        return 0;
      }

      return confirmations.findIndex(({ id }) => id === confirmationId);
    },
    [confirmations],
  );

  const navigateToId = useCallback(
    (confirmationId?: string) => {
      if (confirmations?.length <= 0 || !confirmationId) {
        return;
      }

      const nextConfirmation = confirmations.find(
        (confirmation) => confirmation.id === confirmationId,
      );

      if (!nextConfirmation) {
        return;
      }

      const type = nextConfirmation.type as ApprovalType;
      const isTemplate = TEMPLATED_CONFIRMATION_APPROVAL_TYPES.includes(type);

      if (isTemplate) {
        history.replace(`${CONFIRMATION_V_NEXT_ROUTE}/${confirmationId}`);
        return;
      }

      const isSignature = isSignatureTransactionType(nextConfirmation);

      if (isSignature) {
        history.replace(
          `${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}${SIGNATURE_REQUEST_PATH}`,
        );
        return;
      }

      if (type === ApprovalType.Transaction) {
        history.replace(`${CONFIRM_TRANSACTION_ROUTE}/${confirmationId}`);
      }
    },
    [confirmations, history],
  );

  const navigateToIndex = useCallback(
    (index: number) => {
      const nextConfirmation = confirmations[index];
      navigateToId(nextConfirmation?.id);
    },
    [confirmations, navigateToId],
  );

  const count = confirmations.length;

  return { confirmations, count, getIndex, navigateToId, navigateToIndex };
}
