import { useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  formatChainIdToCaip,
  getQuotesReceivedProperties,
  isCrossChain,
} from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { useNavigate } from 'react-router-dom';
import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';
import { captureException } from '../../../shared/lib/sentry';
import {
  submitBridgeIntent,
  submitBridgeTx,
} from '../../ducks/bridge-status/actions';
import {
  getBridgeLocation,
  setWasTxDeclined,
} from '../../ducks/bridge/actions';
import {
  getBridgeQuotes,
  getFromAccount,
  getFromTokenBalanceInUsd,
  getIsStxEnabled,
  getToToken,
  getWarningLabels,
  type BridgeAppState,
} from '../../ducks/bridge/selectors';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
} from '../../contexts/hardware-wallets/HardwareWalletContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { type MetaMaskReduxDispatch } from '../../store/store';
import { isHardwareWalletUserRejection } from '../../pages/bridge/utils/hardware-wallet-errors';
import { useBridgeNavigation } from './useBridgeNavigation';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';
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

export default function useSubmitBridgeTransaction() {
  const navigate = useNavigate();
  const { navigateToBridgePage, navigateToHwSigningPage } =
    useBridgeNavigation();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const fromAccount = useSelector(getFromAccount);
  const toToken = useSelector(getToToken);
  const { recommendedQuote } = useSelector(getBridgeQuotes);
  const warnings = useSelector(
    (state) => getWarningLabels(state as BridgeAppState, Date.now()),
    shallowEqual,
  );
  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);
  const getHasSufficientGasForQuote = useHasSufficientGasForQuoteForMetrics();
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
      navigateToHwSigningPage();
      setIsSubmitting(false);
    }

    try {
      const location = await getBridgeLocation();

      if (intentData) {
        await dispatch(
          submitBridgeIntent({
            quoteResponse,
            accountAddress: fromAccount.address,
            location,
            tokenSecurityTypeDestination: toToken?.securityData?.type ?? null,
          }),
        );
      } else {
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
              getHasSufficientGasForQuote(quoteResponse),
            ),
            location,
            toToken?.securityData?.type ?? null,
          ),
        );
      }
    } catch (e) {
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        navigateToBridgePage();
        return;
      }
    } finally {
      setIsSubmitting(false);
    }

    navigate(DEFAULT_ROUTE, {
      state: { stayOnHomePage: true },
      replace: true,
    });
  };

  return {
    submitBridgeTransaction,
    isSubmitting,
  };
}
