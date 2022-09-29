import nock from 'nock';

import { MOCKS, createSwapsMockStore } from '../../../test/jest';
import { setSwapsLiveness, setSwapsFeatureFlags } from '../../store/actions';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setStorageItem } from '../../../shared/lib/storage-helpers';
import * as swaps from './swaps';

jest.mock('../../store/actions.js', () => ({
  setSwapsLiveness: jest.fn(),
  setSwapsFeatureFlags: jest.fn(),
  fetchSmartTransactionsLiveness: jest.fn(),
  getTransactions: jest.fn(() => {
    return [];
  }),
}));

const providerState = {
  chainId: '0x1',
  nickname: '',
  rpcPrefs: {},
  rpcUrl: '',
  ticker: 'ETH',
  type: 'mainnet',
};

describe('Ducks - Swaps', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchSwapsLivenessAndFeatureFlags', () => {
    const cleanFeatureFlagApiCache = () => {
      setStorageItem(
        'cachedFetch:https://swap.metaswap.codefi.network/featureFlags',
        null,
      );
    };

    afterEach(() => {
      cleanFeatureFlagApiCache();
    });

    const mockFeatureFlagsApiResponse = ({
      featureFlagsResponse,
      replyWithError = false,
    } = {}) => {
      const apiNock = nock('https://swap.metaswap.codefi.network').get(
        '/featureFlags',
      );
      if (replyWithError) {
        return apiNock.replyWithError({
          message: 'Server error. Try again later',
          code: 'serverSideError',
        });
      }
      return apiNock.reply(200, featureFlagsResponse);
    };

    const createGetState = () => {
      return () => ({
        metamask: {
          provider: { ...providerState },
          from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
        },
      });
    };

    it('checks that Swaps for ETH are enabled and can use new API', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(4);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(setSwapsFeatureFlags).toHaveBeenCalledWith(featureFlagsResponse);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled for API v2 and enabled for API v1', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      featureFlagsResponse.ethereum.extensionActive = false;
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(4);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(setSwapsFeatureFlags).toHaveBeenCalledWith(featureFlagsResponse);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled for API v1 and v2', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      featureFlagsResponse.ethereum.extensionActive = false;
      featureFlagsResponse.ethereum.fallbackToV1 = false;
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(4);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(setSwapsFeatureFlags).toHaveBeenCalledWith(featureFlagsResponse);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled if the /featureFlags API call throws an error', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
      };
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        replyWithError: true,
      });
      const swapsLiveness = await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('only calls the API once and returns response from cache for the second call', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      const featureFlagApiNock2 = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLivenessAndFeatureFlags()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock2.isDone()).toBe(false); // Second API call wasn't made, cache was used instead.
      expect(mockDispatch).toHaveBeenCalledTimes(8);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(setSwapsFeatureFlags).toHaveBeenCalledWith(featureFlagsResponse);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });
  });

  describe('getCustomMaxPriorityFeePerGas', () => {
    it('returns "customMaxPriorityFeePerGas"', () => {
      const state = createSwapsMockStore();
      const customMaxPriorityFeePerGas = '3';
      state.metamask.swapsState.customMaxPriorityFeePerGas =
        customMaxPriorityFeePerGas;
      expect(swaps.getCustomMaxPriorityFeePerGas(state)).toBe(
        customMaxPriorityFeePerGas,
      );
    });
  });

  describe('getSwapsNetworkConfig', () => {
    it('returns Swaps network config', () => {
      const state = createSwapsMockStore();
      const {
        swapsQuoteRefreshTime,
        swapsQuotePrefetchingRefreshTime,
        swapsStxGetTransactionsRefreshTime,
        swapsStxBatchStatusRefreshTime,
        swapsStxStatusDeadline,
        swapsStxMaxFeeMultiplier,
      } = state.metamask.swapsState;
      const swapsNetworkConfig = swaps.getSwapsNetworkConfig(state);
      expect(swapsNetworkConfig).toMatchObject({
        quoteRefreshTime: swapsQuoteRefreshTime,
        quotePrefetchingRefreshTime: swapsQuotePrefetchingRefreshTime,
        stxGetTransactionsRefreshTime: swapsStxGetTransactionsRefreshTime,
        stxBatchStatusRefreshTime: swapsStxBatchStatusRefreshTime,
        stxStatusDeadline: swapsStxStatusDeadline,
        stxMaxFeeMultiplier: swapsStxMaxFeeMultiplier,
      });
    });
  });

  describe('getAggregatorMetadata', () => {
    it('returns agg metadata', () => {
      const state = createSwapsMockStore();
      expect(swaps.getAggregatorMetadata(state)).toBe(
        state.swaps.aggregatorMetadata,
      );
    });
  });

  describe('getBalanceError', () => {
    it('returns a balance error', () => {
      const state = createSwapsMockStore();
      state.swaps.balanceError = 'balanceError';
      expect(swaps.getBalanceError(state)).toBe(state.swaps.balanceError);
    });
  });

  describe('getFromToken', () => {
    it('returns fromToken', () => {
      const state = createSwapsMockStore();
      expect(swaps.getFromToken(state)).toBe(state.swaps.fromToken);
    });
  });

  describe('getFromTokenError', () => {
    it('returns fromTokenError', () => {
      const state = createSwapsMockStore();
      state.swaps.fromTokenError = 'fromTokenError';
      expect(swaps.getFromTokenError(state)).toBe(state.swaps.fromTokenError);
    });
  });

  describe('getFromTokenInputValue', () => {
    it('returns fromTokenInputValue', () => {
      const state = createSwapsMockStore();
      expect(swaps.getFromTokenInputValue(state)).toBe(
        state.swaps.fromTokenInputValue,
      );
    });
  });

  describe('getIsFeatureFlagLoaded', () => {
    it('returns isFeatureFlagLoaded', () => {
      const state = createSwapsMockStore();
      expect(swaps.getIsFeatureFlagLoaded(state)).toBe(
        state.swaps.isFeatureFlagLoaded,
      );
    });
  });

  describe('getSwapsSTXLoading', () => {
    it('returns swapsSTXLoading', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsSTXLoading(state)).toBe(state.swaps.swapsSTXLoading);
    });
  });

  describe('getMaxSlippage', () => {
    it('returns maxSlippage', () => {
      const state = createSwapsMockStore();
      expect(swaps.getMaxSlippage(state)).toBe(state.swaps.maxSlippage);
    });
  });

  describe('getTopAssets', () => {
    it('returns topAssets', () => {
      const state = createSwapsMockStore();
      expect(swaps.getTopAssets(state)).toBe(state.swaps.topAssets);
    });
  });

  describe('getToToken', () => {
    it('returns toToken', () => {
      const state = createSwapsMockStore();
      expect(swaps.getToToken(state)).toBe(state.swaps.toToken);
    });
  });

  describe('getFetchingQuotes', () => {
    it('returns fetchingQuotes', () => {
      const state = createSwapsMockStore();
      expect(swaps.getFetchingQuotes(state)).toBe(state.swaps.fetchingQuotes);
    });
  });

  describe('getQuotesFetchStartTime', () => {
    it('returns quotesFetchStartTime', () => {
      const state = createSwapsMockStore();
      expect(swaps.getQuotesFetchStartTime(state)).toBe(
        state.swaps.quotesFetchStartTime,
      );
    });
  });

  describe('getReviewSwapClickedTimestamp', () => {
    it('returns reviewSwapClickedTimestamp', () => {
      const state = createSwapsMockStore();
      expect(swaps.getReviewSwapClickedTimestamp(state)).toBe(
        state.swaps.reviewSwapClickedTimestamp,
      );
    });
  });

  describe('getSwapsCustomizationModalPrice', () => {
    it('returns customGas.price', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsCustomizationModalPrice(state)).toBe(
        state.swaps.customGas.price,
      );
    });
  });

  describe('getSwapsCustomizationModalLimit', () => {
    it('returns customGas.limit', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsCustomizationModalLimit(state)).toBe(
        state.swaps.customGas.limit,
      );
    });
  });

  describe('swapGasPriceEstimateIsLoading', () => {
    it('returns true for swapGasPriceEstimateIsLoading', () => {
      const state = createSwapsMockStore();
      state.swaps.customGas.loading = swaps.GAS_PRICES_LOADING_STATES.LOADING;
      expect(swaps.swapGasPriceEstimateIsLoading(state)).toBe(true);
    });
  });

  describe('swapGasEstimateLoadingHasFailed', () => {
    it('returns true for swapGasEstimateLoadingHasFailed', () => {
      const state = createSwapsMockStore();
      state.swaps.customGas.loading = swaps.GAS_PRICES_LOADING_STATES.INITIAL;
      expect(swaps.swapGasEstimateLoadingHasFailed(state)).toBe(true);
    });
  });

  describe('getSwapGasPriceEstimateData', () => {
    it('returns customGas.priceEstimates', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapGasPriceEstimateData(state)).toBe(
        state.swaps.customGas.priceEstimates,
      );
    });
  });

  describe('getSwapsFallbackGasPrice', () => {
    it('returns customGas.fallBackPrice', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsFallbackGasPrice(state)).toBe(
        state.swaps.customGas.fallBackPrice,
      );
    });
  });

  describe('getCurrentSmartTransactionsError', () => {
    it('returns currentSmartTransactionsError', () => {
      const state = createSwapsMockStore();
      state.swaps.currentSmartTransactionsError =
        'currentSmartTransactionsError';
      expect(swaps.getCurrentSmartTransactionsError(state)).toBe(
        state.swaps.currentSmartTransactionsError,
      );
    });
  });

  describe('getCurrentSmartTransactionsErrorMessageDismissed', () => {
    it('returns currentSmartTransactionsErrorMessageDismissed', () => {
      const state = createSwapsMockStore();
      expect(
        swaps.getCurrentSmartTransactionsErrorMessageDismissed(state),
      ).toBe(state.swaps.currentSmartTransactionsErrorMessageDismissed);
    });
  });

  describe('shouldShowCustomPriceTooLowWarning', () => {
    it('returns false for showCustomPriceTooLowWarning', () => {
      const state = createSwapsMockStore();
      expect(swaps.shouldShowCustomPriceTooLowWarning(state)).toBe(false);
    });
  });

  describe('getSwapsFeatureIsLive', () => {
    it('returns true for "swapsFeatureIsLive"', () => {
      const state = createSwapsMockStore();
      const swapsFeatureIsLive = true;
      state.metamask.swapsState.swapsFeatureIsLive = swapsFeatureIsLive;
      expect(swaps.getSwapsFeatureIsLive(state)).toBe(swapsFeatureIsLive);
    });

    it('returns false for "swapsFeatureIsLive"', () => {
      const state = createSwapsMockStore();
      const swapsFeatureIsLive = false;
      state.metamask.swapsState.swapsFeatureIsLive = swapsFeatureIsLive;
      expect(swaps.getSwapsFeatureIsLive(state)).toBe(swapsFeatureIsLive);
    });
  });

  describe('getSmartTransactionsError', () => {
    it('returns smartTransactionsError', () => {
      const state = createSwapsMockStore();
      state.appState.smartTransactionsError = 'stxError';
      expect(swaps.getSmartTransactionsError(state)).toBe(
        state.appState.smartTransactionsError,
      );
    });
  });

  describe('getSmartTransactionsErrorMessageDismissed', () => {
    it('returns smartTransactionsErrorMessageDismissed', () => {
      const state = createSwapsMockStore();
      state.appState.smartTransactionsErrorMessageDismissed = true;
      expect(swaps.getSmartTransactionsErrorMessageDismissed(state)).toBe(
        state.appState.smartTransactionsErrorMessageDismissed,
      );
    });
  });

  describe('getSmartTransactionsEnabled', () => {
    it('returns true if feature flag is enabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if feature flag is disabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.swapsFeatureFlags.smartTransactions.extensionActive = false;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW, STX liveness is false and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.smartTransactionsState.liveness = false;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, is a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.keyrings[0].type = 'Trezor Hardware';
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW and is Polygon network', () => {
      const state = createSwapsMockStore();
      state.metamask.provider.chainId = CHAIN_IDS.POLYGON;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW and is BSC network', () => {
      const state = createSwapsMockStore();
      state.metamask.provider.chainId = CHAIN_IDS.BSC;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns true if feature flag is enabled, not a HW and is Goerli network', () => {
      const state = createSwapsMockStore();
      state.metamask.provider.chainId = CHAIN_IDS.GOERLI;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if feature flag is missing', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.swapsFeatureFlags = {};
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });
  });

  describe('getCurrentSmartTransactionsEnabled', () => {
    it('returns true if STX are enabled and there is no current STX error', () => {
      const state = createSwapsMockStore();
      expect(swaps.getCurrentSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if STX are enabled and there is an current STX error', () => {
      const state = createSwapsMockStore();
      state.swaps.currentSmartTransactionsError =
        'currentSmartTransactionsError';
      expect(swaps.getCurrentSmartTransactionsEnabled(state)).toBe(false);
    });
  });

  describe('getSwapsQuoteRefreshTime', () => {
    it('returns swapsQuoteRefreshTime', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsQuoteRefreshTime(state)).toBe(
        state.metamask.swapsState.swapsQuoteRefreshTime,
      );
    });
  });

  describe('getSwapsQuotePrefetchingRefreshTime', () => {
    it('returns swapsQuotePrefetchingRefreshTime', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsQuotePrefetchingRefreshTime(state)).toBe(
        state.metamask.swapsState.swapsQuotePrefetchingRefreshTime,
      );
    });
  });

  describe('getBackgroundSwapRouteState', () => {
    it('returns routeState', () => {
      const state = createSwapsMockStore();
      expect(swaps.getBackgroundSwapRouteState(state)).toBe(
        state.metamask.swapsState.routeState,
      );
    });
  });

  describe('getCustomSwapsGas', () => {
    it('returns "customMaxGas"', () => {
      const state = createSwapsMockStore();
      const customMaxGas = '29000';
      state.metamask.swapsState.customMaxGas = customMaxGas;
      expect(swaps.getCustomSwapsGas(state)).toBe(customMaxGas);
    });
  });

  describe('getCustomSwapsGasPrice', () => {
    it('returns customGasPrice', () => {
      const state = createSwapsMockStore();
      expect(swaps.getCustomSwapsGasPrice(state)).toBe(
        state.metamask.swapsState.customGasPrice,
      );
    });
  });

  describe('getCustomMaxFeePerGas', () => {
    it('returns "customMaxFeePerGas"', () => {
      const state = createSwapsMockStore();
      const customMaxFeePerGas = '20';
      state.metamask.swapsState.customMaxFeePerGas = customMaxFeePerGas;
      expect(swaps.getCustomMaxFeePerGas(state)).toBe(customMaxFeePerGas);
    });
  });

  describe('getSwapsUserFeeLevel', () => {
    it('returns swapsUserFeeLevel', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsUserFeeLevel(state)).toBe(
        state.metamask.swapsState.swapsUserFeeLevel,
      );
    });
  });

  describe('getFetchParams', () => {
    it('returns fetchParams', () => {
      const state = createSwapsMockStore();
      expect(swaps.getFetchParams(state)).toBe(
        state.metamask.swapsState.fetchParams,
      );
    });
  });

  describe('getQuotes', () => {
    it('returns quotes for Swaps', () => {
      const state = createSwapsMockStore();
      expect(swaps.getQuotes(state)).toBe(state.metamask.swapsState.quotes);
    });
  });

  describe('getQuotesLastFetched', () => {
    it('returns quotesLastFetched', () => {
      const state = createSwapsMockStore();
      expect(swaps.getQuotesLastFetched(state)).toBe(
        state.metamask.swapsState.quotesLastFetched,
      );
    });
  });

  describe('getSelectedQuote', () => {
    it('returns selected quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSelectedQuote(state)).toBe(
        state.metamask.swapsState.quotes.TEST_AGG_2,
      );
    });
  });

  describe('getSwapsErrorKey', () => {
    it('returns errorKey', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsErrorKey(state)).toBe(
        state.metamask.swapsState.errorKey,
      );
    });
  });

  describe('getShowQuoteLoadingScreen', () => {
    it('returns showQuoteLoadingScreen', () => {
      const state = createSwapsMockStore();
      expect(swaps.getShowQuoteLoadingScreen(state)).toBe(
        state.swaps.showQuoteLoadingScreen,
      );
    });
  });

  describe('getSwapsTokens', () => {
    it('returns tokens', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsTokens(state)).toBe(
        state.metamask.swapsState.tokens,
      );
    });
  });

  describe('getSwapsWelcomeMessageSeenStatus', () => {
    it('returns', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsWelcomeMessageSeenStatus(state)).toBe(
        state.metamask.swapsState.swapsWelcomeMessageHasBeenShown,
      );
    });
  });

  describe('getTopQuote', () => {
    it('returns a top quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getTopQuote(state)).toBe(
        state.metamask.swapsState.quotes.TEST_AGG_BEST,
      );
    });
  });

  describe('getApproveTxId', () => {
    it('returns approveTxId', () => {
      const state = createSwapsMockStore();
      expect(swaps.getApproveTxId(state)).toBe(
        state.metamask.swapsState.approveTxId,
      );
    });
  });

  describe('getTradeTxId', () => {
    it('returns tradeTxId', () => {
      const state = createSwapsMockStore();
      expect(swaps.getTradeTxId(state)).toBe(
        state.metamask.swapsState.tradeTxId,
      );
    });
  });

  describe('getUsedQuote', () => {
    it('returns selected quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getUsedQuote(state)).toMatchObject(
        state.metamask.swapsState.quotes.TEST_AGG_2,
      );
    });

    it('returns best quote', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.selectedAggId = null;
      expect(swaps.getUsedQuote(state)).toMatchObject(
        state.metamask.swapsState.quotes.TEST_AGG_BEST,
      );
    });
  });

  describe('getDestinationTokenInfo', () => {
    it('returns destinationTokenInfo', () => {
      const state = createSwapsMockStore();
      expect(swaps.getDestinationTokenInfo(state)).toBe(
        state.metamask.swapsState.fetchParams.metaData.destinationTokenInfo,
      );
    });
  });

  describe('getUsedSwapsGasPrice', () => {
    it('returns customGasPrice', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.customGasPrice = 5;
      expect(swaps.getUsedSwapsGasPrice(state)).toBe(
        state.metamask.swapsState.customGasPrice,
      );
    });
  });

  describe('getApproveTxParams', () => {
    it('returns approveTxParams', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.quotes.TEST_AGG_2.approvalNeeded = {
        data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
        to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        value: '0x0',
        from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
        gas: '0x12',
        gasPrice: '0x34',
      };
      expect(swaps.getApproveTxParams(state)).toMatchObject({
        ...state.metamask.swapsState.quotes.TEST_AGG_2.approvalNeeded,
        gasPrice: 5,
      });
    });
  });

  describe('getSmartTransactionsOptInStatus', () => {
    it('returns STX opt in status', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSmartTransactionsOptInStatus(state)).toBe(true);
    });
  });

  describe('getCurrentSmartTransactions', () => {
    it('returns current smart transactions', () => {
      const state = createSwapsMockStore();
      expect(swaps.getCurrentSmartTransactions(state)).toMatchObject(
        state.metamask.smartTransactionsState.smartTransactions[
          CHAIN_IDS.MAINNET
        ],
      );
    });
  });

  describe('getPendingSmartTransactions', () => {
    it('returns pending smart transactions', () => {
      const state = createSwapsMockStore();
      const pendingSmartTransactions = swaps.getPendingSmartTransactions(state);
      expect(pendingSmartTransactions).toHaveLength(1);
      expect(pendingSmartTransactions[0].uuid).toBe('uuid2');
      expect(pendingSmartTransactions[0].status).toBe('pending');
    });
  });

  describe('getSmartTransactionFees', () => {
    it('returns unsigned transactions and estimates', () => {
      const state = createSwapsMockStore();
      const smartTransactionFees = swaps.getSmartTransactionFees(state);
      expect(smartTransactionFees).toMatchObject(
        state.metamask.smartTransactionsState.fees,
      );
    });
  });

  describe('getSmartTransactionEstimatedGas', () => {
    it('returns unsigned transactions and estimates', () => {
      const state = createSwapsMockStore();
      const smartTransactionFees = swaps.getSmartTransactionEstimatedGas(state);
      expect(smartTransactionFees).toBe(
        state.metamask.smartTransactionsState.estimatedGas,
      );
    });
  });
});
