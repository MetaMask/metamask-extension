import { useDispatch, useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { createProjectLogger } from '@metamask/utils';
import { QuoteMetadata, QuoteResponse } from '../types';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
import { isHardwareWallet } from '../../../selectors';
import useAddToken from './useAddToken';
import useHandleApprovalTx from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

const debugLog = createProjectLogger('bridge');

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (hardwareWalletUsed) {
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    // Execute transaction(s)
    let approvalTxMeta: TransactionMeta | undefined;
    try {
      if (quoteResponse?.approval) {
        // This will never be an STX
        approvalTxMeta = await handleApprovalTx({
          approval: quoteResponse.approval,
          quoteResponse,
        });
      }
    } catch (e) {
      debugLog('Approve transaction failed', e);
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

    let bridgeTxMeta: TransactionMeta | undefined;
    try {
      bridgeTxMeta = await handleBridgeTx({
        quoteResponse,
        approvalTxId: approvalTxMeta?.id,
      });
    } catch (e) {
      debugLog('Bridge transaction failed', e);
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      return;
    }

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

    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push(DEFAULT_ROUTE);
  };

  return {
    submitBridgeTransaction,
  };
}
