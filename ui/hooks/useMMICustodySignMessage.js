import { useDispatch, useSelector } from 'react-redux';
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import {
  mmiActionsFactory,
  setTypedMessageInProgress,
} from '../store/institutional/institution-background';
import {
  accountsWithSendEtherInfoSelector,
  getAccountType,
} from '../selectors';
import { getAccountByAddress } from '../helpers/utils/util';
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { goHome, showModal } from '../store/actions';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../shared/constants/app';

export function useMMICustodySignMessage() {
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const envType = getEnvironmentType();
  const accountType = useSelector(getAccountType);
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  const custodySignFn = async (...opts) => {
    if (accountType === 'custody') {
      const { address: fromAddress } =
        getAccountByAddress(allAccounts, opts.params.from) || {};
      try {
        let msgData = opts.params;
        let id = msgData.custodyId;
        if (!id) {
          msgData = await opts.action(opts.params);
          id = msgData.custodyId;
        }
        dispatch(
          showCustodianDeepLink({
            dispatch,
            mmiActions,
            txId: undefined,
            custodyId: id,
            fromAddress,
            isSignature: true,
            closeNotification: isNotification,
            onDeepLinkFetched: () => undefined,
            onDeepLinkShown: () => undefined,
          }),
        );
        await dispatch(setTypedMessageInProgress(msgData.metamaskId));
        await dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));
        await dispatch(goHome());
        return msgData;
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
        return null;
      }
    }

    return opts.action(opts.params);
  };

  return { custodySignFn };
}
