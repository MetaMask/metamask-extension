import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  formatChainIdToCaip,
  getQuotesReceivedProperties,
  isCrossChain,
} from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { isHardwareWallet } from '../../../../shared/modules/selectors';
import { captureException } from '../../../../shared/lib/sentry';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import {
  submitBridgeIntent,
  submitBridgeTx,
} from '../../../ducks/bridge-status/actions';
import { setWasTxDeclined } from '../../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAccount,
  getFromTokenBalanceInUsd,
  getIsStxEnabled,
  getWarningLabels,
} from '../../../ducks/bridge/selectors';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../../contexts/hardware-wallets/HardwareWalletContext';
import { isUserRejectedHardwareWalletError } from '../../../contexts/hardware-wallets/rpcErrorUtils';
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
    (errorMessage.includes('trezor') &&
      (errorMessage.includes('cancelled') ||
        errorMessage.includes('rejected'))) ||
    (errorMessage.includes('lattice') && errorMessage.includes('rejected')) ||
    errorMessage.includes('user rejected') ||
    errorMessage.includes('user cancelled')
  );
};

export default function useSubmitBridgeTransaction() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const fromAccount = useSelector(getFromAccount);
  const { recommendedQuote } = useSelector(getBridgeQuotes);
  const warnings = useSelector(getWarningLabels);
  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);
  const enableMissingNetwork = useEnableMissingNetwork();
  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
  ) => {
    setIsSubmitting(true);

    try {
      if (isHardwareWalletAccount) {
        const isDeviceReady = await ensureDeviceReady();
        if (!isDeviceReady) {
          throw new Error('Hardware wallet device is not ready');
        }
      }

      if (!fromAccount) {
        throw new Error(
          'Failed to submit bridge transaction: No selected account',
        );
      }

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
    } catch {
      setIsSubmitting(false);
      return;
    }

    const intentData = quoteResponse.quote.intent;

    if (hardwareWalletUsed) {
      const {
        quote: { requestId },
      } = quoteResponse;
      const awaitingUrl = requestId
        ? `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(
            requestId,
          )}`
        : `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`;
      navigate(awaitingUrl);
      setIsSubmitting(false);
    }

    try {
      if (intentData) {
        await dispatch(
          submitBridgeIntent({
            quoteResponse,
            accountAddress: fromAccount.address,
          }),
        );
        navigate(`${DEFAULT_ROUTE}?tab=activity`, {
          state: { stayOnHomePage: true },
        });
        return;
      }

      await dispatch(
        submitBridgeTx(
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
        navigate(`${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`, {
          replace: true,
        });
        return;
      }
      navigate(`${DEFAULT_ROUTE}?tab=activity`, {
        replace: true,
        state: { stayOnHomePage: true },
      });
      return;
    } finally {
      setIsSubmitting(false);
    }

    navigate(`${DEFAULT_ROUTE}?tab=activity`, {
      state: { stayOnHomePage: true },
    });
  };

  return {
    submitBridgeTransaction,
    isSubmitting,
  };
}
