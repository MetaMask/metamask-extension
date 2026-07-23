import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  getInternalOrderCode,
  normalizeProviderCode,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import {
  RAMPS_ORDER_DETAILS_ROUTE,
  RAMPS_PAYMENT_METHOD_ROUTE,
} from '../../../../helpers/constants/routes';
import { getCurrencySymbol } from '../../../../helpers/utils/common.util';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { parseUserFacingError } from '../../../../hooks/ramps/utils/parseUserFacingError';
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
    addOrder,
    addPrecreatedOrder,
    getOrderFromCallback,
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

  // Tears down the tab listeners registered below. Kept in a ref so the
  // unmount effect can always reach the latest pair without re-running.
  const cleanupRedirectWatchRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      cleanupRedirectWatchRef.current?.();
    },
    [],
  );

  // Providers using the classic redirect/checkout flow (no precreated
  // orderId) only create the order once the user finishes checkout on their
  // hosted page and it navigates to our callback URL. Watch the tab we just
  // opened for that navigation, then resolve the order via the callback URL.
  //
  // ponytail: this listener lives for as long as this hook is mounted. If the
  // user closes the wallet UI before the checkout tab redirects, the order
  // never resolves client-side. Move this into a background service
  // (mirroring app/scripts/services/subscription/subscription-service.ts) if
  // that gap needs closing — see docs/superpowers/specs for the write-up.
  const watchForRedirectCallback = useCallback(
    (openedTabId: number, providerCode: string) => {
      // Tear down any watch still active from a prior Continue click before
      // registering a new one, so listeners never accumulate.
      cleanupRedirectWatchRef.current?.();

      const onTabUpdated = (
        tabId: number,
        changeInfo: { url?: string; pendingUrl?: string },
        tab?: { url?: string },
      ) => {
        if (tabId !== openedTabId) {
          return;
        }
        const candidateUrl =
          changeInfo.url ?? changeInfo.pendingUrl ?? tab?.url;
        if (!candidateUrl?.startsWith(getRampCallbackBaseUrl())) {
          return;
        }
        cleanupRedirectWatchRef.current?.();
        global.platform.closeTab(tabId);
        getOrderFromCallback(providerCode, candidateUrl, walletAddress)
          .then(async (order) => {
            await addOrder(order);
            const orderId = getInternalOrderCode(order);
            navigate(RAMPS_ORDER_DETAILS_ROUTE.replace(':orderId', orderId));
          })
          .catch((error) => {
            setContinueError(
              parseUserFacingError(error, t('rampsBuyWidgetError')),
            );
          });
      };

      const onTabRemoved = (tabId: number) => {
        if (tabId !== openedTabId) {
          return;
        }
        // User closed the checkout tab without finishing — not an error.
        cleanupRedirectWatchRef.current?.();
      };

      cleanupRedirectWatchRef.current = () => {
        global.platform.removeTabUpdatedListener(onTabUpdated);
        global.platform.removeTabRemovedListener(onTabRemoved);
        cleanupRedirectWatchRef.current = null;
      };

      global.platform.addTabUpdatedListener(onTabUpdated);
      global.platform.addTabRemovedListener(onTabRemoved);
    },
    [addOrder, getOrderFromCallback, navigate, t, walletAddress],
  );

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
      // Open the provider checkout in a new tab; the widget is hosted by the
      // provider, not rendered in the extension.
      const openedTab = await global.platform.openTab({ url: widget.url });
      const providerCode = normalizeProviderCode(selectedProvider?.id ?? '');
      if (widget.orderId) {
        // A provider that precreates the order returns its id — seed it so
        // the order-details page can resolve and refresh it.
        await addPrecreatedOrder({
          orderId: widget.orderId,
          providerCode,
          walletAddress,
          chainId: selectedToken?.chainId,
        });
        navigate(RAMPS_ORDER_DETAILS_ROUTE.replace(':orderId', widget.orderId));
      } else if (openedTab.id !== undefined) {
        // Redirect-flow provider — no order exists yet, wait for checkout to
        // complete and resolve it from the callback URL instead.
        watchForRedirectCallback(openedTab.id, providerCode);
      }
    } catch (error) {
      setContinueError(parseUserFacingError(error, t('rampsBuyWidgetError')));
    } finally {
      setIsContinuing(false);
    }
  }, [
    addPrecreatedOrder,
    canContinue,
    getBuyWidgetData,
    isContinuing,
    navigate,
    selectedProvider?.id,
    selectedQuote,
    selectedToken?.chainId,
    t,
    walletAddress,
    watchForRedirectCallback,
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
    // Keep the known provider visible while quotes refresh; loading is shown
    // on the Continue button instead of replacing this label.
    providerStatusLabel: providerLabel,
    isQuoteLoading: isQuoteLoading || isContinuing,
    canContinue,
    handleBack,
    handlePaymentMethodPress,
    handleAmountChange,
    handleContinue,
  };
}
