import React, { useMemo } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import type { PerpsMarketData } from '../../../../../components/app/perps/types';
import { sortMarkets } from '../../../utils/sortMarkets';
import { MarketRow } from '../market-row';

export type WatchlistEmptyStateProps = {
  /** All available markets to pick suggestions from */
  allMarkets: PerpsMarketData[];
  /** Number of suggested markets to show */
  suggestedCount?: number;
  /** Callback to toggle watchlist status for a market */
  onToggleWatchlist: (symbol: string) => void;
  /** Check if a symbol is in the watchlist */
  isInWatchlist: (symbol: string) => boolean;
  /** Callback when a market row is pressed */
  onMarketPress?: (market: PerpsMarketData) => void;
};

/**
 * WatchlistEmptyState component displays when the user's watchlist is empty.
 * Shows a helpful message and suggests popular markets to add.
 *
 * @param props - Component props
 * @param props.allMarkets - All available markets to pick suggestions from
 * @param props.suggestedCount - Number of suggested markets to show (default: 5)
 * @param props.onToggleWatchlist - Callback to toggle watchlist status
 * @param props.isInWatchlist - Function to check if a symbol is in watchlist
 * @param props.onMarketPress - Callback when a market row is pressed
 */
export const WatchlistEmptyState: React.FC<WatchlistEmptyStateProps> = ({
  allMarkets,
  suggestedCount = 5,
  onToggleWatchlist,
  isInWatchlist,
  onMarketPress,
}) => {
  const t = useI18nContext();

  // Get top markets by volume as suggestions
  const suggestedMarkets = useMemo(() => {
    const sortedByVolume = sortMarkets({
      markets: allMarkets,
      sortBy: 'volume',
      direction: 'desc',
    });
    return sortedByVolume.slice(0, suggestedCount);
  }, [allMarkets, suggestedCount]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      data-testid="watchlist-empty-state"
    >
      {/* Empty state message */}
      <Box
        className="px-4 py-6"
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={2}
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          className="text-center"
        >
          {t('perpsWatchlistEmpty')}
        </Text>
      </Box>

      {/* Suggested markets */}
      <Box flexDirection={BoxFlexDirection.Column}>
        {suggestedMarkets.map((market) => (
          <MarketRow
            key={market.symbol}
            market={market}
            displayMetric="volume"
            onPress={onMarketPress}
            showWatchlistIcon
            isInWatchlist={isInWatchlist(market.symbol)}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </Box>
    </Box>
  );
};

export default WatchlistEmptyState;
