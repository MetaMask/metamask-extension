import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { createProjectLogger } from '@metamask/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { captureException } from '@sentry/browser';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { setDefaultHomeActiveTabName } from '../../../store/actions';
import { submitBridgeTx } from '../../../ducks/bridge-status/actions';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getSmartTransactionsEnabled,
  isHardwareWallet,
} from '../../../../shared/modules/selectors';
import { getShouldUseSnapConfirmation } from '../../../ducks/bridge/selectors';
import useSnapConfirmation from './useSnapConfirmation';

const ALLOWANCE_RESET_ERROR = 'Eth USDT allowance reset failed';
const APPROVAL_TX_ERROR = 'Approve transaction failed';

const debugLog = createProjectLogger('bridge');

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
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const shouldShowSnapConfirmation = useSelector(getShouldUseSnapConfirmation);

  // This redirects to the confirmation page if an unapproved snap confirmation exists
  useSnapConfirmation();

  const smartTransactionsEnabled = useSelector(getSmartTransactionsEnabled);
  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (hardwareWalletUsed) {
      history.push(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }
    if (
      shouldShowSnapConfirmation &&
      isSolanaChainId(quoteResponse.quote.srcChainId)
    ) {
      // Move to activity tab before submitting a transaction
      // This is a temporary solution to avoid the transaction not being shown in the activity tab
      // We should find a better solution in the future
      await dispatch(setDefaultHomeActiveTabName('activity'));
      await dispatch(submitBridgeTx(quoteResponse, false));
      // The useSnapConfirmation hook redirects to the confirmation page right after
      // submitting the tx so everything below is unnecessary and we can return early
      return;
    }

    // Execute transaction(s)
    try {
      if (isSolanaChainId(quoteResponse.quote.srcChainId)) {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push({
          pathname: DEFAULT_ROUTE,
          state: { stayOnHomePage: true },
        });
        await dispatch(submitBridgeTx(quoteResponse, false));
        return;
      }
      await dispatch(
        await submitBridgeTx(
          quoteResponse,
          isSolanaChainId(quoteResponse.quote.srcChainId)
            ? false
            : smartTransactionsEnabled,
        ),
      );
    } catch (e) {
      debugLog('Bridge transaction failed', e);
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        history.push(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        history.push(DEFAULT_ROUTE);
      }
      return;
    }
    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    history.push({
      pathname: DEFAULT_ROUTE,
      state: { stayOnHomePage: true },
    });
  };

  return {
    submitBridgeTransaction,
  };
}
