import { useDispatch } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { QuoteResponse } from '../types';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import useAddToken from './useAddToken';
import useHandleApprovalTx from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();

  const submitBridgeTransaction = async (quoteResponse: QuoteResponse) => {
    // Execute transaction(s)
    let approvalTxId: string | undefined;
    if (quoteResponse?.approval) {
      approvalTxId = await handleApprovalTx({
        approval: quoteResponse.approval,
        quoteResponse,
      });
    }

    await handleBridgeTx({
      quoteResponse,
      approvalTxId,
    });

    // Add tokens if not the native gas token
    if (quoteResponse.quote.srcAsset.address !== zeroAddress()) {
      addSourceToken(quoteResponse);
    }
    if (quoteResponse.quote.destAsset.address !== zeroAddress()) {
      await addDestToken(quoteResponse);
    }

    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push(DEFAULT_ROUTE);
  };

  return {
    submitBridgeTransaction,
  };
}
