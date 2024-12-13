import { useDispatch, useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { createProjectLogger, Hex } from '@metamask/utils';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { QuoteMetadata, QuoteResponse } from '../../../../shared/types/bridge';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
import { isHardwareWallet } from '../../../selectors';
import { getQuoteRequest } from '../../../ducks/bridge/selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import useAddToken from './useAddToken';
import useHandleApprovalTx from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

const debugLog = createProjectLogger('bridge');
const LINEA_DELAY_MS = 5000;

const isHardwareWalletUserRejection = (error: unknown): boolean => {
  const errorMessage = (error as Error).message?.toLowerCase() ?? '';
  return (
    // Ledger rejection
    (errorMessage.includes('ledger') &&
      (errorMessage.includes('rejected') ||
        errorMessage.includes('denied') ||
        errorMessage.includes('error while signing'))) ||
    // Trezor rejection
    (errorMessage.includes('trezor') &&
      (errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected'))) ||
    // Lattice rejection
    (errorMessage.includes('lattice') && errorMessage.includes('rejected')) ||
    // Generic hardware wallet rejections
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user cancelled')
  );
};

export default function useSubmitBridgeTransaction() {
  const history = useHistory();
  const dispatch = useDispatch();
  const srcChainId = useSelector(getCurrentChainId);
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { slippage } = useSelector(getQuoteRequest);

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
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }
      return;
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
      const waitPromise = new Promise((resolve) =>
        setTimeout(resolve, LINEA_DELAY_MS),
      );
      await waitPromise;
    }

    let bridgeTxMeta: TransactionMeta | undefined;
    try {
      bridgeTxMeta = await handleBridgeTx({
        quoteResponse,
        approvalTxId: approvalTxMeta?.id,
      });
    } catch (e) {
      debugLog('Bridge transaction failed', e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }
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
