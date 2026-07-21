import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import {
  resetBridgeController,
  setSelectedQuote,
  updateQuoteRequestParams,
} from '../../../../../ducks/bridge/actions';
import { getIsStxEnabled } from '../../../../../ducks/bridge/selectors';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../../../../../selectors/multichain-accounts/account-tree';
import {
  getBatchSellQuotes,
  getBatchSellQuotesValidationErrors,
} from '../../../../../ducks/batch-sell/selectors';
import { buildResults } from '../utils/buildResults';
import { buildQuoteRequestForEntry } from '../utils/buildQuoteRequest';
import { buildQuoteRequestContext } from '../utils/buildQuoteRequestContext';
import type { BatchSellQuotesConfig } from '../types';
import {
  noValidationErrors,
  buildBatchSellAsset,
  buildReceivedAsset,
  mockUseSelectorPassthrough,
  BATCH_SELL_CHAIN_ID,
} from '../../../../../../test/data/batch-sell';
import { useBatchSellQuotesFetching } from './useBatchSellQuotesFetching';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../ducks/bridge/actions', () => ({
  resetBridgeController: jest.fn(() => ({ type: 'RESET_BRIDGE_CONTROLLER' })),
  setSelectedQuote: jest.fn(() => ({ type: 'SET_SELECTED_QUOTE' })),
  updateQuoteRequestParams: jest.fn(() => ({
    type: 'UPDATE_QUOTE_REQUEST_PARAMS',
  })),
}));

jest.mock('../../../../../ducks/bridge/selectors', () => ({
  getIsStxEnabled: jest.fn(),
}));

jest.mock('../../../../../selectors/multichain-accounts/account-tree', () => ({
  getInternalAccountBySelectedAccountGroupAndCaip: jest.fn(),
}));

jest.mock('../../../../../ducks/batch-sell/selectors', () => ({
  getBatchSellQuotes: jest.fn(),
  getBatchSellQuotesValidationErrors: jest.fn(),
}));

jest.mock('../utils/buildResults', () => ({
  buildResults: jest.fn(),
}));

jest.mock('../utils/buildQuoteRequest', () => ({
  buildQuoteRequestForEntry: jest.fn(),
}));

jest.mock('../utils/buildQuoteRequestContext', () => ({
  buildQuoteRequestContext: jest.fn(),
}));

// Debounce is mocked to execute synchronously so dispatch calls are verifiable.
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn: (...args: unknown[]) => void) =>
    Object.assign((...args: unknown[]) => fn(...args), { cancel: jest.fn() }),
}));

const mockDispatch = jest.fn();
const mockUseDispatch = jest.mocked(useDispatch);
const mockUseSelector = jest.mocked(useSelector);
const mockGetInternalAccountBySelectedAccountGroupAndCaip = jest.mocked(
  getInternalAccountBySelectedAccountGroupAndCaip,
);
const mockGetIsStxEnabled = jest.mocked(getIsStxEnabled);
const mockGetBatchSellQuotes = jest.mocked(getBatchSellQuotes);
const mockGetBatchSellQuotesValidationErrors = jest.mocked(
  getBatchSellQuotesValidationErrors,
);
const mockBuildResults = jest.mocked(buildResults);
const mockBuildQuoteRequestForEntry = jest.mocked(buildQuoteRequestForEntry);
const mockBuildQuoteRequestContext = jest.mocked(buildQuoteRequestContext);

const ETH_CHAIN_ID = BATCH_SELL_CHAIN_ID;
const ASSET_A_ID = 'eip155:1/erc20:0xaaa' as CaipAssetType;
const ASSET_B_ID = 'eip155:1/erc20:0xbbb' as CaipAssetType;
const RECEIVE_ASSET_ID = 'eip155:1/erc20:0xusdc' as CaipAssetType;

const MOCK_ACCOUNT = { address: '0xdeadbeef', type: 'eip155:eoa' };

const MOCK_CONTROLLER_RESULT_NOT_FETCHED = {
  recommendedQuotes: [null, null],
  quotesLastFetchedMs: null,
  isLoading: false,
  isQuoteGoingToRefresh: false,
  quoteFetchError: null,
  quotesRefreshCount: 0,
  totalReceived: null,
  minimumReceived: null,
  quotesInitialLoadTimeMs: null,
};

const MOCK_CONTROLLER_RESULT_FETCHED = {
  ...MOCK_CONTROLLER_RESULT_NOT_FETCHED,
  quotesLastFetchedMs: 1234567890,
};

const MOCK_BUILD_RESULT = {
  quotes: {},
  receivedAsset: { id: RECEIVE_ASSET_ID, symbol: 'USDC' },
} as never;

const MOCK_PARAMS = { srcChainId: 'eip155:1' } as never;
const MOCK_CONTEXT = { slippage: 0.5 } as never;

function makeAsset(assetId: CaipAssetType) {
  return buildBatchSellAsset({
    assetId,
    chainId: ETH_CHAIN_ID,
    symbol: 'TKN',
    name: 'Token',
  });
}

const sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'] = {
  [ASSET_A_ID]: {
    asset: makeAsset(ASSET_A_ID),
    sendAmountPercent: 100,
    slippagePercent: 0.5,
    enabled: true,
  },
  [ASSET_B_ID]: {
    asset: makeAsset(ASSET_B_ID),
    sendAmountPercent: 50,
    slippagePercent: 1,
    enabled: false,
  },
};

const receivedAsset: BatchSellQuotesConfig['receivedAsset'] =
  buildReceivedAsset({ assetId: RECEIVE_ASSET_ID });

const bothEnabledConfig: BatchSellQuotesConfig = {
  sendAssetsConfig: {
    [ASSET_A_ID]: {
      asset: makeAsset(ASSET_A_ID),
      sendAmountPercent: 100,
      slippagePercent: 0.5,
      enabled: true,
    },
    [ASSET_B_ID]: {
      asset: makeAsset(ASSET_B_ID),
      sendAmountPercent: 50,
      slippagePercent: 1,
      enabled: true,
    },
  },
  receivedAsset,
};

function renderDefault(
  options: {
    enabled?: boolean;
    config?: BatchSellQuotesConfig;
  } = {},
) {
  const { enabled = true, config } = options;
  const hookConfig: BatchSellQuotesConfig = config ?? {
    sendAssetsConfig,
    receivedAsset,
  };
  return renderHook(() => useBatchSellQuotesFetching(hookConfig, { enabled }));
}

