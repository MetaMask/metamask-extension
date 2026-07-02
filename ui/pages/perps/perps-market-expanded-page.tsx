import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import {
  selectPerpsIsTestnet,
  selectPerpsTradeConfigurations,
} from '../../selectors/perps-controller';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { usePerpsLiveMarketData } from '../../hooks/perps/stream';
import { usePerpsMarketInfo } from '../../hooks/perps/usePerpsMarketInfo';
import { usePerpsMeasurement } from '../../hooks/perps/usePerpsMeasurement';
import { useI18nContext } from '../../hooks/useI18nContext';
import { safeDecodeURIComponent } from '../../components/app/perps/utils';
import { PerpsGeoBlockModal } from '../../components/app/perps/perps-geo-block-modal';
import {
  PerpsExpandedChartPanel,
  PerpsExpandedHeader,
  PerpsExpandedOrderBookPanel,
  PerpsExpandedPositionsPanel,
  PerpsExpandedSkeleton,
  PerpsExpandedTradePanel,
} from '../../components/app/perps/perps-market-expanded';

/** Fallback max leverage when market metadata has not loaded. */
const DEFAULT_MAX_LEVERAGE = 50;
/** Default leverage applied to a fresh order when none is saved. */
const DEFAULT_LEVERAGE = 3;
/**
 * Three-column terminal grid: chart | order book | trade ticket.
 * Magic widths live here, named, instead of inline in JSX.
 */
const TERMINAL_GRID_COLUMNS =
  'minmax(420px, 1fr) minmax(260px, 0.5fr) minmax(320px, 0.5fr)';

/**
 * Full-width perps trading terminal rendered in a browser tab.
 *
 * This page is a thin orchestrator: it resolves the market and renders the
 * panels. Every high-frequency live subscription (price, candles, order book,
 * positions, orders, account) lives inside the individual panels, so a tick on
 * one stream re-renders only the panel that consumes it — not the whole tree.
 */
const PerpsMarketExpandedPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);

  const decodedSymbol = useMemo(
    () => (symbol ? safeDecodeURIComponent(symbol) : undefined),
    [symbol],
  );

  // Page-level market-list subscription is used only to resolve the
  // existence / loading guard. Panels do not receive any live-market data as
  // props, so a market tick re-renders only this lightweight orchestrator.
  const { markets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();
  const market = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    const target = decodedSymbol.toLowerCase();
    return markets.find((m) => m.symbol.toLowerCase() === target);
  }, [decodedSymbol, markets]);

  // Static market metadata (numeric maxLeverage, szDecimals) from a cached
  // fetch that does not tick — safe to pass down to memoized panels.
  const marketInfo = usePerpsMarketInfo(decodedSymbol ?? '');

  const maxLeverage = useMemo(() => {
    if (marketInfo?.maxLeverage) {
      return marketInfo.maxLeverage;
    }
    if (market?.maxLeverage) {
      return parseInt(market.maxLeverage.replace('x', ''), 10);
    }
    return DEFAULT_MAX_LEVERAGE;
  }, [marketInfo?.maxLeverage, market?.maxLeverage]);

  const maxLeverageLabel = marketInfo?.maxLeverage
    ? `${marketInfo.maxLeverage}x`
    : market?.maxLeverage;

  const initialLeverage = useMemo(() => {
    if (!decodedSymbol) {
      return undefined;
    }
    const env = isTestnet ? 'testnet' : 'mainnet';
    const saved = tradeConfigurations[env]?.[decodedSymbol]?.leverage;
    return Math.min(saved ?? DEFAULT_LEVERAGE, maxLeverage);
  }, [decodedSymbol, isTestnet, tradeConfigurations, maxLeverage]);

  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const openGeoBlockModal = useCallback(() => setIsGeoBlockModalOpen(true), []);
  const closeGeoBlockModal = useCallback(
    () => setIsGeoBlockModalOpen(false),
    [],
  );

  usePerpsMeasurement('PerpsMarketExpandedLoaded', !marketsLoading);

  if (!isPerpsExperienceAvailable || !decodedSymbol) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  // Wait for the markets stream to hydrate before deciding the symbol is
  // missing. A fresh (cold) tab opened from the Expand button hydrates
  // asynchronously; `isInitialLoading` stays true until the first emission, so
  // redirecting during that window would bounce the user before data arrives.
  // Once loading completes we intentionally fall through even on an empty list
  // so a failed/empty fetch lands on the not-found terminal instead of an
  // endless skeleton (mirrors the popup market-detail page).
  if (marketsLoading) {
    return <PerpsExpandedSkeleton />;
  }

  if (!market) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={4}
        className="h-screen w-full bg-background-default"
        data-testid="perps-market-expanded-not-found"
      >
        <Text variant={TextVariant.HeadingMd}>{t('perpsMarketNotFound')}</Text>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Sm}
          onClick={() =>
            navigate({ pathname: DEFAULT_ROUTE, search: 'tab=perps' })
          }
        >
          {t('back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-screen w-full overflow-hidden bg-background-default"
      data-testid="perps-market-expanded-page"
    >
      <PerpsExpandedHeader
        symbol={decodedSymbol}
        maxLeverageLabel={maxLeverageLabel}
      />

      <div
        className="grid min-h-0 flex-1 overflow-hidden max-[980px]:overflow-y-auto"
        style={{ gridTemplateColumns: TERMINAL_GRID_COLUMNS }}
      >
        <PerpsExpandedChartPanel symbol={decodedSymbol} />
        <PerpsExpandedOrderBookPanel symbol={decodedSymbol} />
        <PerpsExpandedTradePanel
          symbol={decodedSymbol}
          maxLeverage={maxLeverage}
          initialLeverage={initialLeverage}
          sizeDecimals={marketInfo?.szDecimals}
          onGeoBlocked={openGeoBlockModal}
        />
      </div>

      <PerpsExpandedPositionsPanel symbol={decodedSymbol} />

      <PerpsGeoBlockModal
        isOpen={isGeoBlockModalOpen}
        onClose={closeGeoBlockModal}
      />
    </Box>
  );
};

export default PerpsMarketExpandedPage;
