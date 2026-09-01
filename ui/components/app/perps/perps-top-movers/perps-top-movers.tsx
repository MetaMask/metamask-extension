import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  IconColor,
  Skeleton,
} from '@metamask/design-system-react';
import { useNavigate } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { usePerpsEventTracking } from '../../../../hooks/perps';
import {
  PERPS_MARKET_DETAIL_ROUTE,
  PERPS_MARKET_LIST_ROUTE,
} from '../../../../helpers/constants/routes';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../../../shared/constants/perps-events';
import type { SortDirection } from '../../../../pages/perps/utils/sortMarkets';
import { MARKET_SORTING_CONFIG } from '../constants';
import { usePerpsTopMovers } from '../hooks/usePerpsTopMovers';
import type { PerpsMarketData } from '../types';
import { PerpsTopMoverPill } from './perps-top-mover-pill';

/**
 * Ranking directions the toggle offers. `desc` puts the biggest risers first
 * (Gainers), `asc` the biggest fallers (Losers) — the same mapping mobile's
 * `PerpsTopMoversSection` uses.
 */
const GAINERS_DIRECTION: SortDirection =
  MARKET_SORTING_CONFIG.DEFAULT_DIRECTION;
const LOSERS_DIRECTION: SortDirection = 'asc';

/** Pills are split evenly across this many rows, as mobile's PillScrollList does. */
const PILL_ROW_COUNT = 2;

/** Skeleton pill footprint, matching mobile's SectionPillsSkeleton (104x32). */
const SKELETON_PILL_STYLES = 'h-8 w-[104px] shrink-0 rounded-full';
const SKELETON_PILL_KEYS = ['a', 'b', 'c', 'd', 'e', 'f'];

/**
 * Splits the ranked markets evenly across rows, filling each row in turn —
 * the same distribution mobile's `PillScrollList` uses, so the two clients
 * order their pills identically.
 *
 * @param markets - Ranked markets to lay out.
 * @param rowCount - How many rows to split across.
 * @returns One array of markets per row.
 */
const splitIntoRows = (
  markets: PerpsMarketData[],
  rowCount: number,
): PerpsMarketData[][] => {
  const rows: PerpsMarketData[][] = [];
  let start = 0;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowSize = Math.ceil((markets.length - start) / (rowCount - rowIndex));
    const row = markets.slice(start, start + rowSize);
    if (row.length > 0) {
      rows.push(row);
    }
    start += rowSize;
  }

  return rows;
};

export type PerpsTopMoversProps = {
  /** Live markets to rank, owned by the Perps tab's market-list stream. */
  markets: PerpsMarketData[];
  /** Whether the tab's market data is still loading its first snapshot. */
  isLoading: boolean;
};

/**
 * PerpsTopMovers ranks the live perps markets by 24h price change and shows
 * the strongest movers as two horizontally scrolling rows of pills. The
 * Gainers/Losers toggle flips the ranking direction in place, and the header
 * opens the full market list already sorted by price change in that direction.
 *
 * Receives markets from the Perps tab rather than subscribing itself, so the
 * tab keeps a single owner of the shared market-list price stream.
 *
 * @param options0 - Component props.
 * @param options0.markets - Live markets to rank.
 * @param options0.isLoading - Whether the first market snapshot is still loading.
 */
