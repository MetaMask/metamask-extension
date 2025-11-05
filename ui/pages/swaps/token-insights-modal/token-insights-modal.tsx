import React, { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
  Text,
  Icon,
  IconName,
  IconSize,
  AvatarToken,
  AvatarTokenSize,
} from '../../../components/component-library';
import { AddressCopyButton } from '../../../components/multichain';
import {
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextVariant,
  TextColor,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useTokenInsightsData,
  TokenInsightsToken,
} from '../../../hooks/useTokenInsightsData';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { getCurrencyRates, getMarketData } from '../../../selectors/selectors';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import {
  formatPercentage,
  formatCompactCurrency,
  formatContractAddress,
  shouldShowContractAddress,
  getPriceChangeColor,
} from '../../../helpers/utils/token-insights';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import Spinner from '../../../components/ui/spinner';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

type TokenInsightsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  token: TokenInsightsToken | null;
};

type MarketDataRowProps = {
  label: string;
  value: React.ReactNode;
  'data-testid'?: string;
};

const MarketDataRow: React.FC<MarketDataRowProps> = ({
  label,
  value,
  'data-testid': dataTestId,
}) => (
  <Box
    display={Display.Flex}
    justifyContent={JustifyContent.spaceBetween}
    alignItems={AlignItems.center}
    marginBottom={3}
    data-testid={dataTestId}
  >
    <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
      {label}
    </Text>
    <Box display={Display.Flex} alignItems={AlignItems.center}>
      {value}
    </Box>
  </Box>
);

