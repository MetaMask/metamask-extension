import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import { updateAndApproveTx } from '../store/actions';
import { AccountType, CustodyStatus } from '../../shared/constants/custody';
import { getMostRecentOverviewPage } from '../ducks/history/history';
import { clearConfirmTransaction } from '../ducks/confirm-transaction/confirm-transaction.duck';
import { getAccountType } from '../selectors/selectors';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import { showCustodyConfirmLink } from '../store/institutional/institution-actions';

type MMITransactionMeta = TransactionMeta & {
  txParams: { from: string };
  custodyStatus: CustodyStatus;
  metadata: Record<string, unknown>;
};

export function useMMICustodySendTransaction() {
  const dispatch = useDispatch();
  const history = useHistory();
  const mmiActions = mmiActionsFactory();
  const accountType = useSelector(getAccountType);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const custodyTransactionFn = async (_transactionData: TransactionMeta) => {
    const confirmation = _transactionData as MMITransactionMeta;

    if (confirmation && accountType === AccountType.CUSTODY) {
      confirmation.custodyStatus = CustodyStatus.CREATED;
      confirmation.metadata = confirmation.metadata || {};

      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(true));

      const txId = confirmation.id;
      const fromAddress = confirmation.txParams.from;
      const closeNotification = false;

      await dispatch(updateAndApproveTx(confirmation, true, ''));
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId,
        fromAddress,
        closeNotification,
        isSignature: false,
        custodyId: '',
        onDeepLinkFetched: () => undefined,
        onDeepLinkShown: () => {
          dispatch(clearConfirmTransaction());
        },
        showCustodyConfirmLink,
      });
    } else {
      // Non Custody accounts follow normal flow
      await dispatch(updateAndApproveTx(_transactionData, true, ''));
      dispatch(clearConfirmTransaction());
      history.push(mostRecentOverviewPage);
    }
  };

  return { custodyTransactionFn };
}
