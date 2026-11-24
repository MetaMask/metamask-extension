import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaipAssetType } from '@metamask/utils';
import { buildAssetMarketInsightsRoutePath } from '../../../../../shared/lib/asset-route';
import { MARKET_INSIGHTS_EVENT_VALUE } from '../../../../../shared/constants/market-insights-events';
import { transitionForward } from '../../../../components/ui/transition';
import { useTokenSecurityData } from '../../../../hooks/useTokenSecurityData';
import { useMarketInsights } from '../../hooks/useMarketInsights';
import { MarketInsightsDisclaimerModal } from './market-insights-disclaimer-modal';
import { MarketInsightsEntryCard } from './market-insights-entry-card';
import { MarketInsightsEntryCardSkeleton } from './market-insights-entry-card-skeleton';
import { useMarketInsightsTracking } from './useMarketInsightsTracking';

export const MARKET_INSIGHTS_SECTION_TEST_ID = 'asset-market-insights';

export const MARKET_INSIGHTS_MIN_TOKEN_AGE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true when the token was created within the given minimum age
 * window. Tokens without a parseable creation date are treated as eligible
 * (not too new).
 *
 * @param created - ISO date string of token creation, if known.
 * @param minAgeDays - Minimum token age in days.
 * @returns True if the token is younger than the minimum age.
 */
export const isTokenUnderMinMarketInsightsAge = (
  created: string | undefined | null,
  minAgeDays: number,
): boolean => {
  if (!created) {
    return false;
  }
  const createdMs = Date.parse(created);
  if (!Number.isFinite(createdMs)) {
    return false;
  }
  return Date.now() - createdMs < minAgeDays * DAY_MS;
};

export type AssetMarketInsightsSectionProps = {
  /** CAIP-19 asset ID for the token shown on the asset page. */
  assetId: CaipAssetType | null | undefined;
};

/**
 * Shows the Market Insights entry card on the asset page when a report (or a
 * pending fetch) exists for the asset and the token passes the minimum-age
 * gate. Renders nothing when the asset is ineligible, the report is missing,
 * or the fetch fails.
 */
export const AssetMarketInsightsSection = ({
  assetId,
}: AssetMarketInsightsSectionProps) => {
  const navigate = useNavigate();
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(false);

  const { securityData } = useTokenSecurityData({ assetId: assetId ?? null });

  const isTokenTooNew = isTokenUnderMinMarketInsightsAge(
    securityData?.created,
    MARKET_INSIGHTS_MIN_TOKEN_AGE_DAYS,
  );
  const isCardEnabled = !isTokenTooNew;
  const marketInsightsAssetId = isCardEnabled ? (assetId ?? null) : null;

  const { report, isLoading, timeAgo } = useMarketInsights(
    marketInsightsAssetId,
    isCardEnabled,
  );

  const { cardRef, trackOpened } = useMarketInsightsTracking({
    assetId: marketInsightsAssetId,
    report,
    source: MARKET_INSIGHTS_EVENT_VALUE.SOURCE.TOKEN_DETAILS,
  });

  const shouldShowCard =
    isCardEnabled &&
    Boolean(marketInsightsAssetId) &&
    (Boolean(report) || isLoading);

  const handleCardPress = useCallback(() => {
    if (!marketInsightsAssetId) {
      return;
    }
    trackOpened();
    transitionForward(() =>
      navigate(buildAssetMarketInsightsRoutePath(marketInsightsAssetId)),
    );
  }, [marketInsightsAssetId, navigate, trackOpened]);

  if (!shouldShowCard) {
    return null;
  }

  return (
    <div
      data-testid={MARKET_INSIGHTS_SECTION_TEST_ID}
      className="mb-4"
      ref={cardRef}
    >
      {report ? (
        <MarketInsightsEntryCard
          report={report}
          timeAgo={timeAgo}
          onPress={handleCardPress}
          onDisclaimerPress={() => setIsDisclaimerVisible(true)}
        />
      ) : (
        <MarketInsightsEntryCardSkeleton />
      )}
      <MarketInsightsDisclaimerModal
        isOpen={isDisclaimerVisible}
        onClose={() => setIsDisclaimerVisible(false)}
      />
    </div>
  );
};
