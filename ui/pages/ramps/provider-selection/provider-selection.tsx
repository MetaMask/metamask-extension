import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { Provider } from '@metamask/ramps-controller';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { selectRampsOrdersForSelectedAccount } from '../../../selectors/rampsController';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useRampsQuotes } from '../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { completedOrdersFromRampsOrders } from '../../../hooks/ramps/utils/determinePreferredProvider';
import { parseUserFacingError } from '../../../hooks/ramps/utils/parseUserFacingError';
import Spinner from '../../../components/ui/spinner';
import { ScrollContainer } from '../../../contexts/scroll-container';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import { providerSupportsAsset } from '../utils/providerSupportsAsset';
import { getProviderLimitMessage } from '../utils/getProviderLimitMessage';
import {
  RampsProviderSeparator,
  RampsQuotesForPaymentMethodBanner,
} from './components/ramps-provider-list-helpers';
import RampsProviderListItem from './components/ramps-provider-list-item';
import {
  buildProviderListItems,
  findProviderQuote,
  getProviderTag,
} from './utils/build-provider-list-items';

type ProviderSelectionLocationState = {
  amount?: number;
};

/**
 * Ramps buy-flow provider selection screen.
 *
 * Lists providers with optional quotes for the current payment method and
 * updates controller selection before returning to payment-method.
 */
