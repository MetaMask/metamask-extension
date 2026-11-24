import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import { submitRequestToBackground } from '../../../store/background-connection';
import { useI18nContext } from '../../../hooks/useI18nContext';

const MARKET_INSIGHTS_QUERY_KEY = 'market-insights';

/**
 * Digest query freshness. React Query owns the cache; the
 *  AiDigestController is a passthrough and does not cache.
 */
export const DIGEST_QUERY_STALE_TIME_MS = 10 * 60 * 1000;
export const DIGEST_QUERY_GC_TIME_MS = DIGEST_QUERY_STALE_TIME_MS;

/**
 * Dynamic `staleTime` so a successful digest payload stays fresh for 10
 * minutes, while a `null` 404 miss is immediately stale and retried on remount.
 *
 * @param query - React Query cache entry.
 * @param query.state - Cached query state.
 * @param query.state.data - Cached query data, `null` for a miss.
 * @returns Stale time in milliseconds.
 */
export const digestQueryStaleTime = (query: {
  state: { data: unknown };
}): number =>
  query.state.data === null || query.state.data === undefined
    ? 0
    : DIGEST_QUERY_STALE_TIME_MS;

/**
 * Resolves the hook's error message from the query error, if any.
 *
 * @param isQueryEnabled - Whether the query is enabled.
 * @param report - The resolved report, if any.
 * @param error - The query error, if any.
 * @returns The error message, or null when there is no error.
 */
const resolveErrorMessage = (
  isQueryEnabled: boolean,
  report: MarketInsightsReport | null,
  error: unknown,
): string | null => {
  if (!isQueryEnabled || report !== null || !error) {
    return null;
  }
  return error instanceof Error ? error.message : 'Failed to fetch insights';
};

/**
 * Result of the useMarketInsights hook.
 */
export type UseMarketInsightsResult = {
  /** The market insights report, or null if unavailable */
  report: MarketInsightsReport | null;
  /**
   * Whether this observer still lacks a settled report. A remount of a
   *  cached `null` miss or error stays loading until that observer fetches.
   */
  isLoading: boolean;
  /** Error message if the data fetch failed */
  error: string | null;
  /** Relative time since the report was generated (e.g., "3m ago") */
  timeAgo: string;
};

/**
 * Formats an ISO date as a compact relative age label (e.g. "3m ago").
 *
 * @param dateString - ISO date string to format.
 * @param t - Translation function.
 * @param now - Current timestamp in milliseconds.
 * @returns The formatted relative time, or an empty string if the date is invalid.
 */
export const formatRelativeTime = (
  dateString: string,
  t: ReturnType<typeof useI18nContext>,
  now = Date.now(),
): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return t('marketInsightsTimeAgoNow');
  }
  if (diffMins < 60) {
    return t('marketInsightsTimeAgoMinutes', [String(diffMins)]);
  }
  if (diffHours < 24) {
    return t('marketInsightsTimeAgoHours', [String(diffHours)]);
  }
  return t('marketInsightsTimeAgoDays', [String(diffDays)]);
};

/**
 * Fetches market insights for a given asset through the background
 * AiDigestController.
 *
 * React Query owns the 10-minute cache; a `null` miss is not cached as a hit.
 *
 * @param assetIdentifier - The asset identifier: a CAIP-19 ID (e.g.
 * "eip155:1/slip44:60") or a perps market symbol (e.g. "ETH").
 * @param isEnabled - Whether market insights requests are enabled.
 * @returns Market insights report data with loading/error states.
 */
export const useMarketInsights = (
  assetIdentifier: string | undefined | null,
  isEnabled = false,
): UseMarketInsightsResult => {
  const t = useI18nContext();
  const queryClient = useQueryClient();
  const queryAssetIdentifier = assetIdentifier ?? '';
  const isQueryEnabled = isEnabled && queryAssetIdentifier.length > 0;

  const query = useQuery<MarketInsightsReport | null, unknown>({
    queryKey: [MARKET_INSIGHTS_QUERY_KEY, queryAssetIdentifier],
    queryFn: async () =>
      (await submitRequestToBackground<MarketInsightsReport | null>(
        'AiDigestController:fetchMarketInsights',
        [queryAssetIdentifier],
      )) ?? null,
    enabled: isQueryEnabled,
    retry: false,
    networkMode: 'always',
    staleTime: digestQueryStaleTime,
    gcTime: DIGEST_QUERY_GC_TIME_MS,
  });

  useEffect(() => {
    if (!isQueryEnabled) {
      queryClient.removeQueries({
        queryKey: [MARKET_INSIGHTS_QUERY_KEY, queryAssetIdentifier],
        exact: true,
      });
    }
  }, [isQueryEnabled, queryAssetIdentifier, queryClient]);

  const report = isQueryEnabled ? (query.data ?? null) : null;
  const error = resolveErrorMessage(isQueryEnabled, report, query.error);
  // A remount of a cached `null` miss or error has no report and has not
  // fetched on this observer (`isFetchedAfterMount` is false). Keep loading
  // until that first fetch settles so the skeleton does not flash off and on.
  const isLoading = isQueryEnabled && !report && !query.isFetchedAfterMount;

  const hasReport = report !== null;
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!hasReport) {
      return undefined;
    }
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [hasReport]);

  const timeAgo = report ? formatRelativeTime(report.generatedAt, t, now) : '';

  return { report, isLoading, error, timeAgo };
};
