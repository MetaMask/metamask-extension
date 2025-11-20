import { CaipAssetType } from '@metamask/utils';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useChartTimeRanges } from './useChartTimeRanges';

describe('useChartTimeRanges', () => {
  describe('when the asset type is EVM', () => {
    const mockState = {
      metamask: {
        historicalPrices: {},
      },
    };
    const arrangeAct = (assetType?: CaipAssetType, currency?: string) => {
      const { result } = renderHookWithProvider(
        () => useChartTimeRanges(assetType, currency),
        mockState,
      );
      const timeRanges = result.current;
      return timeRanges;
    };

    it('returns hardcoded timeranges', () => {
      const timeRanges = arrangeAct(
        'eip155:1/erc20:0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        'USD',
      );
      expect(timeRanges).toEqual(['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y']);
    });

    it('returns hardcoded timestamps on missing asset type', () => {
      jest.spyOn(console, 'warn').mockImplementation(jest.fn());
      const timeRanges = arrangeAct(undefined, 'USD');
      expect(timeRanges).toEqual(['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y']);
    });

    it('returns hardcoded timestamps on missing currency', () => {
      jest.spyOn(console, 'warn').mockImplementation(jest.fn());
      const timeRanges = arrangeAct(
        'eip155:1/erc20:0x6982508145454Ce325dDbE47a25d4ec3d2311933',
        undefined,
      );
      expect(timeRanges).toEqual(['P1D', 'P1W', 'P1M', 'P3M', 'P1Y', 'P1000Y']);
    });
  });

  describe('when the chain is non-EVM', () => {
    it('returns time ranges available in historical prices', () => {
      const address = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
      const currency = 'usd';

      const mockStateWithHistoricalPrices = {
        metamask: {
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
  });
});
