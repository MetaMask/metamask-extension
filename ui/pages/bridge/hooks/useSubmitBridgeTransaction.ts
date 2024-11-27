import { useDispatch } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { QuoteResponse } from '../types';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
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
    let approvalTxMeta: TransactionMeta | undefined;
    if (quoteResponse?.approval) {
      // This will never be an STX
      approvalTxMeta = await handleApprovalTx({
        approval: quoteResponse.approval,
        quoteResponse,
      });
    }

    // Route user to activity tab on Home page
    // Do it ahead of time because otherwise STX waits for a txHash on TransactionType.bridge and that can take a while
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push(DEFAULT_ROUTE);

    const bridgeTxMeta = await handleBridgeTx({
      quoteResponse,
      approvalTxId: approvalTxMeta?.id,
    });

    // Get bridge tx status
    const statusRequest = {
      bridgeId: quoteResponse.quote.bridgeId,
      srcTxHash: bridgeTxMeta.hash, // This might be undefined for STX
      bridge: quoteResponse.quote.bridges[0],
      srcChainId: quoteResponse.quote.srcChainId,
      destChainId: quoteResponse.quote.destChainId,
      quote: quoteResponse.quote,
      refuel: Boolean(quoteResponse.quote.refuel),
    };
    dispatch(
      startPollingForBridgeTxStatus({
        bridgeTxMeta,
        statusRequest,
        quoteResponse,
        slippagePercentage: 0, // TODO pull this from redux/bridgecontroller once it's implemented. currently hardcoded in quoteRequest.slippage right now
        startTime: bridgeTxMeta.time,
      }),
    );

    // Add tokens if not the native gas token
    if (quoteResponse.quote.srcAsset.address !== zeroAddress()) {
      addSourceToken(quoteResponse);
    }
    if (quoteResponse.quote.destAsset.address !== zeroAddress()) {
      await addDestToken(quoteResponse);
    }
  };

  return {
    submitBridgeTransaction,
  };
}
