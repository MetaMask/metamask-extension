import { ApprovalType } from '@metamask/controller-utils';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { SWAPS_ROUTE } from '../../../../helpers/constants/routes';
import { showLoadingIndication } from '../../../../store/actions';

export enum PersonalSignAlertAction {
  GoToSwapPage = 'go-to-swap-page',
  DispatchAction = 'dispatch-action',
}

export const usePersonalSignAlertActions = () => {
  const { currentConfirmation } = useCurrentConfirmation();
  const history = useHistory();
  const dispatch = useDispatch();

  const processAction = useCallback(
    (actionKey: string) => {
      if (currentConfirmation?.type !== ApprovalType.PersonalSign) {
        return;
      }

      if (actionKey === PersonalSignAlertAction.GoToSwapPage) {
        history.push(SWAPS_ROUTE);
      }

      if (actionKey === PersonalSignAlertAction.DispatchAction) {
        dispatch(showLoadingIndication());
      }
    },
    [history, dispatch, currentConfirmation],
  );

  return processAction;
};
