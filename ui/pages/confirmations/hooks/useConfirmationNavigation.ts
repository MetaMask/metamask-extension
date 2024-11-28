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
} from '../../../helpers/constants/routes';

export function useConfirmationNavigation() {
  const pendingConfirmations = useSelector(
    pendingConfirmationsSortedSelector,
    isEqual,
  );

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
        history.replace(`/${CONFIRMATION_V_NEXT_ROUTE}/${nextConfirmation.id}`);
        return;
      }

      history.replace(`${CONFIRM_TRANSACTION_ROUTE}/${nextConfirmation.id}`);
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
