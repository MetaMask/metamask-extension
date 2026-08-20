import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import {
  RampsOrderStatus,
  type PaymentMethod,
} from '@metamask/ramps-controller';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { selectRampsOrdersForSelectedAccount } from '../../../selectors/rampsController';
import {
  PREVIOUS_ROUTE,
  RAMPS_PROVIDER_SELECTION_ROUTE,
} from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import { useRampsQuotes } from '../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { ScrollContainer } from '../../../contexts/scroll-container';
import RampsListSkeleton from '../components/ramps-list-skeleton';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import RampsChangeProviderFooter from './components/ramps-change-provider-footer';
import RampsPaymentMethodListItem from './components/ramps-payment-method-list-item';
import {
  formatPaymentMethodLimits,
  getProviderBuyLimit,
} from './utils/format-payment-method-limits';

type PaymentMethodLocationState = {
  amount?: number;
};

/**
 * Ramps buy-flow payment method selection screen.
 *
 * Lists available payment methods for the selected provider/region and
 * updates controller selection before returning to build-quote.
 */
export function RampsPaymentMethodScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const controllerOrders = useSelector(selectRampsOrdersForSelectedAccount);
  const {
    paymentMethods,
    paymentMethodsLoading,
    paymentMethodsStatus,
    paymentMethodsError,
    selectedPaymentMethod,
    selectedProvider,
    selectedToken,
    userRegion,
    setSelectedPaymentMethod,
  } = useRampsController();
  const fiatCurrency = userRegion?.country?.currency ?? 'USD';
  const regionCode = userRegion?.regionCode ?? '';
  const formatFiat = useFiatFormatter({ overrideCurrency: fiatCurrency });
  useRampsScreenViewed('Payment Method');
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);

  const chainAccount = useSelector((state) =>
    selectedToken?.chainId
      ? getInternalAccountBySelectedAccountGroupAndCaip(
          state,
          selectedToken.chainId as CaipChainId,
        )
      : null,
  );

  const amount =
    (location.state as PaymentMethodLocationState | null)?.amount ?? 0;
  const walletAddress = (chainAccount ?? selectedAccount)?.address ?? '';
  const assetId = selectedToken?.assetId
    ? normalizeAssetIdForApi(selectedToken.assetId)
    : '';
  const tokenSymbol = selectedToken?.symbol ?? '';

  const paymentMethodIds = useMemo(
    () => paymentMethods.map((paymentMethod) => paymentMethod.id),
    [paymentMethods],
  );

  // Mirrors the provider list's "Previously used" pill, sourced the same way:
  // payment methods the user has already completed an order with.
  const previouslyUsedPaymentMethodIds = useMemo(
    () =>
      controllerOrders
        .filter((order) => order.status === RampsOrderStatus.Completed)
        .map((order) => order.paymentMethod?.id)
        .filter((id): id is string => Boolean(id)),
    [controllerOrders],
  );

  const quoteFetchParams = useMemo(
    () =>
      amount > 0 &&
      walletAddress &&
      assetId &&
      !paymentMethodsLoading &&
      paymentMethodIds.length > 0
        ? {
            amount,
            walletAddress,
            assetId,
            ...(regionCode ? { region: regionCode } : {}),
            ...(fiatCurrency ? { fiat: fiatCurrency } : {}),
            redirectUrl: getRampCallbackBaseUrl(),
            providers: selectedProvider ? [selectedProvider.id] : undefined,
            paymentMethods: paymentMethodIds,
          }
        : null,
    [
      amount,
      walletAddress,
      assetId,
      regionCode,
      fiatCurrency,
      selectedProvider,
      paymentMethodIds,
      paymentMethodsLoading,
    ],
  );

  const { data: quotes, loading: quotesLoading } =
    useRampsQuotes(quoteFetchParams);

  // Keep cached methods visible if a background refetch fails.
  const showError = Boolean(paymentMethodsError) && paymentMethods.length === 0;

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  const handleChangeProvider = useCallback(() => {
    navigate(RAMPS_PROVIDER_SELECTION_ROUTE, {
      state: { amount },
    });
  }, [amount, navigate]);

  const handlePaymentMethodSelect = useCallback(
    async (paymentMethod: PaymentMethod) => {
      if (isSelectingRef.current) {
        return;
      }

      isSelectingRef.current = true;
      setIsSelecting(true);

      try {
        await setSelectedPaymentMethod(paymentMethod);
        navigate(PREVIOUS_ROUTE);
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [navigate, setSelectedPaymentMethod],
  );

  const title = t('rampsPayWith');
  const backButtonTestId = 'ramps-payment-method-back';

  let testId = 'ramps-payment-method-screen';
  let body: React.ReactNode;

  // Prerequisites missing — query stays disabled until the user leaves.
  if (paymentMethodsStatus === 'idle') {
    testId = 'ramps-payment-method-empty';
    body = (
      <RampsSelectionCenteredMessage
        message={t('rampsNoPaymentMethodsAvailable')}
      />
    );
  } else if (paymentMethodsLoading) {
    testId = 'ramps-payment-method-loading';
    body = (
      <RampsListSkeleton showAvatar testId="ramps-payment-method-skeleton" />
    );
  } else if (showError) {
    testId = 'ramps-payment-method-error';
    body = (
      <RampsSelectionCenteredMessage
        message={t('rampsErrorLoadingPaymentMethods')}
      />
    );
  } else if (paymentMethods.length === 0) {
    testId = 'ramps-payment-method-empty';
    body = (
      <RampsSelectionCenteredMessage
        message={t('rampsNoPaymentMethodsAvailable')}
      />
    );
  } else {
    body = (
      <ScrollContainer className="flex-1 overflow-y-auto pb-4">
        <Box flexDirection={BoxFlexDirection.Column}>
          {paymentMethods.map((paymentMethod) => {
            const matchedQuote =
              quotes?.success?.find(
                (quote) => quote.quote?.paymentMethod === paymentMethod.id,
              ) ?? null;
            const hasQuoteError =
              !quotesLoading && quotes !== null && matchedQuote === null;
            const quoteErrorMessage = hasQuoteError
              ? t('rampsQuoteUnavailable')
              : undefined;

            return (
              <RampsPaymentMethodListItem
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                isSelected={selectedPaymentMethod?.id === paymentMethod.id}
                isDisabled={isSelecting}
                isPreviouslyUsed={previouslyUsedPaymentMethodIds.includes(
                  paymentMethod.id,
                )}
                limitText={formatPaymentMethodLimits(
                  getProviderBuyLimit(
                    selectedProvider,
                    fiatCurrency,
                    paymentMethod.id,
                  ),
                  formatFiat,
                  t,
                )}
                showQuote={amount > 0}
                quote={matchedQuote}
                quoteLoading={quotesLoading}
                quoteError={hasQuoteError}
                quoteErrorMessage={quoteErrorMessage}
                currency={fiatCurrency}
                tokenSymbol={tokenSymbol}
                onClick={() => {
                  handlePaymentMethodSelect(paymentMethod).catch(
                    () => undefined,
                  );
                }}
              />
            );
          })}
        </Box>
      </ScrollContainer>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId={testId}
      backButtonTestId={backButtonTestId}
    >
      {body}
      {selectedProvider ? (
        <RampsChangeProviderFooter
          providerName={selectedProvider.name}
          isDisabled={isSelecting}
          onChangeProvider={handleChangeProvider}
        />
      ) : null}
    </RampsSelectionPage>
  );
}

export default RampsPaymentMethodScreen;
