import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { PaymentMethod } from '@metamask/ramps-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { RAMPS_PROVIDER_SELECTION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import Spinner from '../../../components/ui/spinner';
import { ScrollContainer } from '../../../contexts/scroll-container';
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
  const formatFiat = useFiatFormatter({ overrideCurrency: fiatCurrency });
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);

  const amount =
    (location.state as PaymentMethodLocationState | null)?.amount ?? 0;
  const walletAddress = selectedAccount?.address ?? '';
  const assetId = selectedToken?.assetId
    ? normalizeAssetIdForApi(selectedToken.assetId)
    : '';
  const tokenSymbol = selectedToken?.symbol ?? '';

  const paymentMethodIds = useMemo(
    () => paymentMethods.map((paymentMethod) => paymentMethod.id),
    [paymentMethods],
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
            redirectUrl: getRampCallbackBaseUrl(),
            providers: selectedProvider ? [selectedProvider.id] : undefined,
            paymentMethods: paymentMethodIds,
          }
        : null,
    [
      amount,
      walletAddress,
      assetId,
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
    navigate(-1);
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
        navigate(-1);
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [navigate, setSelectedPaymentMethod],
  );

  const title = t('rampsSelectPaymentMethod');
  const backButtonTestId = 'ramps-payment-method-back';
  const changeProviderFooter = selectedProvider ? (
    <RampsChangeProviderFooter
      providerName={selectedProvider.name}
      isDisabled={Boolean(paymentMethodsError)}
      onChangeProvider={handleChangeProvider}
    />
  ) : null;

  // Prerequisites missing — query stays disabled until the user leaves.
  if (paymentMethodsStatus === 'idle') {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-empty"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsNoPaymentMethodsAvailable')}
        />
        {changeProviderFooter}
      </RampsSelectionPage>
    );
  }

  if (paymentMethodsLoading) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-loading"
        backButtonTestId={backButtonTestId}
      >
        <Box
          className="flex-1"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
        >
          <Spinner className="h-8 w-8" />
        </Box>
        {changeProviderFooter}
      </RampsSelectionPage>
    );
  }

  if (showError) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-error"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsErrorLoadingPaymentMethods')}
        />
        {changeProviderFooter}
      </RampsSelectionPage>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-payment-method-empty"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsNoPaymentMethodsAvailable')}
        />
        {changeProviderFooter}
      </RampsSelectionPage>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId="ramps-payment-method-screen"
      backButtonTestId={backButtonTestId}
    >
      <ScrollContainer className="flex-1 overflow-y-auto px-2 pb-4">
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
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
                isDisabled={isSelecting || hasQuoteError}
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
      {changeProviderFooter}
    </RampsSelectionPage>
  );
}

export default RampsPaymentMethodScreen;
