import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  ButtonBase,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import { formatFundingRate } from '../../../../../shared/lib/perps-formatters';
import { Skeleton } from '../../../component-library/skeleton';
import { useFundingCountdown } from '../../../../hooks/perps/useFundingCountdown';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsLivePrices } from '../../../../hooks/perps/stream';
import {
  DEFAULT_ROUTE,
  PERPS_MARKET_EXPANDED_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  type PerpsState,
  selectPerpsIsWatchlistMarket,
} from '../../../../selectors/perps-controller';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { formatPerpsFiatUniversal } from '../utils/formatPerpsDisplayPrice';
import { PerpsMarketSelector } from '../perps-market-selector';
import {
  getExpandedDisplayChange,
  getExpandedDisplayPrice,
} from './utils';

const HEADER_GRID_COLUMNS =
  '36px 192px 118px 92px 92px 156px 92px minmax(12px, 1fr) 36px';

type HeaderStatProps = {
  label: string;
  value: React.ReactNode;
  className?: string;
};

const HeaderStat: React.FC<HeaderStatProps> = ({ label, value, className }) => (
  <Box
    flexDirection={BoxFlexDirection.Column}
    className={twMerge(
      'min-w-0 border-l border-border-muted pl-3',
      className ?? 'w-full',
    )}
    gap={1}
  >
    <Text
      variant={TextVariant.BodyXs}
      color={TextColor.TextAlternative}
      className="truncate"
    >
      {label}
    </Text>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        className="truncate tabular-nums"
      >
        {value}
      </Text>
    ) : (
      value
    )}
  </Box>
);

export type PerpsMarketExpandedHeaderProps = {
  markets: PerpsMarketData[];
  market: PerpsMarketData;
  currentSymbol: string;
  chartCurrentPrice: number;
};

export const PerpsMarketExpandedHeader: React.FC<
  PerpsMarketExpandedHeaderProps
> = ({ markets, market, currentSymbol, chartCurrentPrice }) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const fundingCountdown = useFundingCountdown();
  const { prices } = usePerpsLivePrices({
    symbols: [currentSymbol],
    activateStream: true,
    includeMarketData: true,
  });
  const livePrice = prices[currentSymbol];
  const isInWatchlist = useSelector((state: unknown) =>
    selectPerpsIsWatchlistMarket(state as PerpsState, currentSymbol),
  );

  const { displayChange, changeColor } = useMemo(
    () =>
      getExpandedDisplayChange(
        livePrice?.percentChange24h ?? market.change24hPercent,
      ),
    [livePrice?.percentChange24h, market.change24hPercent],
  );
  const displayPrice = useMemo(
    () =>
      getExpandedDisplayPrice({
        chartCurrentPrice,
        livePrice: livePrice?.price,
        marketPrice: market.price,
      }),
    [chartCurrentPrice, livePrice?.price, market.price],
  );

  const handleBackClick = useCallback(() => {
    navigate({ pathname: DEFAULT_ROUTE, search: 'tab=perps' });
  }, [navigate]);

  const handleMarketSelect = useCallback(
    (nextSymbol: string) => {
      navigate(
        `${PERPS_MARKET_EXPANDED_ROUTE}/${encodeURIComponent(nextSymbol)}`,
      );
    },
    [navigate],
  );

  const handleFavoriteClick = useCallback(() => {
    submitRequestToBackground('perpsToggleWatchlistMarket', [
      currentSymbol,
    ]).catch(() => undefined);
  }, [currentSymbol]);

  return (
    <header
      className="!grid shrink-0 items-center gap-3 overflow-visible border-b border-border-muted px-4 py-2"
      style={{ gridTemplateColumns: HEADER_GRID_COLUMNS }}
      data-testid="perps-expanded-header"
    >
      <ButtonBase
        onClick={handleBackClick}
        aria-label={t('back')}
        className="flex h-9 w-9 min-w-0 items-center justify-center rounded-md bg-transparent p-0 hover:bg-hover active:bg-pressed"
        data-testid="perps-expanded-back-button"
      >
        <Icon
          name={IconName.ArrowLeft}
          size={IconSize.Md}
          color={IconColor.IconAlternative}
        />
      </ButtonBase>

      <PerpsMarketSelector
        markets={markets}
        currentSymbol={currentSymbol}
        onMarketSelect={handleMarketSelect}
      />

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Baseline}
        className="min-w-0"
        gap={2}
        data-testid="perps-expanded-price-change"
      >
        <Text
          variant={TextVariant.BodySm}
          fontWeight={FontWeight.Medium}
          className="min-w-0 truncate tabular-nums"
        >
          {displayPrice}
        </Text>
        <Text
          variant={TextVariant.BodyXs}
          fontWeight={FontWeight.Medium}
          color={changeColor}
          className="whitespace-nowrap tabular-nums"
          data-testid="perps-expanded-change"
        >
          {displayChange}
        </Text>
      </Box>

      <HeaderStat label={t('perps24hVolume')} value={market.volume ?? '-'} />
      <HeaderStat
        label={t('perpsOpenInterest')}
        value={market.openInterest ?? '-'}
      />
      <HeaderStat
        label={t('perpsFundingRate')}
        value={
          typeof market.fundingRate === 'number' ? (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Baseline}
              gap={1}
              className="min-w-0"
            >
              <Text
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Medium}
                color={
                  market.fundingRate >= 0
                    ? TextColor.SuccessDefault
                    : TextColor.ErrorDefault
                }
                className="shrink-0 tabular-nums"
              >
                {formatFundingRate(market.fundingRate)}
              </Text>
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
                className="shrink-0 whitespace-nowrap tabular-nums"
              >
                {fundingCountdown}
              </Text>
            </Box>
          ) : (
            '-'
          )
        }
      />
      <HeaderStat
        label={t('perpsOraclePrice')}
        value={
          livePrice?.markPrice
            ? formatPerpsFiatUniversal(livePrice.markPrice)
            : '-'
        }
      />

      <Box className="min-w-4" />

      <ButtonBase
        onClick={handleFavoriteClick}
        aria-label={
          isInWatchlist
            ? t('perpsRemoveFromFavorites')
            : t('perpsAddToFavorites')
        }
        className="flex h-9 w-9 min-w-0 items-center justify-center rounded-md bg-transparent p-0 hover:bg-hover active:bg-pressed"
        data-testid="perps-expanded-favorite-button"
      >
        <Icon
          name={isInWatchlist ? IconName.StarFilled : IconName.Star}
          size={IconSize.Md}
          color={
            isInWatchlist ? IconColor.IconDefault : IconColor.IconAlternative
          }
        />
      </ButtonBase>
    </header>
  );
};

export const PerpsMarketExpandedHeaderSkeleton: React.FC = () => (
  <header
    className="!grid shrink-0 items-center gap-3 overflow-hidden border-b border-border-muted px-4 py-2"
    style={{ gridTemplateColumns: HEADER_GRID_COLUMNS }}
    data-testid="perps-expanded-header-skeleton"
  >
    <Skeleton className="h-9 w-9" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-full" />
    <Box />
    <Skeleton className="h-9 w-9" />
  </header>
);