export const TokenInsightsModal: React.FC<TokenInsightsModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const t = useI18nContext();
  const trackEvent = React.useContext(MetaMetricsContext);
  const currentCurrency = useSelector(getCurrentCurrency);
  const dialogRef = React.useRef<HTMLElement | null>(null);
  type CurrencyRatesMap = Record<string, { conversionRate?: number }>;
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRatesMap;
  type EvmMarketTokenData = {
    price?: number;
    currency?: string;
    totalVolume?: number;
    marketCap?: number;
    dilutedMarketCap?: number;
  };
  type EvmMarketDataState = Record<string, Record<string, EvmMarketTokenData>>;
  const evmMarketDataState = useSelector(getMarketData) as EvmMarketDataState;

  const { marketData, isLoading, isNativeToken } = useTokenInsightsData(token);

  // Track modal open
  useEffect(() => {
    if (isOpen && token) {
      trackEvent({
        event: 'Token Insights Modal Opened',
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address: token.address,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        },
      });
    }
  }, [isOpen, token, trackEvent]);

  // Ensure only the top modal closes on outside click by intercepting
  // document mousedown in the capture phase and stopping propagation.
  useEffect(() => {
    if (!isOpen) {
      return () => undefined;
    }
    const handleDocMouseDownCapture = (event: MouseEvent) => {
      const el = dialogRef.current;
      // this prevents the modal from closing when clicking on the modal content
      if (el && !el.contains(event.target as Node)) {
        onClose();
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };
    document.addEventListener('mousedown', handleDocMouseDownCapture, true);
    return () => {
      document.removeEventListener(
        'mousedown',
        handleDocMouseDownCapture,
        true,
      );
    };
  }, [isOpen, onClose]);

  // Determine EVM/native context and source market data
  const isEvm = Boolean(token && isEvmChainId(token.chainId as Hex));
  const evmTokenData = useMemo(() => {
    if (!token || !isEvm) {
      return null;
    }
    const addr = toChecksumHexAddress(token.address);
    return evmMarketDataState?.[token.chainId as Hex]?.[addr] || null;
  }, [token, isEvm, evmMarketDataState]);

  const hasEvmCache = Boolean(isEvm && evmTokenData);

  const baseCurrency: string | undefined = useMemo(() => {
    if (!isEvm) {
      return undefined;
    }
    if (isNativeToken) {
      return token?.symbol;
    }
    return evmTokenData?.currency;
  }, [isEvm, isNativeToken, token, evmTokenData]);

  const exchangeRate = baseCurrency
    ? currencyRates?.[baseCurrency]?.conversionRate
    : undefined;

  // Extract and convert market data to selected fiat currency for EVM
  const priceChange24h = marketData?.pricePercentChange1d || 0;

  const priceFiat: number | undefined = useMemo(() => {
    if (!isEvm || !hasEvmCache) {
      return marketData?.price;
    }
    if (isNativeToken) {
      return token?.symbol
        ? currencyRates?.[token.symbol]?.conversionRate
        : undefined;
    }
    if (
      exchangeRate !== undefined &&
      evmTokenData?.price !== undefined &&
      evmTokenData?.price !== null
    ) {
      return exchangeRate * Number(evmTokenData.price);
    }
    return undefined;
  }, [
    isEvm,
    hasEvmCache,
    isNativeToken,
    marketData?.price,
    currencyRates,
    token,
    exchangeRate,
    evmTokenData,
  ]);

  const volumeFiat: number | undefined = useMemo(() => {
    if (!isEvm || !hasEvmCache) {
      return marketData?.totalVolume;
    }
    const vol = evmTokenData?.totalVolume;
    if (exchangeRate !== undefined && vol !== undefined && vol !== null) {
      return exchangeRate * Number(vol);
    }
    return undefined;
  }, [isEvm, hasEvmCache, marketData?.totalVolume, evmTokenData, exchangeRate]);

  const marketCapSource = marketData?.dilutedMarketCap ?? marketData?.marketCap;
  const evmMarketCapSource =
    evmTokenData?.dilutedMarketCap ?? evmTokenData?.marketCap;
  const marketCapFiat: number | undefined = useMemo(() => {
    if (!isEvm || !hasEvmCache) {
      return marketCapSource as number | undefined;
    }
    if (
      exchangeRate !== undefined &&
      evmMarketCapSource !== undefined &&
      evmMarketCapSource !== null
    ) {
      return exchangeRate * Number(evmMarketCapSource);
    }
    return undefined;
  }, [isEvm, hasEvmCache, marketCapSource, evmMarketCapSource, exchangeRate]);

  const formattedPrice = useMemo(() => {
    if (!priceFiat) {
      return '—';
    }
    return formatCurrency(String(priceFiat), currentCurrency as string);
  }, [priceFiat, currentCurrency]);

  const handleCopyAddress = useCallback(() => {
    if (token) {
      trackEvent({
        event: 'Token Contract Address Copied',
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_address: token.address,
        },
      });
    }
  }, [token, trackEvent]);

  if (!token) {
    return null;
  }

  // Loading state
  if (isLoading && !marketData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} className="token-insights-modal">
        <ModalOverlay />
        <ModalContent>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            style={{ minHeight: 300 }}
          >
            <Spinner />
          </Box>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="token-insights-modal">
      <ModalOverlay />
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        modalDialogProps={{
          // attach ref to the inner dialog element
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref: dialogRef as any,
          onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
          onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
          onClick: (e: React.MouseEvent) => e.stopPropagation(),
        }}
      >
        <ModalHeader
          onClose={onClose}
          paddingBottom={4}
          childrenWrapperProps={{
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.center,
            gap: 2,
          }}
        >
          <AvatarToken
            src={token.iconUrl}
            name={token.symbol}
            size={AvatarTokenSize.Lg}
            data-testid="token-insights-icon"
          />
          <Text variant={TextVariant.headingSm}>
            {token.symbol || token.name} {t('insights')}
          </Text>
        </ModalHeader>
        <Box paddingRight={4} paddingLeft={4}>
          {/* Market Data */}
          <Box className="market-data">
            <MarketDataRow
              label={t('price')}
              value={<Text variant={TextVariant.bodyMd}>{formattedPrice}</Text>}
              data-testid="token-price"
            />

            <MarketDataRow
              label={t('percentChange')}
              value={
                <Box
                  display={Display.Flex}
                  alignItems={AlignItems.center}
                  gap={1}
                >
                  {priceChange24h !== 0 && (
                    <Icon
                      name={
                        priceChange24h > 0
                          ? IconName.Arrow2Up
                          : IconName.Arrow2Down
                      }
                      color={
                        priceChange24h > 0
                          ? IconColor.successDefault
                          : IconColor.errorDefault
                      }
                      size={IconSize.Sm}
                    />
                  )}
                  <Text
                    variant={TextVariant.bodyMd}
                    color={getPriceChangeColor(priceChange24h)}
                  >
                    {formatPercentage(priceChange24h)}
                  </Text>
                </Box>
              }
              data-testid="token-price-change"
            />

            <MarketDataRow
              label={t('volume')}
              value={
                <Text variant={TextVariant.bodyMd}>
                  {formatCompactCurrency(volumeFiat, currentCurrency as string)}
                </Text>
              }
              data-testid="token-volume"
            />

            <MarketDataRow
              label={t('marketCapFDV')}
              value={
                <Text variant={TextVariant.bodyMd}>
                  {formatCompactCurrency(
                    marketCapFiat,
                    currentCurrency as string,
                  )}
                </Text>
              }
              data-testid="token-market-cap"
            />

            {/* Contract Address */}
            {shouldShowContractAddress(token.address) && (
              <MarketDataRow
                label={t('contractAddress')}
                value={
                  <Box
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyAddress();
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <AddressCopyButton
                      address={formatContractAddress(token.address)}
                      shorten
                    />
                  </Box>
                }
                data-testid="token-contract-address"
              />
            )}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
