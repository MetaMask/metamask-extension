import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  normalizeProviderCode,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import {
  DEFAULT_ROUTE,
  RAMPS_PAYMENT_METHOD_ROUTE,
} from '../../../../helpers/constants/routes';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import { showBuyTabOpenedToast } from '../../../../helpers/utils/show-buy-tab-opened-toast';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { parseUserFacingError } from '../../../../hooks/ramps/utils/parseUserFacingError';
import { watchRampsCheckoutTab } from '../../../../store/controller-actions/ramps-controller';
import { getProviderLimitMessage } from '../../utils/getProviderLimitMessage';
import {
  findSelectedQuote,
  isTokenStateSettled,
  resolveBuildQuoteViewKind,
  resolveCanContinue,
  resolveDisplayedQuoteError,
  resolvePaymentMethodLabel,
} from '../utils/build-quote';
import { useBuildQuoteAmount } from './useBuildQuoteAmount';

type BuildQuoteLocationState = {
  assetId?: string;
};

export type RampsBuildQuoteReadyViewModel = {
  kind: 'ready';
  pageTitle: string;
  pageSubtitle?: string;
  currencySymbol: string;
  amount: string;
  amountTextClassName: string;
  paymentMethodLabel: string;
  showPaymentMethodSpinner: boolean;
  displayedQuoteError: string | null;
  quoteErrorLink: { label: string; onClick: () => void } | null;
  providerStatusLabel: string;
  isQuoteLoading: boolean;
  canContinue: boolean;
  isWeeklyLimitModalOpen: boolean;
  isProviderSelectionModalOpen: boolean;
  providerSelectionModalAmount: number;
  providerSupportUrl: string | null;
  providerName: string;
  handleBack: () => void;
  handlePaymentMethodPress: () => void;
  handleAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleContinue: () => void;
  handleCloseWeeklyLimitModal: () => void;
  handleCloseProviderSelectionModal: () => void;
  handleContactProviderSupport: () => void;
};

export type RampsBuildQuoteViewModel =
  | { kind: 'loading' }
  | { kind: 'redirect' }
  | RampsBuildQuoteReadyViewModel;

