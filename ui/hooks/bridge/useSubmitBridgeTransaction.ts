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
  useHardwareWalletState,
} from '../../contexts/hardware-wallets/HardwareWalletContext';
import { ConnectionStatus } from '../../contexts/hardware-wallets/types';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { type MetaMaskReduxDispatch } from '../../store/store';
import { isHardwareWalletUserRejection } from '../../pages/bridge/utils/hardware-wallet-errors';
import { useBridgeNavigation } from './useBridgeNavigation';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

type UseSubmitBridgeTransactionOptions = {
  /**
   * When true, submit immediately instead of navigating to the hardware-wallet
   * signing page. Used by the signing page itself. Callers should catch
   * rejections/failures from `submitBridgeTransaction` — this hook throws on
   * hardware-wallet reject/fail instead of invoking callbacks.
   */
  submitOnHardwareWalletSigningPage?: boolean;
};

export default function useSubmitBridgeTransaction({
  submitOnHardwareWalletSigningPage = false,
}: UseSubmitBridgeTransactionOptions = {}) {
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
  const { connectionState } = useHardwareWalletState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse & QuoteMetadata,
    options?: { rpcTimeoutMs?: number },
  ) => {
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
      setIsSubmitting(false);
      return;
    }

    const intentData = quoteResponse.quote.intent;

    if (hardwareWalletUsed && intentData) {
      const error = new Error(
        'Hardware wallets cannot submit bridge intent quotes',
      );
      captureException(error);
      dispatch(setWasTxDeclined(true));
      setIsSubmitting(false);
      throw error;
    }

    if (hardwareWalletUsed && !submitOnHardwareWalletSigningPage) {
      navigateToHwSigningPage();
      setIsSubmitting(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

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
              getHasSufficientGasForQuote(quoteResponse),
            ),
            location,
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
    } catch (e) {
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        dispatch(setWasTxDeclined(true));
        if (!submitOnHardwareWalletSigningPage) {
          navigateToBridgePage();
        }
        throw e;
      }

      // Transport/RPC failures are not user declines — rethrow so the signing
      // page can surface the real error without showing a declined-tx state.
      if (hardwareWalletUsed) {
        throw e;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }

    // Stay on the hardware-wallet signing page after submit; progress is
    // tracked by the signing-page state machine / sign tracker.
    if (submitOnHardwareWalletSigningPage) {
      return;
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
