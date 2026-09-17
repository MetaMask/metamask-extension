import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import type { Provider, QuotesResponse } from '@metamask/ramps-controller';
import {
  Box,
  BoxFlexDirection,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
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
import { RampsSelectionCenteredMessage } from '../components/ramps-selection-page';
import { providerSupportsAsset } from '../utils/providerSupportsAsset';
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
 * Ramps buy-flow provider selection modal.
 *
 * Lists providers with optional quotes for the current payment method and
 * updates controller selection before closing back to payment-method.
 *
 * @param options0
 * @param options0.isOpen
 * @param options0.onClose
 * @param options0.amount
 */
export function RampsProviderSelectionModal({
  isOpen,
  onClose,
  amount = 0,
}: RampsProviderSelectionModalProps) {
  const t = useI18nContext();
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
      isOpen && showQuotes && walletAddress && assetId && providerIds.length > 0
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
      isOpen,
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
        isSelectingRef.current = false;
        setIsSelecting(false);
        onClose();
      } catch {
        isSelectingRef.current = false;
        setIsSelecting(false);
      }
    },
    [
      onClose,
      selectedProvider?.name,
      setSelectedProvider,
      trackProviderSelected,
    ],
  );

  let testId = 'ramps-provider-selection-modal';
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
        {quotesErrorMessage ? (
          <Box className="px-4 pb-2">
            <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
              {quotesErrorMessage}
            </Text>
          </Box>
        ) : null}
        <ScrollContainer className="max-h-[60vh] overflow-y-auto">
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
    >
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Md}
        className="items-center"
        modalDialogProps={{
          'data-testid': testId,
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            ariaLabel: t('close'),
            'data-testid': 'ramps-provider-selection-close',
          }}
        >
          {t('rampsChooseProvider')}
        </ModalHeader>
        <ModalBody className="px-0 pt-0">{body}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default RampsProviderSelectionModal;
