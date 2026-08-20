import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import type { Provider, QuotesResponse } from '@metamask/ramps-controller';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../selectors/multichain-accounts/account-tree';
import { selectRampsOrdersForSelectedAccount } from '../../../selectors/rampsController';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsController } from '../../../hooks/ramps/useRampsController';
import { useRampsAnalytics } from '../../../hooks/ramps/useRampsAnalytics';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import { useRampsQuotes } from '../../../hooks/ramps/useRampsQuotes';
import { getRampCallbackBaseUrl } from '../../../hooks/ramps/utils/getRampCallbackBaseUrl';
import { normalizeAssetIdForApi } from '../../../hooks/ramps/utils/normalizeAssetIdForApi';
import { completedOrdersFromRampsOrders } from '../../../hooks/ramps/utils/determinePreferredProvider';
import { parseUserFacingError } from '../../../hooks/ramps/utils/parseUserFacingError';
import { ScrollContainer } from '../../../contexts/scroll-container';
import RampsListSkeleton from '../components/ramps-list-skeleton';
import {
  RampsSelectionCenteredMessage,
  RampsSelectionPage,
} from '../components/ramps-selection-page';
import { providerSupportsAsset } from '../utils/providerSupportsAsset';
import { RampsQuotesForPaymentMethodBanner } from './components/ramps-provider-list-helpers';
import RampsProviderListItem from './components/ramps-provider-list-item';
import {
  buildProviderListItems,
  findProviderQuote,
  getProviderTag,
  type ProviderListItem,
  type ProviderTag,
} from './utils/build-provider-list-items';

type ProviderSelectionLocationState = {
  amount?: number;
};

type ProviderListRow = {
  key: string;
  provider: Provider;
  isSelected: boolean;
  isDisabled: boolean;
  tag: ProviderTag | null;
  showQuote: boolean;
  quote: ReturnType<typeof findProviderQuote>;
  quoteLoading: boolean;
  currency: string;
  tokenSymbol: string;
};

/**
 * Builds render-ready rows from providers with available quotes.
 * @param options0
 * @param options0.sortedListItems
 * @param options0.quotes
 * @param options0.quotesLoading
 * @param options0.showQuotes
 * @param options0.selectedProviderId
 * @param options0.selectedPaymentMethodId
 * @param options0.ordersProviders
 * @param options0.isSelecting
 * @param options0.fiatCurrency
 * @param options0.tokenSymbol
 * @param options0.t
 */
function buildProviderListRows({
  sortedListItems,
  quotes,
  quotesLoading,
  showQuotes,
  selectedProviderId,
  selectedPaymentMethodId,
  ordersProviders,
  isSelecting,
  fiatCurrency,
  tokenSymbol,
  t,
}: {
  sortedListItems: ProviderListItem[];
  quotes: QuotesResponse | null;
  quotesLoading: boolean;
  showQuotes: boolean;
  selectedProviderId: string | undefined;
  selectedPaymentMethodId: string | undefined;
  ordersProviders: string[];
  isSelecting: boolean;
  fiatCurrency: string;
  tokenSymbol: string;
  t: ReturnType<typeof useI18nContext>;
}): ProviderListRow[] {
  return sortedListItems.map((item) => {
    const { provider } = item;
    const matchedQuote = findProviderQuote(
      quotes,
      provider.id,
      selectedPaymentMethodId,
    );
    const tag =
      showQuotes && !quotesLoading
        ? getProviderTag(provider.id, matchedQuote, ordersProviders, t)
        : null;

    return {
      key: provider.id,
      provider,
      isSelected: selectedProviderId === provider.id,
      isDisabled: isSelecting,
      tag,
      showQuote: showQuotes,
      quote: matchedQuote,
      quoteLoading: quotesLoading,
      currency: fiatCurrency,
      tokenSymbol,
    };
  });
}

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
  const { trackProviderSelected } = useRampsAnalytics();
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

  useRampsScreenViewed('Provider Selection');

  const amount =
    (location.state as ProviderSelectionLocationState | null)?.amount ?? 0;
  const walletAddress = (chainAccount ?? selectedAccount)?.address ?? '';
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

  const sortedListItems = useMemo(
    () =>
      buildProviderListItems({
        providers: displayProviders,
        quotes,
        quotesLoading,
        displayQuotes: showQuotes,
      }),
    [displayProviders, quotes, quotesLoading, showQuotes],
  );

  const listRows = useMemo(
    () =>
      buildProviderListRows({
        sortedListItems,
        quotes,
        quotesLoading,
        showQuotes,
        selectedProviderId: selectedProvider?.id,
        selectedPaymentMethodId: selectedPaymentMethod?.id,
        ordersProviders,
        isSelecting,
        fiatCurrency,
        tokenSymbol,
        t,
      }),
    [
      sortedListItems,
      quotes,
      quotesLoading,
      showQuotes,
      selectedProvider?.id,
      selectedPaymentMethod?.id,
      ordersProviders,
      isSelecting,
      fiatCurrency,
      tokenSymbol,
      t,
    ],
  );

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
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
        trackProviderSelected({
          provider: provider.name,
          previousProvider: selectedProvider?.name,
          location: 'Provider Selection',
        });
        navigate(PREVIOUS_ROUTE);
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [
      navigate,
      selectedProvider?.name,
      setSelectedProvider,
      trackProviderSelected,
    ],
  );

  const title = t('rampsProviders');
  const backButtonTestId = 'ramps-provider-selection-back';

  let testId = 'ramps-provider-selection-screen';
  let body: React.ReactNode;

  if (providersLoading) {
    testId = 'ramps-provider-selection-loading';
    body = <RampsListSkeleton testId="ramps-provider-selection-skeleton" />;
  } else if (providersError && displayProviders.length === 0) {
    testId = 'ramps-provider-selection-error';
    body = <RampsSelectionCenteredMessage message={providersError} />;
  } else if (
    displayProviders.length === 0 ||
    (quotes && !quotesLoading && listRows.length === 0)
  ) {
    testId = 'ramps-provider-selection-empty';
    body = (
      <RampsSelectionCenteredMessage message={t('rampsNoProvidersAvailable')} />
    );
  } else {
    body = (
      <>
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
        <ScrollContainer className="flex-1 overflow-y-auto pb-4">
          <Box flexDirection={BoxFlexDirection.Column}>
            {listRows.map((row) => (
              <RampsProviderListItem
                key={row.key}
                provider={row.provider}
                isSelected={row.isSelected}
                isDisabled={row.isDisabled}
                tag={row.tag}
                showQuote={row.showQuote}
                quote={row.quote}
                quoteLoading={row.quoteLoading}
                currency={row.currency}
                tokenSymbol={row.tokenSymbol}
                onClick={() => {
                  handleProviderSelect(row.provider).catch(() => undefined);
                }}
              />
            ))}
          </Box>
        </ScrollContainer>
      </>
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
    </RampsSelectionPage>
  );
}

export default RampsProviderSelectionScreen;
