import { useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  formatChainIdToCaip,
  getQuotesReceivedProperties,
  isCrossChain,
} from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { useNavigate } from 'react-router-dom';
import { getExtensionSkipTransactionStatusPage } from '../../../../shared/lib/selectors/smart-transactions';
import { isHardwareWallet } from '../../../../shared/lib/selectors/keyring';
import { captureException } from '../../../../shared/lib/sentry';
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
  getToToken,
  getWarningLabels,
  type BridgeAppState,
} from '../../../ducks/bridge/selectors';
import {
  ConnectionStatus,
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from '../../../contexts/hardware-wallets';
import { isUserRejectedHardwareWalletError } from '../../../contexts/hardware-wallets/rpcErrorUtils';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { type MetaMaskReduxDispatch } from '../../../store/store';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

const ALLOWANCE_RESET_ERROR = 'Eth USDT allowance reset failed';
const APPROVAL_TX_ERROR = 'Approve transaction failed';

type UseSubmitBridgeTransactionOptions = {
  submitOnHardwareWalletSigningPage?: boolean;
  onHardwareWalletSubmitted?: () => void;
  onHardwareWalletRejected?: () => void;
  onHardwareWalletFailed?: () => void;
};

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

export default function useSubmitBridgeTransaction({
  submitOnHardwareWalletSigningPage = false,
  onHardwareWalletSubmitted,
  onHardwareWalletRejected,
  onHardwareWalletFailed,
}: UseSubmitBridgeTransactionOptions = {}) {
  const navigate = useNavigate();
  const { navigateToBridgePage, navigateToHwSigningPage } =
    useBridgeNavigation();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const toastEnabled = useSelector(getExtensionSkipTransactionStatusPage);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const fromAccount = useSelector(getFromAccount);
  const toToken = useSelector(getToToken);
  const { recommendedQuote } = useSelector(getBridgeQuotes);
  const warnings = useSelector(
    (state) => getWarningLabels(state as BridgeAppState, Date.now()),
    shallowEqual,
  );
  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);
  const enableMissingNetwork = useEnableMissingNetwork();
  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { ensureDeviceReady } = useHardwareWalletActions();
  const { connectionState } = useHardwareWalletState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
    options?: { rpcTimeoutMs?: number },
  ) => {
    console.log('[HW-Batch] submitBridgeTransaction called', {
      rpcTimeoutMs: options?.rpcTimeoutMs,
      isHardwareWalletAccount,
      connectionStatus: connectionState.status,
      hasFromAccount: Boolean(fromAccount),
    });
    setIsSubmitting(true);

    try {
      if (
        isHardwareWalletAccount &&
        connectionState.status !== ConnectionStatus.Ready
      ) {
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
    } catch (e) {
      console.log('[HW-Batch] submitBridgeTransaction pre-flight catch', e);
      setIsSubmitting(false);
      return;
    }

    console.log('[HW-Batch] submitBridgeTransaction pre-flight passed');
    const intentData = quoteResponse.quote.intent;

    if (hardwareWalletUsed && intentData) {
      console.log(
        '[HW-Batch] submitBridgeTransaction: HW + intentData → onHardwareWalletFailed (intent quotes not supported)',
      );
      captureException(
        new Error('Hardware wallets cannot submit bridge intent quotes'),
      );
      dispatch(setWasTxDeclined(true));
      onHardwareWalletFailed?.();
      setIsSubmitting(false);
      return;
    }

    if (hardwareWalletUsed && !submitOnHardwareWalletSigningPage) {
      navigateToHwSigningPage();
      setIsSubmitting(false);
      return;
    }

    let submissionSucceeded = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      if (intentData) {
        await dispatch(
          submitBridgeIntent({
            quoteResponse,
            accountAddress: fromAccount.address,
            tokenSecurityTypeDestination: toToken?.securityData?.type ?? null,
          }),
        );
      } else {
        console.log(
          '[HW-Batch] submitBridgeTransaction: dispatching submitBridgeTx RPC...',
        );
        const rpcPromise = dispatch(
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
            toToken?.securityData?.type ?? null,
          ),
        );

        if (options?.rpcTimeoutMs) {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error('Bridge transaction RPC timed out'));
            }, options.rpcTimeoutMs);
          });
          await Promise.race([rpcPromise, timeoutPromise]);
        } else {
          await rpcPromise;
        }
      }
      submissionSucceeded = true;
      console.log('[HW-Batch] submitBridgeTransaction RPC succeeded');
    } catch (e) {
      console.log(
        '[HW-Batch] submitBridgeTransaction caught error',
        e,
        'isHW:',
        hardwareWalletUsed,
        'isRejection:',
        isHardwareWalletUserRejection(e),
      );
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        onHardwareWalletRejected?.();
        if (!submitOnHardwareWalletSigningPage) {
          navigateToBridgePage();
        }
        return;
      }

      if (hardwareWalletUsed) {
        dispatch(setWasTxDeclined(true));
        onHardwareWalletFailed?.();
        return;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }

    const to =
      submitOnHardwareWalletSigningPage || toastEnabled
        ? DEFAULT_ROUTE
        : `${DEFAULT_ROUTE}?tab=activity`;

    if (submissionSucceeded && hardwareWalletUsed) {
      onHardwareWalletSubmitted?.();

      if (submitOnHardwareWalletSigningPage) {
        return;
      }
    }

    navigate(to, {
      state: { stayOnHomePage: true },
      replace: true,
    });
  };

  return {
    submitBridgeTransaction,
    isSubmitting,
  };
}
