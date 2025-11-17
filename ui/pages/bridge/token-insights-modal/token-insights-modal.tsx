import React, { useCallback, useEffect } from 'react';
import {
  Text,
  Box,
  AvatarToken,
  Icon,
  IconName,
  IconSize,
  AvatarTokenSize,
  TextVariant,
  TextColor,
  IconColor,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../../components/component-library';
import { AddressCopyButton } from '../../../components/multichain/address-copy-button';
import {
  Display,
  FlexDirection,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useTokenInsightsData,
  TokenInsightsToken,
} from '../../../hooks/useTokenInsightsData';
import {
  formatPercentage,
  formatContractAddress,
  shouldShowContractAddress,
  getPriceChangeColor,
} from '../../../helpers/utils/token-insights';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

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
    marginBottom={3}
    data-testid={dataTestId}
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    justifyContent={BoxJustifyContent.Between}
  >
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
      {label}
    </Text>
    <Box alignItems={BoxAlignItems.Center}>{value}</Box>
  </Box>
);

export const TokenInsightsModal: React.FC<TokenInsightsModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const t = useI18nContext();
  const trackEvent = React.useContext(MetaMetricsContext);
  const dialogRef = React.useRef<HTMLElement | null>(null);
  const hasTrackedOpen = React.useRef(false);

  const { marketData, marketDataFiat } = useTokenInsightsData(token);

  useEffect(() => {
    if (isOpen && token && !hasTrackedOpen.current) {
      hasTrackedOpen.current = true;
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

    if (!isOpen) {
      hasTrackedOpen.current = false;
    }
  }, [isOpen, token, trackEvent]);

  // Ensure only the top modal closes on outside click by intercepting
  // document mousedown and stopping propagation.
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

  const priceChange24h = marketData?.pricePercentChange1d || 0;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="token-insights-modal">
      <ModalOverlay />
      <ModalContent
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
        modalDialogProps={{
          ref: dialogRef as React.RefObject<HTMLDivElement>,
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
          <Text variant={TextVariant.HeadingSm}>
            {token.symbol || token.name} {t('insights')}
          </Text>
        </ModalHeader>
        <Box paddingRight={4} paddingLeft={4}>
          {/* Market Data */}
          <Box flexDirection={BoxFlexDirection.Column}>
            <MarketDataRow
              label={t('price')}
              value={
                <Text variant={TextVariant.BodyMd}>
                  {marketDataFiat?.formattedPrice || '—'}
                </Text>
              }
              data-testid="token-price"
            />

            <MarketDataRow
              label={t('percentChange')}
              value={
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
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
                          ? IconColor.SuccessDefault
                          : IconColor.ErrorDefault
                      }
                      size={IconSize.Sm}
                    />
                  )}
                  <Text
                    variant={TextVariant.BodyMd}
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
                <Text variant={TextVariant.BodyMd}>
                  {marketDataFiat?.formattedVolume || '—'}
                </Text>
              }
              data-testid="token-volume"
            />

            <MarketDataRow
              label={t('marketCapFDV')}
              value={
                <Text variant={TextVariant.BodyMd}>
                  {marketDataFiat?.formattedMarketCap || '—'}
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
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleCopyAddress();
                    }}
                    onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                    onPointerDown={(e: React.PointerEvent) =>
                      e.stopPropagation()
                    }
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
