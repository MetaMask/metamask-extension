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
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { parseUserFacingError } from '../../../../hooks/ramps/utils/parseUserFacingError';
import {
  removePendingOrderPreview,
  setPendingOrderPreview,
} from '../../../../hooks/ramps/utils/pendingOrderPreview';
import { watchRampsCheckoutTab } from '../../../../store/controller-actions/ramps-controller';
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
  providerStatusLabel: string;
  isQuoteLoading: boolean;
  canContinue: boolean;
  handleBack: () => void;
  handlePaymentMethodPress: () => void;
  handleAmountChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleContinue: () => void;
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
    addPrecreatedOrder,
    removeOrder,
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

  const displayedQuoteError = resolveDisplayedQuoteError({
    quoteFetchErrorMessage,
    hasAmount,
    hasSettledQuoteAmount,
    selectedQuoteLoading,
    hasQuoteFetchError,
    quotesResponse,
    selectedQuote,
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
    let seededOrderId: string | undefined;
    let seededOrderCode: string | undefined;
    let checkoutWatchStarted = false;
    try {
      const widget = await getBuyWidgetData(selectedQuote);
      if (!widget?.url) {
        setContinueError(t('rampsBuyWidgetError'));
        return;
      }

      const providerCode = normalizeProviderCode(selectedProvider?.id ?? '');
      const orderAlreadyPrecreated = Boolean(widget.orderId);
      const orderCode = widget.orderId
        ? getInternalOrderCode(widget.orderId)
        : undefined;

      // Durable work first — opening a tab can unload the popup.
      if (widget.orderId && orderCode) {
        if (selectedToken) {
          setPendingOrderPreview(orderCode, {
            cryptoAmount: selectedQuote.quote?.amountOut ?? '0',
            cryptoCurrency: {
              symbol: selectedToken.symbol,
              assetId: selectedToken.assetId,
              decimals: selectedToken.decimals,
            },
            fiatAmount: Number(
              selectedQuote.quote?.amountOutInFiat ?? debouncedAmount,
            ),
            fiatCurrency: { symbol: currency },
            totalFeesFiat: Number(selectedQuote.quote?.totalFees ?? 0),
          });
        }
        await addPrecreatedOrder({
          orderId: widget.orderId,
          providerCode,
          walletAddress,
          chainId: selectedToken?.chainId,
        });
        seededOrderId = widget.orderId;
        seededOrderCode = orderCode;
      }

      const cleanupSeededOrder = async () => {
        if (!seededOrderId || !seededOrderCode) {
          return;
        }
        removePendingOrderPreview(seededOrderCode);
        await removeOrder(seededOrderId);
      };

      const openedTab = await global.platform.openTab({ url: widget.url });
      if (openedTab.id === undefined) {
        // Without a tab id the background watcher cannot detect the callback
        // redirect, so the order would never resolve.
        await cleanupSeededOrder();
        setContinueError(t('rampsBuyWidgetError'));
        return;
      }

      await watchRampsCheckoutTab({
        tabId: openedTab.id,
        providerCode,
        walletAddress,
        orderAlreadyPrecreated,
        orderCode,
      });
      checkoutWatchStarted = true;

      navigate(DEFAULT_ROUTE);
      showBuyTabOpenedToast(
        t('buyTabOpenedToastText'),
        t('buyTabOpenedToastDescription'),
      );
    } catch (error) {
      if (seededOrderId && seededOrderCode && !checkoutWatchStarted) {
        removePendingOrderPreview(seededOrderCode);
        try {
          await removeOrder(seededOrderId);
        } catch {
          // Best effort cleanup only.
        }
      }
      setContinueError(parseUserFacingError(error, t('rampsBuyWidgetError')));
    } finally {
      setIsContinuing(false);
    }
  }, [
    addPrecreatedOrder,
    canContinue,
    currency,
    debouncedAmount,
    getBuyWidgetData,
    isContinuing,
    navigate,
    removeOrder,
    selectedProvider?.id,
    selectedQuote,
    selectedToken,
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

  return {
    kind: 'ready',
    pageTitle: selectedToken.symbol
      ? t('rampsBuyToken', [selectedToken.symbol])
      : t('buy'),
    pageSubtitle: networkName ? t('rampsOnNetwork', [networkName]) : undefined,
    currencySymbol,
    amount,
    amountTextClassName: `text-[56px] font-normal leading-none ${
      displayedQuoteError ? 'text-error-default' : 'text-default'
    }`,
    paymentMethodLabel,
    showPaymentMethodSpinner:
      paymentMethodsStatus === 'loading' &&
      paymentMethods.length === 0 &&
      !selectedPaymentMethod,
    displayedQuoteError: continueError ?? displayedQuoteError,
    providerStatusLabel: providerLabel,
    isQuoteLoading: isQuoteLoading || isContinuing,
    canContinue,
    handleBack,
    handlePaymentMethodPress,
    handleAmountChange,
    handleContinue,
  };
}
