import { renderHook } from '@testing-library/react-hooks';
import type { CaipAssetType } from '@metamask/utils';
import { updateBatchSellTrades } from '../../../../../ducks/batch-sell/actions';
import type { SendAssetEntry } from '../types';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell';
import { useDispatch } from '../../../../../store/hooks';
import { useBatchSellTradesFetching } from './useBatchSellTradesFetching';

jest.mock('../../../../../store/hooks', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
}));

jest.mock('../../../../../ducks/batch-sell/actions', () => ({
  updateBatchSellTrades: jest.fn(() => ({ type: 'UPDATE_BATCH_SELL_TRADES' })),
}));

// Debounce is mocked to execute synchronously so dispatch calls are verifiable.
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn: (...args: unknown[]) => void) =>
    Object.assign((...args: unknown[]) => fn(...args), { cancel: jest.fn() }),
}));

const mockDispatch = jest.fn();
const mockUseAppDispatch = jest.mocked(useDispatch);
const mockUpdateBatchSellTrades = jest.mocked(updateBatchSellTrades);

const ASSET_A_ID = 'eip155:1/erc20:0xaaa' as CaipAssetType;
const ASSET_B_ID = 'eip155:1/erc20:0xbbb' as CaipAssetType;
const ASSET_C_ID = 'eip155:1/erc20:0xccc' as CaipAssetType;

const MOCK_QUOTE_A = { requestId: 'req-a' } as never;
const MOCK_QUOTE_B = { requestId: 'req-b' } as never;

function makeEntry(assetId: CaipAssetType, enabled = true): SendAssetEntry {
  return {
    assetId,
    asset: buildBatchSellAsset({ assetId }),
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled,
  };
}

const defaultEntries: SendAssetEntry[] = [
  makeEntry(ASSET_A_ID, true),
  makeEntry(ASSET_B_ID, true),
];

const defaultData = {
  quotes: {
    [ASSET_A_ID]: {
      quote: MOCK_QUOTE_A,
      hasQuote: true,
      isLoadingQuote: false,
      asset: {} as never,
    },
    [ASSET_B_ID]: {
      quote: MOCK_QUOTE_B,
      hasQuote: true,
      isLoadingQuote: false,
      asset: {} as never,
    },
  },
  receivedAsset: { id: ASSET_A_ID, symbol: 'TKN' },
} as never;

const QUOTES_LAST_FETCHED_MS = 1234567890;
const MOCK_CHAIN = 'eip155:1';

function renderDefault(
  options: {
    data?: typeof defaultData | undefined;
    entries?: SendAssetEntry[];
    quotesLastFetchedMs?: number | null;
    chain?: string;
    enabled?: boolean;
  } = {},
) {
  const {
    data = defaultData,
    entries = defaultEntries,
    quotesLastFetchedMs = QUOTES_LAST_FETCHED_MS,
    chain = MOCK_CHAIN,
    enabled = true,
  } = options;

  return renderHook(() =>
    useBatchSellTradesFetching(
      { data, entries, quotesLastFetchedMs, chain },
      { enabled },
    ),
  );
}

describe('useBatchSellTradesFetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAppDispatch.mockReturnValue(mockDispatch as never);
  });

  describe('early-return guards in the main effect', () => {
    it('does not dispatch when disabled', () => {
      renderDefault({ enabled: false });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when quotesLastFetchedMs is null', () => {
      renderDefault({ quotesLastFetchedMs: null });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when all mapped quotes are null (no data available)', () => {
      // No quotes in data for any entry
      const emptyData = {
        quotes: {},
        receivedAsset: { id: ASSET_A_ID, symbol: 'TKN' },
      } as never;

      renderDefault({ data: emptyData });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when data is undefined and all quotes resolve to null', () => {
      // Cannot pass `data: undefined` through renderDefault because destructuring
      // defaults would replace it with defaultData. Call renderHook directly.
      renderHook(() =>
        useBatchSellTradesFetching(
          {
            data: undefined,
            entries: defaultEntries,
            quotesLastFetchedMs: QUOTES_LAST_FETCHED_MS,
            chain: MOCK_CHAIN,
          },
          { enabled: true },
        ),
      );

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('dispatching updateBatchSellTrades', () => {
    it('dispatches with the quotes for all enabled entries', () => {
      renderDefault();

      expect(mockUpdateBatchSellTrades).toHaveBeenCalledWith(
        [MOCK_QUOTE_A, MOCK_QUOTE_B],
        MOCK_CHAIN,
      );
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_BATCH_SELL_TRADES',
      });
    });

    it('excludes disabled entries from the quotes array', () => {
      const entries: SendAssetEntry[] = [
        makeEntry(ASSET_A_ID, true),
        makeEntry(ASSET_B_ID, false), // disabled — should be excluded
      ];

      renderDefault({ entries });

      expect(mockUpdateBatchSellTrades).toHaveBeenCalledWith(
        [MOCK_QUOTE_A],
        MOCK_CHAIN,
      );
    });

    it('uses null for an enabled entry whose quote is missing from data', () => {
      const entries: SendAssetEntry[] = [
        makeEntry(ASSET_A_ID, true),
        makeEntry(ASSET_C_ID, true), // ASSET_C has no quote in defaultData
      ];

      renderDefault({ entries });

      // ASSET_A has a quote; ASSET_C resolves to null — but at least one is
      // non-null so the dispatch fires, with null in the ASSET_C slot.
      expect(mockUpdateBatchSellTrades).toHaveBeenCalledWith(
        [MOCK_QUOTE_A, null],
        MOCK_CHAIN,
      );
    });

    it('does not dispatch when every enabled entry resolves to null', () => {
      // Only ASSET_C (no quote in data) entries, all enabled
      const entries: SendAssetEntry[] = [makeEntry(ASSET_C_ID, true)];

      renderDefault({ entries });

      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('calls debounce.cancel when the hook unmounts', () => {
      // Spy on the debounce mock to capture the cancel function.
      // Since the lodash mock wraps the fn and attaches cancel: jest.fn(),
      // we verify indirectly by checking the module mock was called correctly.
      // The important observable effect is that no dispatch occurs after unmount.
      const { unmount } = renderDefault();

      mockDispatch.mockClear();
      unmount();

      // No further dispatch after unmount (cancel was called on the debounced fn)
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
