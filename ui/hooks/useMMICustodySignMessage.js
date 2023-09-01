import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import { showCustodyConfirmLink } from '../store/institutional/institution-actions';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import {
  accountsWithSendEtherInfoSelector,
  getAccountType,
} from '../selectors';
import {
  resolvePendingApproval,
  completedTx,
  showModal,
} from '../store/actions';
import { getAccountByAddress } from '../helpers/utils/util';
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../shared/constants/app';

export function useMMICustodySignMessage() {
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const envType = getEnvironmentType();
  const accountType = useSelector(getAccountType);
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  const allAccounts = useSelector(
    accountsWithSendEtherInfoSelector,
    shallowEqual,
  );

  const custodySignFn = async (_msgData) => {
    const {
      msgParams: { from },
    } = _msgData;

    const fromAccount = getAccountByAddress(allAccounts, from);

    if (accountType === 'custody') {
      try {
        await dispatch(resolvePendingApproval(_msgData.id));
        completedTx(_msgData.id);

        showCustodianDeepLink({
          dispatch,
          mmiActions,
          txId: undefined,
          custodyId: null,
          fromAddress: fromAccount.address,
          isSignature: true,
          closeNotification: isNotification,
          onDeepLinkFetched: () => undefined,
          onDeepLinkShown: () => undefined,
          showCustodyConfirmLink,
        });
        await dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));
      } catch (err) {
        await dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));
        await dispatch(
          showModal({
            name: 'TRANSACTION_FAILED',
            errorMessage: err.message,
            closeNotification: true,
            operationFailed: true,
          }),
        );
      }
    } else {
      // Non Custody accounts follow normal flow
      await dispatch(resolvePendingApproval(_msgData.id));
      completedTx(_msgData.id);
    }
  };

  return { custodySignFn };
}
