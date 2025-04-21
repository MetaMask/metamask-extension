import { useDispatch, useSelector } from 'react-redux';
import { zeroAddress } from 'ethereumjs-util';
import { useHistory } from 'react-router-dom';
import { TransactionMeta } from '@metamask/transaction-controller';
import { createProjectLogger, Hex } from '@metamask/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { startPollingForBridgeTxStatus } from '../../../ducks/bridge-status/actions';
import { getSelectedAddress, isHardwareWallet } from '../../../selectors';
import { getQuoteRequest } from '../../../ducks/bridge/selectors';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getInitialHistoryItem,
  serializeQuoteMetadata,
} from '../../../../shared/lib/bridge-status/utils';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { getCommonProperties } from '../../../../shared/lib/bridge-status/metrics';
import {
  MetricsBackgroundState,
  StatusTypes,
} from '../../../../shared/types/bridge-status';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { getMultichainIsEvm } from '../../../selectors/multichain';
import useAddToken from './useAddToken';
import useHandleApprovalTx, {
  APPROVAL_TX_ERROR,
  ALLOWANCE_RESET_ERROR,
} from './useHandleApprovalTx';
import useHandleBridgeTx from './useHandleBridgeTx';

const debugLog = createProjectLogger('bridge');
const LINEA_DELAY_MS = 5000;

export const isAllowanceResetError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(ALLOWANCE_RESET_ERROR);
};

export const isApprovalTxError = (error: unknown): boolean => {
  const errorMessage = (error as Error).message ?? '';
  return errorMessage.includes(APPROVAL_TX_ERROR);
};

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
  const state = useSelector((allState) => allState);
  const srcChainId = useSelector(getCurrentChainId);
  const { addSourceToken, addDestToken } = useAddToken();
  const { handleApprovalTx } = useHandleApprovalTx();
  const { handleBridgeTx } = useHandleBridgeTx();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { slippage } = useSelector(getQuoteRequest);
  const selectedAddress = useSelector(getSelectedAddress);
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const isEvm = useMultichainSelector(getMultichainIsEvm);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (hardwareWalletUsed) {
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    const statusRequestCommon = {
      bridgeId: quoteResponse.quote.bridgeId,
      bridge: quoteResponse.quote.bridges[0],
      srcChainId: quoteResponse.quote.srcChainId,
      destChainId: quoteResponse.quote.destChainId,
      quote: quoteResponse.quote,
      refuel: Boolean(quoteResponse.quote.refuel),
    };

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

      // Capture error in metrics
      const historyItem = getInitialHistoryItem({
        quoteResponse: serializeQuoteMetadata(quoteResponse),
        bridgeTxMetaId: 'dummy-id',
        startTime: approvalTxMeta?.time,
        slippagePercentage: slippage ?? 0,
        initialDestAssetBalance: undefined,
        targetContractAddress: undefined,
        account: selectedAddress,
        statusRequest: statusRequestCommon,
      });
      const commonProperties = getCommonProperties(
        historyItem,
        state as { metamask: MetricsBackgroundState },
      );

      // Get tx statuses
      const allowanceResetTransaction = isAllowanceResetError(e)
        ? { allowance_reset_transaction: StatusTypes.FAILED }
        : undefined;
      const approvalTransaction = isApprovalTxError(e)
        ? { approval_transaction: StatusTypes.FAILED }
        : undefined;

      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.ActionFailed,
        properties: {
          ...commonProperties,

          ...allowanceResetTransaction,
          ...approvalTransaction,

          error_message: (e as Error).message,
        },
      });

      return;
    }

    if (
      (
        [
          CHAIN_IDS.LINEA_MAINNET,
          CHAIN_IDS.LINEA_GOERLI,
          CHAIN_IDS.LINEA_SEPOLIA,
        ] as Hex[]
      ).includes(srcChainId) &&
      quoteResponse?.approval
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
      ...statusRequestCommon,
      srcTxHash: bridgeTxMeta.hash, // This might be undefined for STX
    };

    // Ensure that for Solana transactions we're properly passing the signature as hash
    // Check for the explicit isSolana flag set in the transaction metadata
    // TODO: see below.
    // @ts-expect-error: bridgeTxMeta is not typed with isSolana, need to clean this up later.
    const isSolana = bridgeTxMeta.isSolana === true;

    dispatch(
      startPollingForBridgeTxStatus({
        bridgeTxMeta,
        statusRequest: {
          ...statusRequest,
          // For Solana, ensure we're tracking the correct hash
          srcTxHash:
            isSolana && bridgeTxMeta.hash
              ? bridgeTxMeta.hash
              : statusRequest.srcTxHash,
        },
        quoteResponse: serializeQuoteMetadata(quoteResponse),
        slippagePercentage: slippage ?? 0,
        startTime: bridgeTxMeta.time,
      }),
    );
    // Only add tokens if the source or dest chain is an EVM chain bc non-evm tokens
    // are detected by the multichain asset controllers
    if (isEvm) {
      // Add tokens if not the native gas token
      if (quoteResponse.quote.srcAsset.address !== zeroAddress()) {
        addSourceToken(quoteResponse);
      }
      if (
        quoteResponse.quote.destAsset.address !== zeroAddress() &&
        !isSolanaChainId(quoteResponse.quote.destChainId)
      ) {
        await addDestToken(quoteResponse);
      }
    }
    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    // Only redirect to activity tab if not on Solana
    // This avoids an unintended side effect where the user is redirected to the activity tab
    // after already being redirected from a different flow.
    if (!isSolana) {
      history.push({
        pathname: DEFAULT_ROUTE,
        state: { stayOnHomePage: true },
      });
    }
  };

  return {
    submitBridgeTransaction,
  };
}
