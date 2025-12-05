import { useDispatch, useSelector } from 'react-redux';
import {
  getQuotesReceivedProperties,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
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
import { isHardwareWallet } from '../../../../shared/modules/selectors';
import {
  getBridgeQuotes,
  getFromAccount,
  getIsStxEnabled,
  getWarningLabels,
} from '../../../ducks/bridge/selectors';
import { captureException } from '../../../../shared/lib/sentry';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';

const ALLOWANCE_RESET_ERROR = 'Eth USDT allowance reset failed';
const APPROVAL_TX_ERROR = 'Approve transaction failed';

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
  const { navigate } = useSafeNavigation();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const fromAccount = useSelector(getFromAccount);
  const { recommendedQuote } = useSelector(getBridgeQuotes);
  const warnings = useSelector(getWarningLabels);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (!fromAccount) {
      throw new Error(
        'Failed to submit bridge transaction: No selected account',
      );
    }
    if (hardwareWalletUsed) {
      navigate(`${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`);
    }

    // Execute transaction(s)
    try {
      // Handle non-EVM source chains (Solana, Bitcoin, Tron)
      const isNonEvmSource = isNonEvmChainId(quoteResponse.quote.srcChainId);

      if (isNonEvmSource) {
        // Submit the transaction first, THEN navigate
        await dispatch(
          // await submitBridgeTx(
          submitBridgeTx(
            fromAccount.address,
            quoteResponse,
            false,
            getQuotesReceivedProperties(
              quoteResponse,
              warnings,
              true,
              recommendedQuote,
            ),
          ),
        );
        await dispatch(setDefaultHomeActiveTabName('activity'));
        navigate(DEFAULT_ROUTE, { state: { stayOnHomePage: true } });
        return;
      }

      await dispatch(
        // await submitBridgeTx(
        submitBridgeTx(
          fromAccount.address,
          quoteResponse,
          smartTransactionsEnabled,
          getQuotesReceivedProperties(
            quoteResponse,
            warnings,
            true,
            recommendedQuote,
          ),
        ),
      );
    } catch (e) {
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
