import { useMemo, useRef, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  getQuotesReceivedProperties,
  isCrossChain,
} from '@metamask/bridge-controller';
import type {
  InputPrimaryDenomination,
  QuoteResponse,
} from '@metamask/bridge-controller';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
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
  getInputPrimaryDenomination,
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
import {
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
import { useDispatch } from '../../store/store';
import { isHardwareWalletUserRejection } from '../../pages/bridge/utils/hardware-wallet-errors';
import { getDestChainId } from '../../pages/bridge/utils/quote';
import {
  CHAIN_VALUE_ORDER_AB_KEY,
  CHAIN_VALUE_ORDER_AB_TEST_VARIANTS,
} from '../../../shared/lib/ab-testing/configs/chain-value-order';
import { createActiveABTestAssignment } from '../../../shared/lib/ab-testing/active-ab-test-assignment';
import { useABTest } from '../useABTest';
import { useBridgeNavigation } from './useBridgeNavigation';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';
import { useEnableMissingNetwork } from './useEnableMissingNetwork';

export default function useSubmitBridgeTransaction(
  inputPrimaryDenominationOverride?: InputPrimaryDenomination,
) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHardwareWalletSigningPage = Boolean(
    matchPath(
      `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`,
      pathname,
    ),
  );
  const { navigateToBridgePage, navigateToHwSigningPage } =
    useBridgeNavigation();
  const dispatch = useDispatch();
  const hardwareWalletUsed = useSelector(isHardwareWallet);

  const smartTransactionsEnabled = useSelector(getIsStxEnabled);
  const persistedInputPrimaryDenomination = useSelector(
    getInputPrimaryDenomination,
  );
  const inputPrimaryDenomination =
    inputPrimaryDenominationOverride ?? persistedInputPrimaryDenomination;
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
  const {
    variantName: chainValueOrderVariantName,
    isActive: isChainValueOrderExperimentActive,
  } = useABTest(
    CHAIN_VALUE_ORDER_AB_KEY,
    CHAIN_VALUE_ORDER_AB_TEST_VARIANTS,
    undefined,
    { trackExposure: false },
  );
  const activeAbTests = useMemo(
    () =>
      isChainValueOrderExperimentActive
        ? [
            createActiveABTestAssignment(
              CHAIN_VALUE_ORDER_AB_KEY,
              chainValueOrderVariantName,
            ),
          ]
        : undefined,
    [chainValueOrderVariantName, isChainValueOrderExperimentActive],
  );
  // Tracks an in-flight submitBridgeTx so Promise.race timeouts cannot leave a
  // live dispatch that a hardware-wallet retry would duplicate.
  const inFlightSubmitBridgeTxRef = useRef<{
    requestId: string;
    promise: Promise<unknown>;
  } | null>(null);

  const submitQuote = async (
    quoteResponse: QuoteResponse,
    options?: { rpcTimeoutMs?: number },
  ) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const location = await getBridgeLocation();
      const intentData = quoteResponse.quote.intent;

      if (intentData) {
        await dispatch(
          submitBridgeIntent({
            quoteResponse,
            accountAddress: fromAccount.address,
            location,
            tokenSecurityTypeDestination: toToken?.securityData?.type ?? null,
            activeAbTests,
            inputPrimaryDenomination,
          }),
        );
        return;
      }

      const { requestId } = quoteResponse.quote;
      let rpcPromise =
        inFlightSubmitBridgeTxRef.current?.requestId === requestId
          ? inFlightSubmitBridgeTxRef.current?.promise
          : null;

      if (!rpcPromise) {
        rpcPromise = dispatch(
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
            activeAbTests,
            inputPrimaryDenomination,
          ),
        );
        const tracked = { requestId, promise: rpcPromise };
        inFlightSubmitBridgeTxRef.current = tracked;
        // Clear the guard when the dispatch settles, and swallow late rejections
        // after a timeout so they do not become unhandled.
        rpcPromise
          .catch(() => undefined)
          .finally(() => {
            if (inFlightSubmitBridgeTxRef.current === tracked) {
              inFlightSubmitBridgeTxRef.current = null;
            }
          });
      }

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
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const submitBridgeTransaction = async (
    quoteResponse: QuoteResponse,
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

      const destChainId = getDestChainId(quoteResponse);

      if (isCrossChain(quoteResponse.chainId, destChainId)) {
        enableMissingNetwork(destChainId);
      }
    } catch {
      setIsSubmitting(false);
      return;
    }

    if (hardwareWalletUsed && !isHardwareWalletSigningPage) {
      navigateToHwSigningPage();
      setIsSubmitting(false);
      return;
    }

    try {
      await submitQuote(quoteResponse, options);
    } catch (e) {
      captureException(e);
      if (hardwareWalletUsed && isHardwareWalletUserRejection(e)) {
        // Only user rejection should set wasTxDeclined; timeouts/disconnects must not.
        dispatch(setWasTxDeclined(true));
        if (!isHardwareWalletSigningPage) {
          navigateToBridgePage();
        }
        throw e;
      }

      if (hardwareWalletUsed) {
        throw e;
      }
    } finally {
      setIsSubmitting(false);
    }

    // Stay on the hardware-wallet signing page after submit; progress is
    // tracked by the signing-page state machine / sign tracker.
    if (isHardwareWalletSigningPage) {
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
