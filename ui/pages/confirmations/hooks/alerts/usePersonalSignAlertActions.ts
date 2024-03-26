import { ApprovalType } from '@metamask/controller-utils';
import { useCallback } from 'react';
import useCurrentConfirmation from '../useCurrentConfirmation';
import { useHistory } from 'react-router';
import { useDispatch } from 'react-redux';
import { SWAPS_ROUTE } from '../../../../helpers/constants/routes';
import {
  rejectPendingApproval,
  showLoadingIndication,
} from '../../../../store/actions';
import { ethErrors } from 'eth-rpc-errors';

export enum PersonalSignAlertAction {
  GoToPage = 'go-to-page',
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

      if (actionKey === PersonalSignAlertAction.GoToPage) {
        history.push(SWAPS_ROUTE);
        return;
      }

      if (actionKey === PersonalSignAlertAction.DispatchAction) {
        dispatch(showLoadingIndication());
        return;
      }
    },
    [history, dispatch, currentConfirmation],
  );

  return processAction;
};