export function useRampsBuildQuote(): RampsBuildQuoteViewModel {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const networksByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const {
    userRegion,
    selectedToken,
    tokensLoading,
    selectedProvider,
    selectedPaymentMethod,
    paymentMethods,
    paymentMethodsStatus,
    getBuyWidgetData,
  } = useRampsController();

  const intentAssetId = (location.state as BuildQuoteLocationState | null)
    ?.assetId;
  const tokenStateIsSettled = isTokenStateSettled(
    intentAssetId,
    selectedToken?.assetId,
  );

  const { amount, amountAsNumber, debouncedAmount, handleAmountChange } =
    useBuildQuoteAmount(userRegion?.country?.defaultAmount);

  const currency = userRegion?.country?.currency ?? 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const walletAddress = selectedAccount?.address ?? '';
  const hasAmount = amountAsNumber > 0;
  const hasSettledQuoteAmount = amountAsNumber === debouncedAmount;

  const quoteFetchEnabled = Boolean(
    walletAddress &&
    selectedPaymentMethod &&
    selectedProvider &&
    selectedToken?.assetId &&
    tokenStateIsSettled &&
    debouncedAmount > 0,
  );

  const quoteFetchParams = useMemo(
    () =>
      quoteFetchEnabled
        ? {
            assetId: normalizeAssetIdForApi(selectedToken?.assetId),
            amount: debouncedAmount,
            walletAddress,
            redirectUrl: getRampCallbackBaseUrl(),
            paymentMethods: [selectedPaymentMethod?.id ?? ''],
            providers: [selectedProvider?.id ?? ''],
          }
        : null,
    [
      debouncedAmount,
      quoteFetchEnabled,
      selectedPaymentMethod?.id,
      selectedProvider?.id,
      selectedToken?.assetId,
      walletAddress,
    ],
  );

  const {
    data: quotesResponse,
    loading: selectedQuoteLoading,
    error: quoteFetchError,
  } = useRampsQuotes(quoteFetchParams);

  const hasQuoteFetchError = quoteFetchError !== null;
  const quoteFetchErrorMessage = hasQuoteFetchError
    ? parseUserFacingError(quoteFetchError, t('rampsQuoteFetchError'))
    : null;

  const selectedQuote = useMemo(
    () =>
      findSelectedQuote(
        quotesResponse,
        selectedProvider,
        selectedPaymentMethod,
      ),
    [quotesResponse, selectedProvider, selectedPaymentMethod],
  );

  const { formatCurrency } = useFormatters();

  const limitMessage = getProviderLimitMessage({
    provider: selectedProvider,
    fiatCurrency: currency,
    paymentMethodId: selectedPaymentMethod?.id,
    amount: debouncedAmount,
    currency,
    formatCurrency,
    t,
  });

  const displayedQuoteError = resolveDisplayedQuoteError({
    quoteFetchErrorMessage,
    hasAmount,
    hasSettledQuoteAmount,
    selectedQuoteLoading,
    hasQuoteFetchError,
    quotesResponse,
    selectedQuote,
    limitMessage,
    t,
  });

  const paymentMethodLabel = useMemo(
    () =>
      resolvePaymentMethodLabel(
        paymentMethods,
        selectedPaymentMethod,
        t('rampsSelectPaymentMethod'),
      ),
    [paymentMethods, selectedPaymentMethod, t],
  );

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handlePaymentMethodPress = useCallback(() => {
    navigate(RAMPS_PAYMENT_METHOD_ROUTE, {
      state: { amount: debouncedAmount },
    });
  }, [debouncedAmount, navigate]);

  const [isProviderSelectionModalOpen, setIsProviderSelectionModalOpen] =
    useState(false);

  const handleChangeProviderPress = useCallback(() => {
    setIsProviderSelectionModalOpen(true);
  }, []);

  const handleCloseProviderSelectionModal = useCallback(() => {
    setIsProviderSelectionModalOpen(false);
  }, []);

  const [isWeeklyLimitModalOpen, setIsWeeklyLimitModalOpen] = useState(false);

  const handleCloseWeeklyLimitModal = useCallback(() => {
    setIsWeeklyLimitModalOpen(false);
  }, []);

  const providerSupportUrl =
    selectedProvider?.links?.find((link) => /support/iu.test(link.name))?.url ??
    null;

  const handleContactProviderSupport = useCallback(() => {
    if (providerSupportUrl) {
      global.platform.openTab({ url: providerSupportUrl });
    }
  }, [providerSupportUrl]);

  const canContinue = resolveCanContinue({
    hasAmount,
    hasSettledQuoteAmount,
    selectedQuoteLoading,
    selectedQuote,
    hasQuoteFetchError,
  });

  const [isContinuing, setIsContinuing] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  const handleContinue = useCallback(async () => {
    if (!canContinue || !selectedQuote || isContinuing) {
      return;
    }
    setContinueError(null);
    setIsContinuing(true);
    try {
      const widget = await getBuyWidgetData(selectedQuote);
      if (!widget?.url) {
        setContinueError(t('rampsBuyWidgetError'));
        return;
      }

      const providerCode = normalizeProviderCode(selectedProvider?.id ?? '');
      const orderCode = widget.orderId
        ? getInternalOrderCode(widget.orderId)
        : undefined;

      // Open + watch in the background so popup-mode UI can close when the
      // provider tab opens without losing the callback listener.
      await watchRampsCheckoutTab({
        url: widget.url,
        providerCode,
        walletAddress,
        orderCode,
      });

      navigate(DEFAULT_ROUTE);
      showBuyTabOpenedToast(
        t('buyTabOpenedToastText'),
        t('buyTabOpenedToastDescription'),
      );
    } catch (error) {
      setContinueError(parseUserFacingError(error, t('rampsBuyWidgetError')));
    } finally {
      setIsContinuing(false);
    }
  }, [
    canContinue,
    getBuyWidgetData,
    isContinuing,
    navigate,
    selectedProvider,
    selectedQuote,
    t,
    walletAddress,
  ]);

  const viewKind = resolveBuildQuoteViewKind({
    intentAssetId,
    selectedTokenAssetId: selectedToken?.assetId,
    tokensLoading,
  });

  if (viewKind === 'loading') {
    return { kind: 'loading' };
  }

  if (viewKind === 'redirect' || !selectedToken) {
    return { kind: 'redirect' };
  }

  const networkName = selectedToken.chainId
    ? networksByCaipChainId[selectedToken.chainId]?.name
    : undefined;

  const providerLabel = selectedProvider?.name
    ? t('rampsBuyingViaProvider', [selectedProvider.name])
    : '';
  const isQuoteLoading = selectedQuoteLoading && hasSettledQuoteAmount;

  // `continueError` has no follow-up affordance, so it suppresses the
  // quote error's link along with its copy.
  const resolvedError = continueError
    ? { message: continueError }
    : displayedQuoteError;

  let quoteErrorLink: RampsBuildQuoteReadyViewModel['quoteErrorLink'] = null;
  if (resolvedError?.action === 'weeklyLimit') {
    quoteErrorLink = {
      label: t('learnMoreUpperCase'),
      onClick: () => setIsWeeklyLimitModalOpen(true),
    };
  } else if (resolvedError?.action === 'changeProvider') {
    quoteErrorLink = {
      label: t('rampsChangeProvidersLink'),
      onClick: handleChangeProviderPress,
    };
  }

  return {
    kind: 'ready',
    pageTitle: selectedToken.symbol
      ? t('rampsBuyToken', [selectedToken.symbol])
      : t('buy'),
    pageSubtitle: networkName ? t('rampsOnNetwork', [networkName]) : undefined,
    currencySymbol,
    amount,
    amountTextClassName: `text-[56px] font-normal leading-none ${
      resolvedError ? 'text-error-default' : 'text-default'
    }`,
    paymentMethodLabel,
    showPaymentMethodSpinner:
      paymentMethodsStatus === 'loading' &&
      paymentMethods.length === 0 &&
      !selectedPaymentMethod,
    displayedQuoteError: resolvedError?.message ?? null,
    quoteErrorLink,
    providerStatusLabel: providerLabel,
    isQuoteLoading: isQuoteLoading || isContinuing,
    canContinue,
    isWeeklyLimitModalOpen,
    isProviderSelectionModalOpen,
    providerSelectionModalAmount: debouncedAmount,
    providerSupportUrl,
    providerName: selectedProvider?.name ?? '',
    handleBack,
    handlePaymentMethodPress,
    handleAmountChange,
    handleContinue,
    handleCloseWeeklyLimitModal,
    handleCloseProviderSelectionModal,
    handleContactProviderSupport,
  };
}
