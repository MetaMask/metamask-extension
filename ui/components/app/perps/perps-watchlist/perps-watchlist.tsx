import React, { useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import { MarketRow } from '../market-row';

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

  if (markets.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      data-testid="perps-watchlist"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        alignItems={BoxAlignItems.Center}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={4}
        marginBottom={2}
      >
        <Text fontWeight={FontWeight.Medium}>{t('perpsWatchlist')}</Text>
      </Box>
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
