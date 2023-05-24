import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { valuesFor } from '../helpers/utils/util';
import { cancelMsgs, showModal } from '../store/actions';
import { clearConfirmTransaction } from '../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../ducks/history/history';

export function useRejectTransactionModalHooks(
  unconfirmedMessagesList,
  unapprovedMessagesCount,
) {
  const dispatch = useDispatch();
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  return () =>
    dispatch(
      showModal({
        name: 'REJECT_TRANSACTIONS',
        onSubmit: async () => {
          await dispatch(cancelMsgs(valuesFor(unconfirmedMessagesList)));
          dispatch(clearConfirmTransaction());
          history.push(mostRecentOverviewPage);
        },
        unapprovedTxCount: unapprovedMessagesCount,
        isRequestType: true,
      }),
    );
}
