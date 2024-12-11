import { useDispatch, useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { createProjectLogger, Hex } from '@metamask/utils';
import { QuoteMetadata, QuoteResponse } from '../types';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
import { getQuoteRequest } from '../../../ducks/bridge/selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import useAddToken from './useAddToken';
import useHandleApprovalTx from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

const debugLog = createProjectLogger('bridge');

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const srcChainId = useSelector(getCurrentChainId);
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();
  const { slippage } = useSelector(getQuoteRequest);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    // TODO catch errors and emit ActionFailed here
    // Execute transaction(s)
    let approvalTxMeta: TransactionMeta | undefined;
    if (quoteResponse?.approval) {
      // This will never be an STX
      approvalTxMeta = await handleApprovalTx({
        approval: quoteResponse.approval,
        quoteResponse,
      });
    }

    if (
      (
        [
          CHAIN_IDS.LINEA_MAINNET,
          CHAIN_IDS.LINEA_GOERLI,
          CHAIN_IDS.LINEA_SEPOLIA,
        ] as Hex[]
      ).includes(srcChainId)
    ) {
      debugLog(
        'Delaying submitting bridge tx to make Linea confirmation more likely',
      );
      const waitPromise = new Promise((resolve) => setTimeout(resolve, 5000));
      await waitPromise;
    }

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
        slippagePercentage: slippage ?? 0,
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
