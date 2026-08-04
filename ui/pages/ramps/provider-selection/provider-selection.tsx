import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Provider, QuotesResponse } from '@metamask/ramps-controller';
import {
  Box,
  BoxFlexDirection,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
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
import { ScrollContainer } from '../../../contexts/scroll-container';
import RampsListSkeleton from '../components/ramps-list-skeleton';
import { RampsSelectionCenteredMessage } from '../components/ramps-selection-page';
import { providerSupportsAsset } from '../utils/providerSupportsAsset';
import { getProviderLimitMessage } from '../utils/getProviderLimitMessage';
import { RampsProviderSeparator } from './components/ramps-provider-list-helpers';
import RampsProviderListItem from './components/ramps-provider-list-item';
import {
  buildProviderListItems,
  findProviderQuote,
  getProviderTag,
  type ProviderListItem,
  type ProviderTag,
} from './utils/build-provider-list-items';

export type RampsProviderSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
};

type ProviderListRow =
  | { type: 'separator'; key: string }
  | {
      type: 'provider';
      key: string;
      provider: Provider;
      isSelected: boolean;
      isDisabled: boolean;
      tag: ProviderTag | null;
      subtitle: string | null;
      showQuote: boolean;
      quote: ReturnType<typeof findProviderQuote>;
      quoteLoading: boolean;
      currency: string;
      tokenSymbol: string;
    };

/**
 * Builds render-ready rows from sorted list items (tags, quotes, unavailable).
 * @param options0
 * @param options0.sortedListItems
 * @param options0.quotes
 * @param options0.quotesLoading
 * @param options0.showQuotes
 * @param options0.selectedProviderId
 * @param options0.selectedPaymentMethodId
 * @param options0.ordersProviders
 * @param options0.isSelecting
 * @param options0.amount
 * @param options0.fiatCurrency
 * @param options0.tokenSymbol
 * @param options0.formatCurrency
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
  amount,
  fiatCurrency,
  tokenSymbol,
  formatCurrency,
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
  amount: number;
  fiatCurrency: string;
  tokenSymbol: string;
  formatCurrency: ReturnType<typeof useFormatters>['formatCurrency'];
  t: ReturnType<typeof useI18nContext>;
}): ProviderListRow[] {
  return sortedListItems.map((item, index) => {
    if (item.type === 'separator') {
      return { type: 'separator', key: `separator-${index}` };
    }

    const { provider } = item;
    const matchedQuote = findProviderQuote(
      quotes,
      provider.id,
      selectedPaymentMethodId,
    );
    const providerError =
      showQuotes && !quotesLoading
        ? quotes?.error?.find((entry) => entry.provider === provider.id)?.error
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
          paymentMethodId: selectedPaymentMethodId,
          amount,
          currency: fiatCurrency,
          formatCurrency,
          t,
        }) ?? t('rampsQuoteUnavailable'))
      : null;

    return {
      type: 'provider',
      key: provider.id,
      provider,
      isSelected: selectedProviderId === provider.id,
      isDisabled: isSelecting,
      tag,
      subtitle,
      showQuote: showQuotes,
      quote: matchedQuote,
      quoteLoading: quotesLoading,
      currency: fiatCurrency,
      tokenSymbol,
    };
  });
}

/**
 * Ramps buy-flow provider selection modal.
 *
 * Lists providers with optional quotes for the current payment method and
 * updates controller selection, overlaid on whichever screen opened it.
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.amount
 */
export function RampsProviderSelectionModal({
  isOpen,
  onClose,
  amount,
}: RampsProviderSelectionModalProps) {
  const t = useI18nContext();
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
        amount,
        fiatCurrency,
        tokenSymbol,
        formatCurrency,
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
      amount,
      fiatCurrency,
      tokenSymbol,
      formatCurrency,
      t,
    ],
  );

  const handleProviderSelect = useCallback(
    async (provider: Provider) => {
      if (isSelectingRef.current) {
        return;
      }

      isSelectingRef.current = true;
      setIsSelecting(true);

      try {
        await setSelectedProvider(provider);
        onClose();
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [onClose, setSelectedProvider],
  );

  const title = t('rampsChooseProvider');

  let testId = 'ramps-provider-selection-screen';
  let body: React.ReactNode;

  if (providersLoading) {
    testId = 'ramps-provider-selection-loading';
    body = <RampsListSkeleton testId="ramps-provider-selection-skeleton" />;
  } else if (providersError && displayProviders.length === 0) {
    testId = 'ramps-provider-selection-error';
    body = <RampsSelectionCenteredMessage message={providersError} />;
  } else if (displayProviders.length === 0) {
    testId = 'ramps-provider-selection-empty';
    body = (
      <RampsSelectionCenteredMessage message={t('rampsNoProvidersAvailable')} />
    );
  } else {
    body = (
      <>
        {quotesErrorMessage ? (
          <Box className="px-4 pb-2">
            <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
              {quotesErrorMessage}
            </Text>
          </Box>
        ) : null}
        <ScrollContainer className="flex-1 overflow-y-auto pb-4">
          <Box flexDirection={BoxFlexDirection.Column}>
            {listRows.map((row) =>
              row.type === 'separator' ? (
                <RampsProviderSeparator key={row.key} />
              ) : (
                <RampsProviderListItem
                  key={row.key}
                  provider={row.provider}
                  isSelected={row.isSelected}
                  isDisabled={row.isDisabled}
                  tag={row.tag}
                  subtitle={row.subtitle}
                  showQuote={row.showQuote}
                  quote={row.quote}
                  quoteLoading={row.quoteLoading}
                  currency={row.currency}
                  tokenSymbol={row.tokenSymbol}
                  onClick={() => {
                    handleProviderSelect(row.provider).catch(() => undefined);
                  }}
                />
              ),
            )}
          </Box>
        </ScrollContainer>
      </>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Sm}
        className="items-center"
        modalDialogProps={{
          className: 'border-0',
          'data-testid': testId,
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          <Text variant={TextVariant.HeadingSm} textAlign={TextAlign.Center}>
            {title}
          </Text>
        </ModalHeader>
        {body}
      </ModalContent>
    </Modal>
  );
}

export default RampsProviderSelectionModal;
