import React, { useCallback } from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { WATCHLIST_MARKET_FILTER } from '../../../../../shared/constants/perps';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import { MarketRow } from '../market-row';
import { PerpsSectionHeader } from '../perps-section-header';

/**
 * PerpsWatchlist displays a list of watched markets.
 * Receives already-resolved markets from the Perps tab data hook.
 */
export type PerpsWatchlistProps = {
  markets: PerpsMarketData[];
};

export const PerpsWatchlist = ({ markets }: PerpsWatchlistProps) => {
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

  const handleHeaderClick = useCallback(() => {
    navigate(`${PERPS_MARKET_LIST_ROUTE}?filter=${WATCHLIST_MARKET_FILTER}`);
  }, [navigate]);

  if (markets.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-watchlist"
    >
      <PerpsSectionHeader
        label={t('perpsWatchlist')}
        onClick={handleHeaderClick}
        data-testid="perps-watchlist-header"
      />
      <Box flexDirection={BoxFlexDirection.Column}>
        {markets.map((market) => (
          <MarketRow
            key={market.symbol}
            market={market}
            displayMetric="volume"
            onPress={handleMarketClick}
            data-testid={`perps-watchlist-${market.symbol}`}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PerpsWatchlist;