export function RampsProviderSelectionScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatCurrency } = useFormatters();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const controllerOrders = useSelector(selectRampsOrdersForSelectedAccount);
  const {
    providers,
    providersLoading,
    providersError,
    selectedProvider,
    setSelectedProvider,
    selectedPaymentMethod,
    selectedToken,
    userRegion,
  } = useRampsController();
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);

  const amount =
    (location.state as ProviderSelectionLocationState | null)?.amount ?? 0;
  const walletAddress = selectedAccount?.address ?? '';
  const assetId = selectedToken?.assetId
    ? normalizeAssetIdForApi(selectedToken.assetId)
    : '';
  const tokenSymbol = selectedToken?.symbol ?? '';
  const fiatCurrency = userRegion?.country?.currency ?? 'USD';
  const regionCode = userRegion?.regionCode ?? '';

  const ordersProviders = useMemo(
    () =>
      completedOrdersFromRampsOrders(controllerOrders).map(
        (order) => order.providerId,
      ),
    [controllerOrders],
  );

  const displayProviders = useMemo(() => {
    if (!assetId) {
      return providers;
    }
    return providers.filter((provider) =>
      providerSupportsAsset(provider, assetId),
    );
  }, [providers, assetId]);

  const providerIds = useMemo(
    () => displayProviders.map((provider) => provider.id),
    [displayProviders],
  );

  const showQuotes = amount > 0 && Boolean(selectedPaymentMethod);

  const quoteFetchParams = useMemo(
    () =>
      showQuotes && walletAddress && assetId && providerIds.length > 0
        ? {
            amount,
            walletAddress,
            assetId,
            ...(regionCode ? { region: regionCode } : {}),
            ...(fiatCurrency ? { fiat: fiatCurrency } : {}),
            redirectUrl: getRampCallbackBaseUrl(),
            providers: providerIds,
            paymentMethods: selectedPaymentMethod
              ? [selectedPaymentMethod.id]
              : undefined,
          }
        : null,
    [
      showQuotes,
      amount,
      walletAddress,
      assetId,
      regionCode,
      fiatCurrency,
      providerIds,
      selectedPaymentMethod,
    ],
  );

  const {
    data: quotes,
    loading: quotesLoading,
    error: quotesError,
  } = useRampsQuotes(quoteFetchParams);

  const quotesErrorMessage = quotesError
    ? parseUserFacingError(quotesError, t('rampsNoProvidersAvailable'))
    : null;

  const hasSuccessfulQuotes = (quotes?.success?.length ?? 0) > 0;

  const sortedListItems = useMemo(
    () =>
      buildProviderListItems({
        providers: displayProviders,
        quotes,
        quotesLoading,
        displayQuotes: showQuotes && hasSuccessfulQuotes,
        selectedTokenAssetId: assetId || undefined,
      }),
    [
      displayProviders,
      quotes,
      quotesLoading,
      showQuotes,
      hasSuccessfulQuotes,
      assetId,
    ],
  );

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleProviderSelect = useCallback(
    async (provider: Provider) => {
      if (isSelectingRef.current) {
        return;
      }

      isSelectingRef.current = true;
      setIsSelecting(true);

      try {
        await setSelectedProvider(provider);
        navigate(-1);
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [navigate, setSelectedProvider],
  );

  const title = t('rampsProviders');
  const backButtonTestId = 'ramps-provider-selection-back';

  if (providersLoading) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-provider-selection-loading"
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
      </RampsSelectionPage>
    );
  }

  if (providersError && displayProviders.length === 0) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-provider-selection-error"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage message={providersError} />
      </RampsSelectionPage>
    );
  }

  if (displayProviders.length === 0) {
    return (
      <RampsSelectionPage
        title={title}
        onBack={handleBack}
        testId="ramps-provider-selection-empty"
        backButtonTestId={backButtonTestId}
      >
        <RampsSelectionCenteredMessage
          message={t('rampsNoProvidersAvailable')}
        />
      </RampsSelectionPage>
    );
  }

  return (
    <RampsSelectionPage
      title={title}
      onBack={handleBack}
      testId="ramps-provider-selection-screen"
      backButtonTestId={backButtonTestId}
    >
      {showQuotes && selectedPaymentMethod ? (
        <RampsQuotesForPaymentMethodBanner
          paymentMethodName={selectedPaymentMethod.name}
        />
      ) : null}
      {quotesErrorMessage ? (
        <Box className="px-4 pb-2">
          <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
            {quotesErrorMessage}
          </Text>
        </Box>
      ) : null}
      <ScrollContainer className="flex-1 overflow-y-auto px-2 pb-4">
        <Box flexDirection={BoxFlexDirection.Column} gap={1}>
          {sortedListItems.map((item, index) => {
            if (item.type === 'separator') {
              return <RampsProviderSeparator key={`separator-${index}`} />;
            }

            const { provider } = item;
            const matchedQuote = findProviderQuote(
              quotes,
              provider.id,
              selectedPaymentMethod?.id,
            );
            const providerError =
              showQuotes && !quotesLoading
                ? quotes?.error?.find((entry) => entry.provider === provider.id)
                    ?.error
                : undefined;
            const isUnavailable = Boolean(providerError && !matchedQuote);
            const tag =
              !isUnavailable && showQuotes && !quotesLoading
                ? getProviderTag(provider.id, matchedQuote, ordersProviders, t)
                : null;
            const subtitle = isUnavailable
              ? (getProviderLimitMessage({
                  provider,
                  fiatCurrency,
                  paymentMethodId: selectedPaymentMethod?.id,
                  amount,
                  currency: fiatCurrency,
                  formatCurrency,
                  t,
                  backendError: providerError,
                }) ?? t('rampsQuoteUnavailable'))
              : tag;

            return (
              <RampsProviderListItem
                key={provider.id}
                provider={provider}
                isSelected={selectedProvider?.id === provider.id}
                isDisabled={isSelecting || isUnavailable}
                subtitle={subtitle}
                showQuote={showQuotes}
                quote={matchedQuote}
                quoteLoading={quotesLoading}
                currency={fiatCurrency}
                tokenSymbol={tokenSymbol}
                onClick={() => {
                  handleProviderSelect(provider).catch(() => undefined);
                }}
              />
            );
          })}
        </Box>
      </ScrollContainer>
    </RampsSelectionPage>
  );
}

export default RampsProviderSelectionScreen;
