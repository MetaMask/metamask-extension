import React, { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../../shared/lib/selectors/accounts';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import {
  BannerAlert,
  BannerAlertSeverity,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useRampsController } from '../../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { parseUserFacingError } from '../../../../hooks/ramps/utils/parseUserFacingError';
import { RAMPS_TOKEN_SELECTION_ROUTE } from '../../../../helpers/constants/routes';
import RampsTokenSelectionHeader from '../token-selection/components/ramps-token-selection-header';
import RampsPaymentMethodPill from './components/ramps-payment-method-pill';

const DEFAULT_AMOUNT = 100;
const QUOTE_DEBOUNCE_MS = 500;

function sanitizeFiatAmountInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/gu, '');
  const [whole, ...fractionParts] = cleaned.split('.');
  if (fractionParts.length === 0) {
    return whole;
  }
  return `${whole}.${fractionParts.join('')}`;
}

function parseAmountAsNumber(amount: string): number {
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RampsBuildQuoteScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const networksByCaipChainId = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );

  const {
    userRegion,
    selectedToken,
    selectedProvider,
    selectedPaymentMethod,
    paymentMethods,
    paymentMethodsStatus,
  } = useRampsController();

  const [amount, setAmount] = useState(() => String(DEFAULT_AMOUNT));
  const amountAsNumber = useMemo(() => parseAmountAsNumber(amount), [amount]);
  const debouncedAmount = useDebouncedValue(amountAsNumber, QUOTE_DEBOUNCE_MS);

  const currency = userRegion?.country?.currency ?? 'USD';
  const currencyPrefix = useMemo(() => {
    const formatted = formatCurrency(1, currency, {
      currencyDisplay: 'narrowSymbol',
    });
    const match = formatted.match(/^([^\d]*?)[\d.,]+/u);
    return match?.[1] ?? '$';
  }, [currency, formatCurrency]);

  const walletAddress = selectedAccount?.address ?? '';
  const hasAmount = amountAsNumber > 0;
  const hasSettledQuoteAmount = amountAsNumber === debouncedAmount;

  const quoteFetchEnabled = Boolean(
    walletAddress &&
      selectedPaymentMethod &&
      selectedProvider &&
      selectedToken?.assetId &&
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

  const selectedQuote = useMemo(() => {
    if (
      !quotesResponse?.success ||
      !selectedProvider ||
      !selectedPaymentMethod
    ) {
      return null;
    }

    return (
      quotesResponse.success.find(
        (quote) => quote.provider === selectedProvider.id,
      ) ?? null
    );
  }, [quotesResponse, selectedProvider, selectedPaymentMethod]);

  const networkName = selectedToken?.chainId
    ? networksByCaipChainId[selectedToken.chainId]?.name
    : undefined;

  const pageTitle = selectedToken?.symbol
    ? t('rampsBuyToken', [selectedToken.symbol])
    : t('buy');

  const pageSubtitle = networkName
    ? t('rampsOnNetwork', [networkName])
    : undefined;

  const paymentMethodLabel = useMemo(() => {
    if (
      selectedPaymentMethod &&
      (paymentMethods.length === 0 ||
        paymentMethods.some(
          (method) => method.id === selectedPaymentMethod.id,
        ))
    ) {
      return selectedPaymentMethod.name;
    }

    return paymentMethods[0]?.name ?? t('rampsSelectPaymentMethod');
  }, [paymentMethods, selectedPaymentMethod, t]);

  const showPaymentMethodSpinner =
    paymentMethodsStatus === 'loading' &&
    paymentMethods.length === 0 &&
    !selectedPaymentMethod;

  const providerLabel = selectedProvider?.name
    ? t('rampsBuyingViaProvider', [selectedProvider.name])
    : '';

  const canContinue =
    hasAmount &&
    !selectedQuoteLoading &&
    selectedQuote !== null &&
    !hasQuoteFetchError;

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(sanitizeFiatAmountInput(event.target.value));
    },
    [],
  );

  const handleContinue = useCallback(() => {
    if (!canContinue || !selectedQuote) {
      return;
    }
    return undefined;
  }, [canContinue, selectedQuote]);

  if (!selectedToken) {
    return <Navigate to={RAMPS_TOKEN_SELECTION_ROUTE} replace />;
  }

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="ramps-build-quote-screen"
    >
      <RampsTokenSelectionHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        onBack={handleBack}
      />

      <Box
        className="flex flex-1 flex-col px-4"
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box
          className="flex flex-1 flex-col items-center justify-center gap-4"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
        >
          <Box
            className="flex items-baseline justify-center gap-0.5"
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
          >
            <span
              className={`text-[56px] font-normal leading-none ${
                quoteFetchErrorMessage ? 'text-error-default' : 'text-default'
              }`}
            >
              {currencyPrefix}
            </span>
            <input
              aria-label={t('amount')}
              className={`min-w-[2ch] max-w-full border-0 bg-transparent text-center text-[56px] font-normal leading-none outline-none ${
                quoteFetchErrorMessage ? 'text-error-default' : 'text-default'
              }`}
              data-testid="ramps-build-quote-amount-input"
              inputMode="decimal"
              onChange={handleAmountChange}
              size={Math.max(amount.length, 1)}
              type="text"
              value={amount}
            />
          </Box>

          <RampsPaymentMethodPill
            label={paymentMethodLabel}
            isLoading={showPaymentMethodSpinner}
          />
        </Box>

        {quoteFetchErrorMessage ? (
          <Box className="mb-4">
            <BannerAlert
              severity={BannerAlertSeverity.Danger}
              data-testid="ramps-build-quote-error"
            >
              {quoteFetchErrorMessage}
            </BannerAlert>
          </Box>
        ) : null}

        <Box
          className="pb-4"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          {providerLabel ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              data-testid="ramps-build-quote-provider-label"
            >
              {selectedQuoteLoading && hasSettledQuoteAmount
                ? t('loading')
                : providerLabel}
            </Text>
          ) : null}

          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={handleContinue}
            isDisabled={!canContinue}
            data-testid="ramps-build-quote-continue"
          >
            {t('continue')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

export default RampsBuildQuoteScreen;
