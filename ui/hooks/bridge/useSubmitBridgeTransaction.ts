import { useState, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import {
  formatChainIdToCaip,
  getQuotesReceivedProperties,
  isCrossChain,
} from '@metamask/bridge-controller';
import type { QuoteMetadata, QuoteResponse } from '@metamask/bridge-controller';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { getExtensionSkipTransactionStatusPage } from '../../../shared/lib/selectors/smart-transactions';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../shared/lib/selectors/keyring';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import { getActiveQrCodeScanRequest } from '../../selectors/selectors';
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

type PreSubmitValidationParams = {
  isHardwareWalletAccount: boolean;
  ensureDeviceReady: () => Promise<boolean>;
  fromAccount: ReturnType<typeof getFromAccount>;
  quoteResponse: QuoteResponse & QuoteMetadata;
  enableMissingNetwork: ReturnType<typeof useEnableMissingNetwork>;
};

async function validatePreSubmit({
  isHardwareWalletAccount,
  ensureDeviceReady,
  fromAccount,
  quoteResponse,
  enableMissingNetwork,
}: PreSubmitValidationParams): Promise<void> {
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
    enableMissingNetwork(formatChainIdToCaip(quoteResponse.quote.destChainId));
  }
}

type DispatchBridgeQuoteParams = {
  quoteResponse: QuoteResponse & QuoteMetadata;
  fromAccount: NonNullable<ReturnType<typeof getFromAccount>>;
  dispatch: MetaMaskReduxDispatch;
  toToken: ReturnType<typeof getToToken>;
  smartTransactionsEnabled: boolean;
  warnings: ReturnType<typeof getWarningLabels>;
  recommendedQuote: ReturnType<typeof getBridgeQuotes>['recommendedQuote'];
  fromTokenBalanceInUsd: ReturnType<typeof getFromTokenBalanceInUsd>;
  getHasSufficientGasForQuote: ReturnType<
    typeof useHasSufficientGasForQuoteForMetrics
  >;
};

async function dispatchBridgeQuote({
  quoteResponse,
  fromAccount,
  dispatch,
  toToken,
  smartTransactionsEnabled,
  warnings,
  recommendedQuote,
  fromTokenBalanceInUsd,
  getHasSufficientGasForQuote,
}: DispatchBridgeQuoteParams): Promise<void> {
  const location = await getBridgeLocation();
  const intentData = quoteResponse.quote.intent;

  if (intentData) {
    await dispatch(
      submitBridgeIntent({
        quoteResponse,
        accountAddress: fromAccount.address,
        location,
        tokenSecurityTypeDestination: toToken?.securityData?.type ?? null,
      }),
    );
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
        getHasSufficientGasForQuote(quoteResponse),
      ),
      location,
      toToken?.securityData?.type ?? null,
    ),
  );
}

type HandleBridgeSubmitErrorParams = {
  error: unknown;
  hardwareWalletUsed: boolean;
  isQrHardwareWallet: boolean;
  dispatch: MetaMaskReduxDispatch;
  navigateToBridgePage: () => void;
};

function handleBridgeSubmitError({
  error,
  hardwareWalletUsed,
  isQrHardwareWallet,
  dispatch,
  navigateToBridgePage,
}: HandleBridgeSubmitErrorParams): boolean {
  captureException(error);

  if (hardwareWalletUsed && isHardwareWalletUserRejection(error)) {
    dispatch(setWasTxDeclined(true));
    // QR rejections also update lastQrScanCompletedSuccessfully; the global
    // useNavigateOnQrScanComplete hook navigates back to the prepare page.
    if (!isQrHardwareWallet) {
      navigateToBridgePage();
    }
    return true;
  }

  if (isQrHardwareWallet) {
    navigateToBridgePage();
    return true;
  }

  return false;
}

type NavigateAfterBridgeSubmitParams = {
  isQrHardwareWallet: boolean;
  sawQrSignRequestDuringSubmit: boolean;
  toastEnabled: boolean;
  navigateToDefaultRoute: () => Promise<void>;
  navigateToActivityPage: () => void;
};

function navigateAfterBridgeSubmit({
  isQrHardwareWallet,
  sawQrSignRequestDuringSubmit,
  toastEnabled,
  navigateToDefaultRoute,
  navigateToActivityPage,
}: NavigateAfterBridgeSubmitParams): void {
  // QR hardware wallets rely on the globally-mounted
  // useNavigateOnQrScanComplete hook to navigate after the QR SIGN scan
  // lifecycle completes. Intent-based quotes can finish without triggering
  // that SIGN lifecycle, so navigate here whenever no SIGN scan was observed
  // during this submit (otherwise the global hook handles it).
  if (isQrHardwareWallet && sawQrSignRequestDuringSubmit) {
    return;
  }

  if (toastEnabled) {
    // Match the QR completion path: dispatch resetBridgeController and
    // clear bridge navigation state so a later bridge entry starts clean.
    navigateToDefaultRoute().catch(() => undefined);
    return;
  }

  navigateToActivityPage();
}

export default function useSubmitBridgeTransaction() {
  const {
    navigateToBridgePage,
    navigateToHwSigningPage,
    navigateToActivityPage,
    navigateToDefaultRoute,
  } = useBridgeNavigation();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const isQrHardwareWallet = hardwareWalletType === HardwareKeyringType.qr;
  const toastEnabled = useSelector(getExtensionSkipTransactionStatusPage);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);

  // Tracks whether a QR SIGN scan request was active at any point during the
  // current submit. QR success navigation is normally handled by the
  // globally-mounted useNavigateOnQrScanComplete hook after the SIGN lifecycle
  // completes; intent-based quotes can finish without ever triggering that
  // lifecycle, so we fall back to navigating here when no SIGN scan occurred.
  const sawQrSignRequestDuringSubmitRef = useRef(false);
  if (activeQrCodeScanRequest?.type === QrScanRequestType.SIGN) {
    sawQrSignRequestDuringSubmitRef.current = true;
  }

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
    sawQrSignRequestDuringSubmitRef.current = false;

    try {
      await validatePreSubmit({
        isHardwareWalletAccount,
        ensureDeviceReady,
        fromAccount,
        quoteResponse,
        enableMissingNetwork,
      });
    } catch {
      setIsSubmitting(false);
      return;
    }

    if (hardwareWalletUsed) {
      navigateToHwSigningPage();
      setIsSubmitting(false);
    }

    let shouldNavigateAfterSubmit = true;

    try {
      await dispatchBridgeQuote({
        quoteResponse,
        fromAccount,
        dispatch,
        toToken,
        smartTransactionsEnabled,
        warnings,
        recommendedQuote,
        fromTokenBalanceInUsd,
        getHasSufficientGasForQuote,
      });
    } catch (error) {
      shouldNavigateAfterSubmit = !handleBridgeSubmitError({
        error,
        hardwareWalletUsed,
        isQrHardwareWallet,
        dispatch,
        navigateToBridgePage,
      });
    } finally {
      setIsSubmitting(false);
    }

    if (!shouldNavigateAfterSubmit) {
      return;
    }

    navigateAfterBridgeSubmit({
      isQrHardwareWallet,
      sawQrSignRequestDuringSubmit: sawQrSignRequestDuringSubmitRef.current,
      toastEnabled,
      navigateToDefaultRoute,
      navigateToActivityPage,
    });
  };

  return {
    submitBridgeTransaction,
    isSubmitting,
  };
}