describe('useBatchSellQuotesFetching', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch.mockReset();
    mockUseDispatch.mockReturnValue(mockDispatch as never);

    mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(
      MOCK_ACCOUNT as never,
    );
    mockGetIsStxEnabled.mockReturnValue(true as never);
    mockGetBatchSellQuotes.mockReturnValue(
      MOCK_CONTROLLER_RESULT_NOT_FETCHED as never,
    );
    mockGetBatchSellQuotesValidationErrors.mockReturnValue([
      noValidationErrors,
      noValidationErrors,
    ] as never);

    // useSelector calls the inline selector with an empty state object.
    // Each inline selector calls the appropriate mocked batch-sell selector.
    mockUseSelectorPassthrough(mockUseSelector);

    mockBuildResults.mockReturnValue(MOCK_BUILD_RESULT);
    mockBuildQuoteRequestForEntry.mockReturnValue(MOCK_PARAMS);
    mockBuildQuoteRequestContext.mockReturnValue(MOCK_CONTEXT);
  });

  describe('entries', () => {
    it('maps sendAssetsConfig into a flat entries array', () => {
      const { result } = renderDefault();

      expect(result.current.entries).toHaveLength(2);
      expect(result.current.entries[0].assetId).toBe(ASSET_A_ID);
      expect(result.current.entries[0].sendAmountPercent).toBe(100);
      expect(result.current.entries[1].assetId).toBe(ASSET_B_ID);
      expect(result.current.entries[1].enabled).toBe(false);
    });
  });

  describe('isLoading', () => {
    it('returns true when enabled, has entries, and quotes have not been fetched yet', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_NOT_FETCHED,
        quotesLastFetchedMs: null,
      } as never);

      const { result } = renderDefault({ enabled: true });

      expect(result.current.isLoading).toBe(true);
    });

    it('returns true when enabled, has entries, and the controller is still loading after a fetch', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        isLoading: true,
      } as never);

      const { result } = renderDefault({ enabled: true });

      expect(result.current.isLoading).toBe(true);
    });

    it('returns false when disabled', () => {
      const { result } = renderDefault({ enabled: false });

      expect(result.current.isLoading).toBe(false);
    });

    it('returns false when sendAssetsConfig is empty (requestCount = 0)', () => {
      const { result } = renderDefault({
        config: { sendAssetsConfig: {}, receivedAsset },
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('returns false when fetched and controller is no longer loading', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        isLoading: false,
      } as never);

      const { result } = renderDefault({ enabled: true });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('data', () => {
    it('returns undefined when disabled', () => {
      const { result } = renderDefault({ enabled: false });

      expect(result.current.data).toBeUndefined();
      expect(mockBuildResults).not.toHaveBeenCalled();
    });

    it('returns undefined when sendAssetsConfig is empty', () => {
      const { result } = renderDefault({
        config: { sendAssetsConfig: {}, receivedAsset },
      });

      expect(result.current.data).toBeUndefined();
      expect(mockBuildResults).not.toHaveBeenCalled();
    });

    it('returns the result of buildResults when enabled and entries exist', () => {
      mockGetBatchSellQuotes.mockReturnValue(
        MOCK_CONTROLLER_RESULT_FETCHED as never,
      );

      const { result } = renderDefault({ enabled: true });

      expect(result.current.data).toBe(MOCK_BUILD_RESULT);
      expect(mockBuildResults).toHaveBeenCalledWith(
        expect.objectContaining({
          controllerResult: MOCK_CONTROLLER_RESULT_FETCHED,
          receivedAsset,
        }),
      );
    });
  });

  describe('refetch', () => {
    it('does not dispatch when disabled', () => {
      renderDefault({ enabled: false });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when sendAssetsConfig is empty (requestCount = 0)', () => {
      renderDefault({ config: { sendAssetsConfig: {}, receivedAsset } });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when selectedAccount has no address', () => {
      mockGetInternalAccountBySelectedAccountGroupAndCaip.mockReturnValue(
        null as never,
      );

      renderDefault({ enabled: true });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not dispatch when all buildQuoteRequestForEntry calls return undefined', () => {
      mockBuildQuoteRequestForEntry.mockReturnValue(undefined as never);

      renderDefault({ enabled: true });

      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('dispatches setSelectedQuote and updateQuoteRequestParams when all conditions are met', () => {
      renderDefault({ enabled: true, config: bothEnabledConfig });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SELECTED_QUOTE' });
      expect(setSelectedQuote).toHaveBeenCalledWith(null);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_QUOTE_REQUEST_PARAMS',
      });
      expect(updateQuoteRequestParams).toHaveBeenCalledTimes(2);
    });

    it('passes the correct index and total to updateQuoteRequestParams', () => {
      renderDefault({ enabled: true, config: bothEnabledConfig });

      expect(updateQuoteRequestParams).toHaveBeenCalledWith(
        MOCK_PARAMS,
        MOCK_CONTEXT,
        0,
        2,
      );
      expect(updateQuoteRequestParams).toHaveBeenCalledWith(
        MOCK_PARAMS,
        MOCK_CONTEXT,
        1,
        2,
      );
    });

    it('excludes disabled entries from the quote requests sent to the controller', () => {
      // Default config has ASSET_A enabled and ASSET_B disabled, so only one
      // request (reindexed to 0, total 1) should be dispatched.
      renderDefault({ enabled: true });

      expect(updateQuoteRequestParams).toHaveBeenCalledTimes(1);
      expect(updateQuoteRequestParams).toHaveBeenCalledWith(
        MOCK_PARAMS,
        MOCK_CONTEXT,
        0,
        1,
      );
    });

    it('filters out entries for which buildQuoteRequestForEntry returns undefined and reindexes the rest', () => {
      // Both entries enabled, but the second yields no params, so the surviving
      // request is reindexed to 0 with a total of 1.
      mockBuildQuoteRequestForEntry
        .mockReturnValueOnce(MOCK_PARAMS)
        .mockReturnValueOnce(undefined as never);

      renderDefault({ enabled: true, config: bothEnabledConfig });

      expect(updateQuoteRequestParams).toHaveBeenCalledTimes(1);
      expect(updateQuoteRequestParams).toHaveBeenCalledWith(
        MOCK_PARAMS,
        MOCK_CONTEXT,
        0,
        1,
      );
    });

    it('can be called manually via the exposed refetch function', () => {
      const { result } = renderDefault({ enabled: true });

      mockDispatch.mockClear();

      act(() => {
        result.current.refetch();
      });

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SELECTED_QUOTE' });
    });
  });

  describe('areQuotesRefreshExpired', () => {
    it('returns true when not loading, has been fetched, and quote is not going to refresh', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        isLoading: false,
        isQuoteGoingToRefresh: false,
      } as never);

      const { result } = renderDefault({ enabled: true });

      expect(result.current.areQuotesRefreshExpired).toBe(true);
    });

    it('returns false when the hook is loading', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_NOT_FETCHED,
        quotesLastFetchedMs: null,
        isLoading: false,
      } as never);

      const { result } = renderDefault({ enabled: true });

      // isLoading = true (enabled && requestCount > 0 && !hasEverFetched)
      expect(result.current.areQuotesRefreshExpired).toBe(false);
    });

    it('returns false when quotes have never been fetched', () => {
      // Disable so isLoading is false, but quotesLastFetchedMs stays null
      const { result } = renderDefault({ enabled: false });

      expect(result.current.areQuotesRefreshExpired).toBe(false);
    });

    it('returns false when the quote is going to refresh', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        isLoading: false,
        isQuoteGoingToRefresh: true,
      } as never);

      const { result } = renderDefault({ enabled: false });

      expect(result.current.areQuotesRefreshExpired).toBe(false);
    });
  });

  describe('return values', () => {
    it('passes through quotesLastFetchedMs from the controller result', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        quotesLastFetchedMs: 9999,
      } as never);

      const { result } = renderDefault();

      expect(result.current.quotesLastFetchedMs).toBe(9999);
    });

    it('passes through isQuoteGoingToRefresh from the controller result', () => {
      mockGetBatchSellQuotes.mockReturnValue({
        ...MOCK_CONTROLLER_RESULT_FETCHED,
        isQuoteGoingToRefresh: true,
      } as never);

      const { result } = renderDefault({ enabled: false });

      expect(result.current.isQuoteGoingToRefresh).toBe(true);
    });
  });

  describe('cleanup on unmount', () => {
    it('dispatches resetBridgeController when the component unmounts', () => {
      const { unmount } = renderDefault({ enabled: true });

      mockDispatch.mockClear();
      unmount();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RESET_BRIDGE_CONTROLLER',
      });
      expect(resetBridgeController).toHaveBeenCalled();
    });
  });
});
