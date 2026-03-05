import React, { useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
  Icon,
  IconName,
  IconSize,
  IconColor,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName } from '../utils';
import type { PerpsMarketData } from '../types';

const CARD_STYLES =
  'justify-start rounded-none min-w-0 h-[62px] gap-4 text-left cursor-pointer bg-default pt-2 pb-2 px-4 hover:bg-hover active:bg-pressed';

export type PerpsExploreMarketsProps = {
  cryptoMarkets: PerpsMarketData[];
  hip3Markets: PerpsMarketData[];
};

export const PerpsExploreMarkets: React.FC<PerpsExploreMarketsProps> = ({
  cryptoMarkets,
  hip3Markets,
}) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleMarketClick = useCallback(
    (symbol: string) => {
      navigate(`${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`);
    },
    [navigate],
  );

  const handleSeeAllPerps = useCallback(() => {
    navigate(PERPS_MARKET_LIST_ROUTE);
  }, [navigate]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-explore-section"
    >
      <ButtonBase
        className="w-full flex flex-row justify-between items-center px-4 py-3 bg-transparent hover:bg-hover active:bg-pressed"
        onClick={handleSeeAllPerps}
        data-testid="perps-explore-markets-row"
      >
        <Text fontWeight={FontWeight.Medium}>{t('perpsExploreMarkets')}</Text>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Sm}
          color={IconColor.IconAlternative}
        />
      </ButtonBase>
      <Box flexDirection={BoxFlexDirection.Column}>
        {cryptoMarkets.map((market) => {
          const isPositiveChange = market.change24hPercent.startsWith('+');
          return (
            <ButtonBase
              key={market.symbol}
              className={twMerge(CARD_STYLES)}
              isFullWidth
              onClick={() => handleMarketClick(market.symbol)}
              data-testid={`explore-crypto-${market.symbol}`}
            >
              <PerpsTokenLogo
                symbol={market.symbol}
                size={AvatarTokenSize.Md}
                className="shrink-0"
              />
              <Box
                className="min-w-0 flex-1"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                gap={1}
              >
                <Text fontWeight={FontWeight.Medium}>{market.name}</Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {getDisplayName(market.symbol)}-USD
                </Text>
              </Box>
              <Box
                className="shrink-0"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.End}
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {market.price}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={
                    isPositiveChange
                      ? TextColor.SuccessDefault
                      : TextColor.ErrorDefault
                  }
                >
                  {market.change24hPercent}
                </Text>
              </Box>
            </ButtonBase>
          );
        })}
        {hip3Markets.map((market) => {
          const isPositiveChange = market.change24hPercent.startsWith('+');
          const displaySymbol = getDisplayName(market.symbol);
          const displayName = market.name
            ? getDisplayName(market.name)
            : displaySymbol;
          return (
            <ButtonBase
              key={market.symbol}
              className={twMerge(CARD_STYLES)}
              isFullWidth
              onClick={() => handleMarketClick(market.symbol)}
              data-testid={`explore-hip3-${market.symbol.replace(/:/gu, '-')}`}
            >
              <PerpsTokenLogo
                symbol={market.symbol}
                size={AvatarTokenSize.Md}
                className="shrink-0"
              />
              <Box
                className="min-w-0 flex-1"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                gap={1}
              >
                <Text fontWeight={FontWeight.Medium}>{displayName}</Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                >
                  {displaySymbol}-USD
                </Text>
              </Box>
              <Box
                className="shrink-0"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.End}
                gap={1}
              >
                <Text
                  variant={TextVariant.BodySm}
                  fontWeight={FontWeight.Medium}
                >
                  {market.price}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={
                    isPositiveChange
                      ? TextColor.SuccessDefault
                      : TextColor.ErrorDefault
                  }
                >
                  {market.change24hPercent}
                </Text>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};
