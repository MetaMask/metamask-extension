import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { createProjectLogger } from '@metamask/utils';
import { isSolanaChainId } from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
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
  getIsSmartTransaction,
  isHardwareWallet,
} from '../../../../shared/modules/selectors';
import { getFromChain } from '../../../ducks/bridge/selectors';
import { captureException } from '../../../../shared/lib/sentry';

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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const fromChain = useSelector(getFromChain);
  const smartTransactionsEnabled = useSelector((state) =>
    getIsSmartTransaction(state as never, fromChain?.chainId),
  );

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (hardwareWalletUsed) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    // Execute transaction(s)
    try {
      if (isSolanaChainId(quoteResponse.quote.srcChainId)) {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        navigate(DEFAULT_ROUTE, { state: { stayOnHomePage: true } });
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
        navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`);
      } else {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        navigate(DEFAULT_ROUTE);
      }
      return;
    }
    // Route user to activity tab on Home page
    await dispatch(setDefaultHomeActiveTabName('activity'));
    navigate(DEFAULT_ROUTE, { state: { stayOnHomePage: true } });
  };

  return {
    submitBridgeTransaction,
  };
}
