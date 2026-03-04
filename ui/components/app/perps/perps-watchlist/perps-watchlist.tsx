import React, { useMemo, useCallback } from 'react';
import {
  twMerge,
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLiveMarketData } from '../../../../hooks/perps/stream';
import { PerpsTokenLogo } from '../perps-token-logo';
import { getDisplayName } from '../utils';
import { mockWatchlist } from '../mocks';
import { PERPS_MARKET_DETAIL_ROUTE } from '../../../../helpers/constants/routes';

const CARD_STYLES =
  'justify-start rounded-none min-w-0 h-[62px] gap-4 text-left cursor-pointer bg-default pt-2 pb-2 px-4 hover:bg-hover active:bg-pressed';

/**
 * PerpsWatchlist displays a list of watched markets (stubbed with mock symbols).
 * Cross-references mockWatchlist with usePerpsLiveMarketData for live price/volume.
 */
export const PerpsWatchlist: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { cryptoMarkets, hip3Markets } = usePerpsLiveMarketData();

  const watchlistMarkets = useMemo(() => {
    const allMarkets = [...cryptoMarkets, ...hip3Markets];
    return mockWatchlist
      .map((symbol) =>
        allMarkets.find((m) => m.symbol.toUpperCase() === symbol.toUpperCase()),
      )
      .filter(Boolean) as typeof allMarkets;
  }, [cryptoMarkets, hip3Markets]);

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
        {watchlistMarkets.map((market) => {
          const isPositiveChange = market.change24hPercent.startsWith('+');
          return (
            <ButtonBase
              key={market.symbol}
              className={twMerge(CARD_STYLES)}
              isFullWidth
              onClick={() => handleMarketClick(market.symbol)}
              data-testid={`perps-watchlist-${market.symbol}`}
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
                {market.volume && (
                  <Text
                    variant={TextVariant.BodyXs}
                    color={TextColor.TextAlternative}
                  >
                    {market.volume}
                  </Text>
                )}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
};

export default PerpsWatchlist;
