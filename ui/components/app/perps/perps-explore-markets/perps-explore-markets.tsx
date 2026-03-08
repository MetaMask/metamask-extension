import React, { useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  ButtonBase,
  Text,
  FontWeight,
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
import { PerpsMarketCard } from '../perps-market-card';
import type { PerpsMarketData } from '../types';

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
        {cryptoMarkets.map((market) => (
          <PerpsMarketCard
            key={market.symbol}
            symbol={market.symbol}
            name={market.name}
            price={market.price}
            change24hPercent={market.change24hPercent}
            onClick={handleMarketClick}
            data-testid={`explore-crypto-${market.symbol}`}
          />
        ))}
        {hip3Markets.map((market) => (
          <PerpsMarketCard
            key={market.symbol}
            symbol={market.symbol}
            name={market.name}
            price={market.price}
            change24hPercent={market.change24hPercent}
            onClick={handleMarketClick}
            data-testid={`explore-hip3-${market.symbol.replace(/:/gu, '-')}`}
          />
        ))}
      </Box>
    </Box>
  );
};
