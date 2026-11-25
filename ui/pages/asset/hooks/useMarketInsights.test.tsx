import { act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type PropsWithChildren } from 'react';
import type { MarketInsightsReport } from '@metamask/ai-controllers';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as backgroundConnection from '../../../store/background-connection';
import {
  digestQueryStaleTime,
  DIGEST_QUERY_STALE_TIME_MS,
  formatRelativeTime,
  useMarketInsights,
} from './useMarketInsights';

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(
  backgroundConnection.submitRequestToBackground,
);

const mockReport: MarketInsightsReport = {
  digestId: 'digest-1',
  asset: 'eth',
  generatedAt: '2024-01-01T00:00:00Z',
  headline: 'Ethereum trends upward',
  summary: 'Ethereum is trending upward on strong volume.',
  trends: [
    {
      title: 'Bullish momentum',
      description: 'Bullish momentum continues',
      category: 'technical',
      impact: 'positive',
      articles: [],
      tweets: [],
    },
    {
      title: 'Whale accumulation',
      description: 'Whale accumulation detected',
      category: 'other',
      impact: 'neutral',
      articles: [],
      tweets: [],
    },
  ],
  sources: [],
};

const translate = (key: string, substitutions?: unknown[]): string => {
  const messages: Record<string, { message: string }> = {
    marketInsightsTimeAgoNow: { message: 'just now' },
    marketInsightsTimeAgoMinutes: { message: '$1m ago' },
    marketInsightsTimeAgoHours: { message: '$1h ago' },
    marketInsightsTimeAgoDays: { message: '$1d ago' },
  };
  const raw = messages[key]?.message ?? key;
  return (raw as string).replace('$1', String(substitutions?.[0] ?? ''));
};

describe('useMarketInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('digestQueryStaleTime', () => {
    it('returns zero for a null miss', () => {
      expect(digestQueryStaleTime({ state: { data: null } })).toBe(0);
    });

    it('returns the digest stale time for a report', () => {
      expect(digestQueryStaleTime({ state: { data: mockReport } })).toBe(
        DIGEST_QUERY_STALE_TIME_MS,
      );
    });
  });

  describe('formatRelativeTime', () => {
    it('formats minutes', () => {
      const generatedAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      expect(formatRelativeTime(generatedAt, translate)).toBe('3m ago');
    });

    it('formats hours', () => {
      const generatedAt = new Date(
        Date.now() - 2 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(generatedAt, translate)).toBe('2h ago');
    });

    it('formats days', () => {
      const generatedAt = new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatRelativeTime(generatedAt, translate)).toBe('5d ago');
    });

    it('formats sub-minute ages as just now', () => {
      const generatedAt = new Date(Date.now() - 10 * 1000).toISOString();
      expect(formatRelativeTime(generatedAt, translate)).toBe('just now');
    });

    it('returns an empty string for an invalid date', () => {
      expect(formatRelativeTime('not-a-date', translate)).toBe('');
    });
  });

  describe('useMarketInsights', () => {
    it('fetches market insights for the asset identifier', async () => {
      const fiveDaysAgo = new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const expectedReport = { ...mockReport, generatedAt: fiveDaysAgo };
      mockSubmitRequestToBackground.mockResolvedValue(expectedReport);

      const { result } = renderHookWithProvider(() =>
        useMarketInsights('eip155:1/slip44:60', true),
      );

      await waitFor(() =>
        expect(result.current.report).toEqual(expectedReport),
      );

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'AiDigestController:fetchMarketInsights',
        ['eip155:1/slip44:60'],
      );
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.timeAgo).toBe('5d ago');
    });

    it('updates the relative age while the same report stays mounted', async () => {
      jest.useFakeTimers();
      try {
        mockSubmitRequestToBackground.mockResolvedValue({
          ...mockReport,
          generatedAt: new Date().toISOString(),
        });
        const { result } = renderHookWithProvider(() =>
          useMarketInsights('eip155:1/slip44:60', true),
        );
        await waitFor(() => expect(result.current.timeAgo).toBe('just now'));

        await act(async () => jest.advanceTimersByTimeAsync(60_000));

        expect(result.current.timeAgo).toBe('1m ago');
        expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('does not fetch when disabled', async () => {
      const { result } = renderHookWithProvider(() =>
        useMarketInsights('eip155:1/slip44:60', false),
      );

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      expect(result.current.report).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('does not fetch without an asset identifier', () => {
      const { result } = renderHookWithProvider(() =>
        useMarketInsights(null, true),
      );

      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
      expect(result.current.report).toBeNull();
    });

    it('reports loading while the fetch is pending', async () => {
      let resolveFetch: (value: MarketInsightsReport | null) => void;
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      const { result } = renderHookWithProvider(() =>
        useMarketInsights('eip155:1/slip44:60', true),
      );

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveFetch(mockReport);
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.report).toEqual(mockReport);
    });

    it('exposes an error message when the fetch fails', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Digest unavailable'),
      );

      const { result } = renderHookWithProvider(() =>
        useMarketInsights('eip155:1/slip44:60', true),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.report).toBeNull();
      expect(result.current.error).toBe('Digest unavailable');
    });

    it('hides a cached error while refetching a report on remount', async () => {
      const assetId = 'eip155:1/slip44:60';
      const queryKey = ['market-insights', assetId];
      const queryClient = new QueryClient();
      queryClient.setQueryData(queryKey, null);
      await expect(
        queryClient.fetchQuery({
          queryKey,
          queryFn: () => Promise.reject(new Error('Previous fetch failed')),
        }),
      ).rejects.toThrow('Previous fetch failed');
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Current fetch failed'),
      );

      const { result } = renderHookWithProvider(
        () => useMarketInsights(assetId, true),
        undefined,
        '/',
        ({ children }: PropsWithChildren) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
      await waitFor(() =>
        expect(result.current.error).toBe('Current fetch failed'),
      );
      expect(result.current.isLoading).toBe(false);
    });

    it('treats a null report as a miss, not an error', async () => {
      mockSubmitRequestToBackground.mockResolvedValue(null);

      const { result } = renderHookWithProvider(() =>
        useMarketInsights('eip155:1/slip44:60', true),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.report).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});
