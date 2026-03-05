import { useDispatch, useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  getQuotesReceivedProperties,
  isCrossChain,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { isHardwareWallet } from '../../../../shared/modules/selectors';
import { captureException } from '../../../../shared/lib/sentry';
import { submitBridgeTx } from '../../../ducks/bridge-status/actions';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAccount,
  getFromTokenBalanceInUsd,
  getIsStxEnabled,
  getWarningLabels,
} from '../../../ducks/bridge/selectors';
import { isUserRejectedHardwareWalletError } from '../../../contexts/hardware-wallets/rpcErrorUtils';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

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
  if (isUserRejectedHardwareWalletError(error)) {
    return true;
  }

  const errorMessage = (error as Error).message?.toLowerCase() ?? '';

  return (
    // These will be removed when adapters are made for the hardware wallets error management.
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
  const {
    navigateToBridgePage,
    navigateToHwSigningPage,
    navigateToActivityPage,
  } = useBridgeNavigation();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);

  const fromAccount = useSelector(getFromAccount);
  const { recommendedQuote } = useSelector(getBridgeQuotes);
  const warnings = useSelector(getWarningLabels);
  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);
  const enableMissingNetwork = useEnableMissingNetwork();

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    if (!fromAccount) {
      throw new Error(
        'Failed to submit bridge transaction: No selected account',
      );
    }

    // If bridging, enable All Networks view so the user can see their bridging activity
    if (
      isCrossChain(
        quoteResponse.quote.srcChainId,
        quoteResponse.quote.destChainId,
      )
    ) {
      enableMissingNetwork(
        formatChainIdToCaip(quoteResponse.quote.destChainId),
      );
    }

    if (hardwareWalletUsed) {
      const {
        quote: { requestId },
      } = quoteResponse;
      // Preserve requestId across popup -> fullscreen transitions (QR flow).
      navigateToHwSigningPage(requestId);
    }

    // Execute transaction(s)
    try {
      // Handle non-EVM source chains (Solana, Bitcoin, Tron)
      const isNonEvmSource = isNonEvmChainId(quoteResponse.quote.srcChainId);

      if (isNonEvmSource) {
        // Submit the transaction first, THEN navigate
        await dispatch(
          await submitBridgeTx(
            fromAccount.address,
            quoteResponse,
            false,
            getQuotesReceivedProperties(
              quoteResponse,
              warnings,
              true,
              recommendedQuote,
              fromTokenBalanceInUsd,
            ),
          ),
        );
        navigateToActivityPage();
        return;
      }

      await dispatch(
        await submitBridgeTx(
          fromAccount.address,
          quoteResponse,
          smartTransactionsEnabled,
          getQuotesReceivedProperties(
            quoteResponse,
            warnings,
            true,
            recommendedQuote,
            fromTokenBalanceInUsd,
          ),
        ),
      );
    } catch (e) {
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        navigateToBridgePage();
      } else {
        navigateToActivityPage();
      }
      return;
    }

    navigateToActivityPage();
  };

  return {
    submitBridgeTransaction,
  };
}
