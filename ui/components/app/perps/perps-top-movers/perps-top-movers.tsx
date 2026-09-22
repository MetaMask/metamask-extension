import React, { useCallback, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  ButtonBase,
  ButtonFilter,
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
import { MARKET_SORTING_CONFIG, PERPS_CONSTANTS } from '../constants';
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

/**
 * Pills are laid out two per row. Eight ranked markets therefore stack as the
 * design's 2-column x 4-row grid, which fits any width the extension is shown
 * at — so there is nothing to slide sideways on a desktop without a trackpad.
 */
const PILL_GRID_STYLES = 'grid grid-cols-2 gap-2 px-4';

/** One skeleton placeholder per ranked slot, so the grid keeps its shape while loading. */
const SKELETON_PILL_KEYS = Array.from(
  { length: PERPS_CONSTANTS.TOP_MOVERS_LIMIT },
  (_, index) => `slot-${index}`,
);

/** Skeleton pill footprint: full grid cell wide, same height as a real pill. */
const SKELETON_PILL_STYLES = 'h-8 w-full rounded-full';

export type PerpsTopMoversProps = {
  /** Live markets to rank, owned by the Perps tab's market-list stream. */
  markets: PerpsMarketData[];
  /** Whether the tab's market data is still loading its first snapshot. */
  isLoading: boolean;
};

/**
 * PerpsTopMovers ranks the live perps markets by 24h price change and stacks
 * the strongest movers as a two-column grid of pills, so every ranked market is
 * reachable without a sideways scroll the desktop has no gesture for. The
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

      {/* Segmented track: ButtonFilter supplies the selected fill/contrast
          (bg-icon-default + inverse text), matching mobile's SegmentedControl.
          Inset lives on a wrapper because Box twMerges className last, so
          `p-1` on the same node would drop `paddingLeft`/`paddingRight`. */}
      <Box paddingLeft={4} paddingRight={4}>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
          className="w-full rounded-full border border-muted p-1"
          data-testid="perps-top-movers-toggle"
        >
          <ButtonFilter
            isActive={isGainers}
            onClick={handleSelectGainers}
            aria-pressed={isGainers}
            className="flex-1 h-7 rounded-full"
            data-testid="perps-top-movers-gainers"
          >
            {t('perpsTopMoversGainers')}
          </ButtonFilter>
          <ButtonFilter
            isActive={!isGainers}
            onClick={handleSelectLosers}
            aria-pressed={!isGainers}
            className="flex-1 h-7 rounded-full"
            data-testid="perps-top-movers-losers"
          >
            {t('perpsTopMoversLosers')}
          </ButtonFilter>
        </Box>
      </Box>

      {isLoading ? (
        <Box
          className={PILL_GRID_STYLES}
          data-testid="perps-top-movers-skeleton"
        >
          {SKELETON_PILL_KEYS.map((pillKey) => (
            <Skeleton
              key={`perps-top-movers-skeleton-pill-${pillKey}`}
              className={SKELETON_PILL_STYLES}
            />
          ))}
        </Box>
      ) : (
        <Box className={PILL_GRID_STYLES} data-testid="perps-top-movers-list">
          {markets.map((market) => (
            <PerpsTopMoverPill
              key={market.symbol}
              market={market}
              onPress={handleMarketClick}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PerpsTopMovers;
