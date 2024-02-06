import { useDispatch, useSelector } from 'react-redux';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import { getAccountType } from '../selectors';
import {
  resolvePendingApproval,
  completedTx,
  showModal,
} from '../store/actions';

export function useMMICustodySignMessage() {
  const dispatch = useDispatch();
  const mmiActions = mmiActionsFactory();
  const accountType = useSelector(getAccountType);

  const custodySignFn = async (_msgData) => {
    if (accountType === 'custody') {
      try {
        await dispatch(resolvePendingApproval(_msgData.id));
        completedTx(_msgData.id);
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
