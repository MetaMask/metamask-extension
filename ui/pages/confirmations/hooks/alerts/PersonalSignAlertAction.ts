import { ApprovalType } from '@metamask/controller-utils';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { SWAPS_ROUTE } from '../../../../helpers/constants/routes';

export enum PersonalSignAlertAction {
  GoToSwapPage = 'go-to-swap-page',
}

export const usePersonalSignAlertActions = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  const history = useHistory();

  const processAction = useCallback(
    (actionKey: string) => {
      if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
        return;
      }

      if (actionKey === PersonalSignAlertAction.GoToSwapPage) {
        history.push(SWAPS_ROUTE);
      }
    },
    [history, currentConfirmation],
  );

  return processAction;
};