export const PerpsTopMovers = ({
  markets: liveMarkets,
  isLoading,
}: PerpsTopMoversProps) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { track } = usePerpsEventTracking();
  const [direction, setDirection] = useState<SortDirection>(GAINERS_DIRECTION);
  const markets = usePerpsTopMovers({ markets: liveMarkets, direction });

  const isGainers = direction === GAINERS_DIRECTION;

  const handleSelectGainers = useCallback(() => {
    setDirection(GAINERS_DIRECTION);
  }, []);

  const handleSelectLosers = useCallback(() => {
    setDirection(LOSERS_DIRECTION);
  }, []);

  const handleSeeAll = useCallback(() => {
    track(MetaMetricsEventName.PerpsUiInteraction, {
      [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
        PERPS_EVENT_VALUE.INTERACTION_TYPE.BUTTON_CLICKED,
      [PERPS_EVENT_PROPERTY.BUTTON_CLICKED]:
        PERPS_EVENT_VALUE.BUTTON_CLICKED.TOP_MOVERS,
      [PERPS_EVENT_PROPERTY.BUTTON_LOCATION]:
        PERPS_EVENT_VALUE.BUTTON_LOCATION.PERPS_HOME,
    });
    navigate(
      `${PERPS_MARKET_LIST_ROUTE}?sort=${MARKET_SORTING_CONFIG.SORT_FIELDS.PRICE_CHANGE}&direction=${direction}`,
    );
  }, [direction, navigate, track]);

  const handleMarketClick = useCallback(
    (market: PerpsMarketData) => {
      track(MetaMetricsEventName.PerpsUiInteraction, {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.TAP,
        [PERPS_EVENT_PROPERTY.ASSET]: market.symbol,
        [PERPS_EVENT_PROPERTY.SOURCE_SECTION]: isGainers
          ? PERPS_EVENT_VALUE.SOURCE_SECTION.TOP_GAINERS
          : PERPS_EVENT_VALUE.SOURCE_SECTION.TOP_LOSERS,
      });
      navigate(
        `${PERPS_MARKET_DETAIL_ROUTE}/${encodeURIComponent(market.symbol)}`,
      );
    },
    [isGainers, navigate, track],
  );

  const pillRows = useMemo(
    () => splitIntoRows(markets, PILL_ROW_COUNT),
    [markets],
  );

  // Once the markets have loaded, an empty ranking means there is nothing to
  // rank at all (no market data reached the tab), so the section has no content
  // to justify its heading.
  if (!isLoading && markets.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={3}
      data-testid="perps-top-movers"
    >
      {/* Heading with the chevron tucked directly after the title, as on mobile */}
      <ButtonBase
        className="w-auto self-start h-auto justify-start gap-1 bg-transparent px-4 pt-4 rounded-none hover:bg-transparent active:bg-transparent"
        onClick={handleSeeAll}
        data-testid="perps-top-movers-header"
      >
        <Text variant={TextVariant.HeadingMd} fontWeight={FontWeight.Bold}>
          {t('perpsTopMovers')}
        </Text>
        <Icon
          name={IconName.ArrowRight}
          size={IconSize.Md}
          color={IconColor.IconAlternative}
        />
      </ButtonBase>

      {/* One joined segmented track, split in half — mobile's SegmentedControl */}
      <Box paddingLeft={4} paddingRight={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          className="w-full rounded-full border border-muted p-0.5"
          data-testid="perps-top-movers-toggle"
        >
          <ButtonBase
            className={`flex-1 h-8 rounded-full ${
              isGainers ? 'bg-muted' : 'bg-transparent hover:bg-hover'
            }`}
            onClick={handleSelectGainers}
            aria-pressed={isGainers}
            data-testid="perps-top-movers-gainers"
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={
                isGainers ? TextColor.TextDefault : TextColor.TextAlternative
              }
            >
              {t('perpsTopMoversGainers')}
            </Text>
          </ButtonBase>
          <ButtonBase
            className={`flex-1 h-8 rounded-full ${
              isGainers ? 'bg-transparent hover:bg-hover' : 'bg-muted'
            }`}
            onClick={handleSelectLosers}
            aria-pressed={!isGainers}
            data-testid="perps-top-movers-losers"
          >
            <Text
              variant={TextVariant.BodySm}
              fontWeight={FontWeight.Medium}
              color={
                isGainers ? TextColor.TextAlternative : TextColor.TextDefault
              }
            >
              {t('perpsTopMoversLosers')}
            </Text>
          </ButtonBase>
        </Box>
      </Box>

      {isLoading ? (
        <Box
          className="flex-col gap-1.5 overflow-hidden px-4"
          data-testid="perps-top-movers-skeleton"
        >
          {Array.from({ length: PILL_ROW_COUNT }).map((_, rowIndex) => (
            <Box
              key={`perps-top-movers-skeleton-row-${rowIndex}`}
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              className="flex-nowrap gap-2"
            >
              {SKELETON_PILL_KEYS.map((pillKey) => (
                <Skeleton
                  key={`perps-top-movers-skeleton-pill-${rowIndex}-${pillKey}`}
                  className={SKELETON_PILL_STYLES}
                />
              ))}
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          className="flex-col gap-1.5 overflow-x-auto px-4"
          data-testid="perps-top-movers-list"
        >
          {pillRows.map((row, rowIndex) => (
            <Box
              key={`perps-top-movers-row-${rowIndex}`}
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              className="w-max flex-nowrap gap-2"
              data-testid={`perps-top-movers-list-row-${rowIndex}`}
            >
              {row.map((market) => (
                <PerpsTopMoverPill
                  key={market.symbol}
                  market={market}
                  onPress={handleMarketClick}
                />
              ))}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PerpsTopMovers;
