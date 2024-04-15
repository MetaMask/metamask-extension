import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { valuesFor } from '../../../helpers/utils/util';
import { showModal, rejectAllMessages } from '../../../store/actions';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  getTotalUnapprovedMessagesCount,
  unconfirmedMessagesHashSelector,
} from '../../../selectors';

export function useRejectTransactionModal() {
  const dispatch = useDispatch();
  const history = useHistory();
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const unapprovedMessagesCount = useSelector(getTotalUnapprovedMessagesCount);
  const unconfirmedMessagesList = useSelector(unconfirmedMessagesHashSelector);

  const handleCancelAll = () => {
    dispatch(
      showModal({
        name: 'REJECT_TRANSACTIONS',
        onSubmit: async () => {
          await dispatch(rejectAllMessages(valuesFor(unconfirmedMessagesList)));
          dispatch(clearConfirmTransaction());
          history.push(mostRecentOverviewPage);
        },
        unapprovedTxCount: unapprovedMessagesCount,
        isRequestType: true,
      }),
    );
  };

  return { handleCancelAll };
}
