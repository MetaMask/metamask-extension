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
import { MarketRow } from '../market-row';
import { PERPS_CONSTANTS } from '../constants';
import type { PerpsMarketData } from '../types';

export type PerpsExploreMarketsProps = {
  markets: PerpsMarketData[];
};

export const PerpsExploreMarkets = ({ markets }: PerpsExploreMarketsProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const handleMarketClick = useCallback(
    (market: PerpsMarketData) => {
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
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
        className="w-full flex flex-row justify-between items-center px-4 py-3 bg-transparent rounded-none hover:bg-hover active:bg-pressed"
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
        {markets
          .slice(0, PERPS_CONSTANTS.EXPLORE_MARKETS_LIMIT)
          .map((market) => (
            <MarketRow
              key={market.symbol}
              market={market}
              displayMetric="volume"
              onPress={handleMarketClick}
              data-testid={`explore-markets-${market.symbol.replaceAll(':', '-')}`}
            />
          ))}
      </Box>
    </Box>
  );
};
