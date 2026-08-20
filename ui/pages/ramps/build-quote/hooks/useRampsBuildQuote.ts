import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { v4 as uuidV4 } from 'uuid';
import {
  getInternalOrderCode,
  normalizeProviderCode,
} from '@metamask/ramps-controller';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../selectors/multichain-accounts/account-tree';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
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
  } = useRampsController();

  const chainAccount = useSelector((state) =>
    selectedToken?.chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          selectedToken.chainId as CaipChainId,
        )
      : null,
  );

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
  const walletAddress = (chainAccount ?? selectedAccount)?.address ?? '';
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
    navigate(PREVIOUS_ROUTE);
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
    const checkoutSessionId = uuidV4();
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
      // trackCheckoutOpened fires from the background after the tab opens,
      // so a failed openTab does not emit a false checkout-opened event.
      await watchRampsCheckoutTab({
        url: widget.url,
        providerCode,
        walletAddress,
        orderCode,
        checkoutSessionId,
        region: userRegion?.regionCode,
        providerName: selectedProvider?.name,
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
    selectedProvider?.id,
    selectedProvider?.name,
    selectedQuote,
    t,
    userRegion?.regionCode,
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
