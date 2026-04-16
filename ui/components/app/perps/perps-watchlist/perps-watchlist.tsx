import React, { useMemo, useCallback } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  FontWeight,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveMarketData } from '../../../../hooks/perps/stream';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';
import { PerpsMarketCard } from '../perps-market-card';
import {
  selectPerpsIsTestnet,
  selectPerpsWatchlistMarkets,
} from '../../../../selectors/perps-controller';

/**
 * PerpsWatchlist displays a list of watched markets.
 * Resolves symbols from Redux with usePerpsLiveMarketData for live price and change.
 */
export const PerpsWatchlist: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { cryptoMarkets, hip3Markets } = usePerpsLiveMarketData();
  const watchlistMarketsState = useSelector(selectPerpsWatchlistMarkets);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const watchlistSymbols = isTestnet
    ? watchlistMarketsState.testnet
    : watchlistMarketsState.mainnet;

  const watchlistMarkets = useMemo(() => {
    const allMarkets = [...cryptoMarkets, ...hip3Markets];
    return watchlistSymbols
      .map((symbol) =>
        allMarkets.find((m) => m.symbol.toUpperCase() === symbol.toUpperCase()),
      )
      .filter(Boolean) as typeof allMarkets;
  }, [cryptoMarkets, hip3Markets, watchlistSymbols]);

  const handleMarketClick = useCallback(
    (symbol: string) => {
      navigate(`${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(symbol)}`);
    },
    [navigate],
  );

  if (watchlistMarkets.length === 0) {
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
        {watchlistMarkets.map((market) => (
          <PerpsMarketCard
            key={market.symbol}
            symbol={market.symbol}
            name={market.name}
            price={market.price}
            change24hPercent={market.change24hPercent}
            volume={market.volume}
            onClick={handleMarketClick}
            data-testid={`perps-watchlist-${market.symbol}`}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PerpsWatchlist;
