import React, { useCallback } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import { MarketRow } from '../market-row';
import { PerpsSectionHeader } from '../perps-section-header';
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
      <PerpsSectionHeader
        label={t('perpsExploreMarkets')}
        onClick={handleSeeAllPerps}
        data-testid="perps-explore-markets-row"
      />
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
