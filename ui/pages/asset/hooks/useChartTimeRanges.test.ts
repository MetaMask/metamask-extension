import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useChartTimeRanges } from './useChartTimeRanges';

describe('useChartTimeRanges', () => {
  describe('when the chain is EVM', () => {
    it('returns hardcoded time ranges', () => {
      const mockStateIsEvm = {
        metamask: {
          internalAccounts: {
            accounts: {
              '81b1ead4-334c-4921-9adf-282fde539752': {
                id: '81b1ead4-334c-4921-9adf-282fde539752',
                address: '0x458036e7bc0612e9b207640dc07ca7711346aae5',
                type: 'eip155:eoa',
              },
            },
            selectedAccount: '81b1ead4-334c-4921-9adf-282fde539752',
          },
          completedOnboarding: true,
          historicalPrices: {},
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(),
        mockStateIsEvm,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y']);
    });
  });

  describe('when the chain is non-EVM', () => {
    const mockStateNonEvm = {
      metamask: {
        internalAccounts: {
          accounts: {
            '5132883f-598e-482c-a02b-84eeaa352f5b': {
              id: '5132883f-598e-482c-a02b-84eeaa352f5b',
              address: '8A4AptCThfbuknsbteHgGKXczfJpfjuVA9SLTSGaaLGC',
              type: 'solana:data-account',
            },
          },
          selectedAccount: '5132883f-598e-482c-a02b-84eeaa352f5b',
        },
        completedOnboarding: true,
      },
    };

    it('returns time ranges available in historical prices', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithHistoricalPrices = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  P4D: [],
                  P99Y: [],
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithHistoricalPrices,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P4D', 'P99Y']);
    });

    it('returns empty array for non-EVM chains when data is missing for the address/currency', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithNoHistoricalPrices = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {}, // No intervals
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithNoHistoricalPrices,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual([]);
    });

    it('filters out invalid time ranges', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithInvalidTimeRanges = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  P1D: [],
                  HEY: [], // Invalid time range
                  P1M: [],
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithInvalidTimeRanges,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P1D', 'P1M']);
    });

    it('sorts time ranges by their duration', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithUnsortedTimeRanges = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  P1M: [],
                  P1Y: [],
                  P1D: [],
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithUnsortedTimeRanges,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P1D', 'P1M', 'P1Y']);
    });

    it('normalizes time ranges', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithNormalizedTimeRanges = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  'PT12H-45M': [], // 12 hours and -45 minutes is normalized to 11 hours and 15 minutes
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithNormalizedTimeRanges,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['PT11H15M']);
    });

    it('rescales time ranges', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithRescaledTimeRanges = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  P7D: [], // 7 days is normalized to 1 week
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithRescaledTimeRanges,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P1W']);
    });

    it('removes duplicates', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithDuplicateTimeRanges = {
        metamask: {
          ...mockStateNonEvm.metamask,
          historicalPrices: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
              usd: {
                intervals: {
                  P7D: [],
                  P1W: [], // Results in duplicate time range
                },
              },
            },
          },
        },
      };

      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(address, currency),
        mockStateWithDuplicateTimeRanges,
      );
      const timeRanges = result.current;

      expect(timeRanges).toEqual(['P1W']);
    });
  });
});
