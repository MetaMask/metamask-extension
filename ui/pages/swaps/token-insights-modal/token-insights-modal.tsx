import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
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
  BackgroundColor,
  BorderRadius,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useTokenInsightsData,
  TokenInsightsToken,
} from '../../../hooks/useTokenInsightsData';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
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

interface TokenInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenInsightsToken | null;
}

interface MarketDataRowProps {
  label: string;
  value: React.ReactNode;
  'data-testid'?: string;
}

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
  const dispatch = useDispatch();
  const trackEvent = React.useContext(MetaMetricsContext);
  const currentCurrency = useSelector(getCurrentCurrency);

  const {
    marketData,
    isLoading,
    error,
    isVerified,
    aggregators,
    isNativeToken,
  } = useTokenInsightsData(token);

  // Track modal open
  React.useEffect(() => {
    if (isOpen && token) {
      trackEvent({
        event: 'Token Insights Modal Opened',
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          token_symbol: token.symbol,
          token_address: token.address,
          chain_id: token.chainId,
        },
      });
    }
  }, [isOpen, token, trackEvent]);

  // Extract and format market data
  const price = marketData?.price;
  const priceChange24h = marketData?.pricePercentChange1d || 0;
  const volume = marketData?.totalVolume;
  const marketCap =
    (marketData as any)?.dilutedMarketCap || marketData?.marketCap;

  const formattedPrice = useMemo(() => {
    if (!price) return '—';
    return formatCurrency(String(price), currentCurrency as string);
  }, [price, currentCurrency]);

  const handleCopyAddress = useCallback(() => {
    if (token) {
      trackEvent({
        event: 'Token Contract Address Copied',
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          token_symbol: token.symbol,
          token_address: token.address,
        },
      });
    }
  }, [token, trackEvent]);

  if (!token) return null;

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
      <ModalContent>
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
            {token.name || token.symbol} Insights
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
                          ? IconName.TrendUp
                          : IconName.TrendDown
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
                  {formatCompactCurrency(volume, currentCurrency as string)}
                </Text>
              }
              data-testid="token-volume"
            />

            <MarketDataRow
              label={t('marketCapFDV')}
              value={
                <Text variant={TextVariant.bodyMd}>
                  {formatCompactCurrency(marketCap, currentCurrency as string)}
                </Text>
              }
              data-testid="token-market-cap"
            />

            {/* Contract Address */}
            {shouldShowContractAddress(token.address) && (
              <MarketDataRow
                label={t('contractAddress')}
                value={
                  <Box onClick={handleCopyAddress}>
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
