import nock from 'nock';

import { MOCKS, createSwapsMockStore } from '../../../test/jest';
import { setSwapsLiveness, setSwapsFeatureFlags } from '../../store/actions';
import { setStorageItem } from '../../../app/scripts/constants/storage-helpers';
import {
  MAINNET_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
} from '../../../shared/constants/network';
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
      featureFlagsResponse.ethereum.extension_active = false;
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
      featureFlagsResponse.ethereum.extension_active = false;
      featureFlagsResponse.ethereum.fallback_to_v1 = false;
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

  describe('getCustomSwapsGas', () => {
    it('returns "customMaxGas"', () => {
      const state = createSwapsMockStore();
      const customMaxGas = '29000';
      state.metamask.swapsState.customMaxGas = customMaxGas;
      expect(swaps.getCustomSwapsGas(state)).toBe(customMaxGas);
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

  describe('getCustomMaxPriorityFeePerGas', () => {
    it('returns "customMaxPriorityFeePerGas"', () => {
      const state = createSwapsMockStore();
      const customMaxPriorityFeePerGas = '3';
<<<<<<< HEAD
      state.metamask.swapsState.customMaxPriorityFeePerGas = customMaxPriorityFeePerGas;
=======
      state.metamask.singleChainSwapsState.customMaxPriorityFeePerGas =
        customMaxPriorityFeePerGas;
>>>>>>> upstream/multichain-swaps-controller
      expect(swaps.getCustomMaxPriorityFeePerGas(state)).toBe(
        customMaxPriorityFeePerGas,
      );
    });
  });

  describe('getSwapsFeatureIsLive', () => {
    it('returns true for "swapsFeatureIsLive"', () => {
      const state = createSwapsMockStore();
      const swapsFeatureIsLive = true;
      state.metamask.singleChainSwapsState.swapsFeatureIsLive =
        swapsFeatureIsLive;
      expect(swaps.getSwapsFeatureIsLive(state)).toBe(swapsFeatureIsLive);
    });

    it('returns false for "swapsFeatureIsLive"', () => {
      const state = createSwapsMockStore();
      const swapsFeatureIsLive = false;
      state.metamask.singleChainSwapsState.swapsFeatureIsLive =
        swapsFeatureIsLive;
      expect(swaps.getSwapsFeatureIsLive(state)).toBe(swapsFeatureIsLive);
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

  describe('getSmartTransactionsEnabled', () => {
    it('returns true if feature flag is enabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if feature flag is disabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.singleChainSwapsState.swapsFeatureFlags.smartTransactions.extensionActive = false;
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
      state.metamask.provider.chainId = POLYGON_CHAIN_ID;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW and is BSC network', () => {
      const state = createSwapsMockStore();
      state.metamask.provider.chainId = BSC_CHAIN_ID;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns true if feature flag is enabled, not a HW and is Rinkeby network', () => {
      const state = createSwapsMockStore();
      state.metamask.provider.chainId = RINKEBY_CHAIN_ID;
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if feature flag is missing', () => {
      const state = createSwapsMockStore();
      state.metamask.singleChainSwapsState.swapsFeatureFlags = {};
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
    });
  });

<<<<<<< HEAD
=======
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
        state.metamask.singleChainSwapsState.swapsQuoteRefreshTime,
      );
    });
  });

  describe('getSwapsQuotePrefetchingRefreshTime', () => {
    it('returns swapsQuotePrefetchingRefreshTime', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsQuotePrefetchingRefreshTime(state)).toBe(
        state.metamask.singleChainSwapsState.swapsQuotePrefetchingRefreshTime,
      );
    });
  });

  describe('getBackgroundSwapRouteState', () => {
    it('returns routeState', () => {
      const state = createSwapsMockStore();
      expect(swaps.getBackgroundSwapRouteState(state)).toBe(
        state.metamask.singleChainSwapsState.routeState,
      );
    });
  });

  describe('getCustomSwapsGas', () => {
    it('returns "customMaxGas"', () => {
      const state = createSwapsMockStore();
      const customMaxGas = '29000';
      state.metamask.singleChainSwapsState.customMaxGas = customMaxGas;
      expect(swaps.getCustomSwapsGas(state)).toBe(customMaxGas);
    });
  });

  describe('getCustomSwapsGasPrice', () => {
    it('returns customGasPrice', () => {
      const state = createSwapsMockStore();
      expect(swaps.getCustomSwapsGasPrice(state)).toBe(
        state.metamask.singleChainSwapsState.customGasPrice,
      );
    });
  });

  describe('getCustomMaxFeePerGas', () => {
    it('returns "customMaxFeePerGas"', () => {
      const state = createSwapsMockStore();
      const customMaxFeePerGas = '20';
      state.metamask.singleChainSwapsState.customMaxFeePerGas =
        customMaxFeePerGas;
      expect(swaps.getCustomMaxFeePerGas(state)).toBe(customMaxFeePerGas);
    });
  });

  describe('getSwapsUserFeeLevel', () => {
    it('returns swapsUserFeeLevel', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsUserFeeLevel(state)).toBe(
        state.metamask.singleChainSwapsState.swapsUserFeeLevel,
      );
    });
  });

  describe('getFetchParams', () => {
    it('returns fetchParams', () => {
      const state = createSwapsMockStore();
      expect(swaps.getFetchParams(state)).toBe(
        state.metamask.singleChainSwapsState.fetchParams,
      );
    });
  });

  describe('getQuotes', () => {
    it('returns quotes for Swaps', () => {
      const state = createSwapsMockStore();
      expect(swaps.getQuotes(state)).toBe(
        state.metamask.singleChainSwapsState.quotes,
      );
    });
  });

  describe('getQuotesLastFetched', () => {
    it('returns quotesLastFetched', () => {
      const state = createSwapsMockStore();
      expect(swaps.getQuotesLastFetched(state)).toBe(
        state.metamask.singleChainSwapsState.quotesLastFetched,
      );
    });
  });

  describe('getSelectedQuote', () => {
    it('returns selected quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSelectedQuote(state)).toBe(
        state.metamask.singleChainSwapsState.quotes.TEST_AGG_2,
      );
    });
  });

  describe('getSwapsErrorKey', () => {
    it('returns errorKey', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsErrorKey(state)).toBe(
        state.metamask.singleChainSwapsState.errorKey,
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
        state.metamask.singleChainSwapsState.tokens,
      );
    });
  });

  describe('getSwapsWelcomeMessageSeenStatus', () => {
    it('returns', () => {
      const state = createSwapsMockStore();
      expect(swaps.getSwapsWelcomeMessageSeenStatus(state)).toBe(
        state.metamask.singleChainSwapsState.swapsWelcomeMessageHasBeenShown,
      );
    });
  });

  describe('getTopQuote', () => {
    it('returns a top quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getTopQuote(state)).toBe(
        state.metamask.singleChainSwapsState.quotes.TEST_AGG_BEST,
      );
    });
  });

  describe('getApproveTxId', () => {
    it('returns approveTxId', () => {
      const state = createSwapsMockStore();
      expect(swaps.getApproveTxId(state)).toBe(
        state.metamask.singleChainSwapsState.approveTxId,
      );
    });
  });

  describe('getTradeTxId', () => {
    it('returns tradeTxId', () => {
      const state = createSwapsMockStore();
      expect(swaps.getTradeTxId(state)).toBe(
        state.metamask.singleChainSwapsState.tradeTxId,
      );
    });
  });

  describe('getUsedQuote', () => {
    it('returns selected quote', () => {
      const state = createSwapsMockStore();
      expect(swaps.getUsedQuote(state)).toMatchObject(
        state.metamask.singleChainSwapsState.quotes.TEST_AGG_2,
      );
    });

    it('returns best quote', () => {
      const state = createSwapsMockStore();
      state.metamask.singleChainSwapsState.selectedAggId = null;
      expect(swaps.getUsedQuote(state)).toMatchObject(
        state.metamask.singleChainSwapsState.quotes.TEST_AGG_BEST,
      );
    });
  });

  describe('getDestinationTokenInfo', () => {
    it('returns destinationTokenInfo', () => {
      const state = createSwapsMockStore();
      expect(swaps.getDestinationTokenInfo(state)).toBe(
        state.metamask.singleChainSwapsState.fetchParams.metaData
          .destinationTokenInfo,
      );
    });
  });

  describe('getUsedSwapsGasPrice', () => {
    it('returns customGasPrice', () => {
      const state = createSwapsMockStore();
      state.metamask.singleChainSwapsState.customGasPrice = 5;
      expect(swaps.getUsedSwapsGasPrice(state)).toBe(
        state.metamask.singleChainSwapsState.customGasPrice,
      );
    });
  });

  describe('getApproveTxParams', () => {
    it('returns approveTxParams', () => {
      const state = createSwapsMockStore();
      state.metamask.singleChainSwapsState.quotes.TEST_AGG_2.approvalNeeded = {
        data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
        to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        value: '0x0',
        from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
        gas: '0x12',
        gasPrice: '0x34',
      };
      expect(swaps.getApproveTxParams(state)).toMatchObject({
        ...state.metamask.singleChainSwapsState.quotes.TEST_AGG_2
          .approvalNeeded,
        gasPrice: 5,
      });
    });
  });

>>>>>>> upstream/multichain-swaps-controller
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
          MAINNET_CHAIN_ID
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
<<<<<<< HEAD
=======

  describe('getSmartTransactionEstimatedGas', () => {
    it('returns unsigned transactions and estimates', () => {
      const state = createSwapsMockStore();
      const smartTransactionFees = swaps.getSmartTransactionEstimatedGas(state);
      expect(smartTransactionFees).toBe(
        state.metamask.smartTransactionsState.estimatedGas,
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
      } = state.metamask.singleChainSwapsState;
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

  describe('actions + reducers', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());

    afterEach(() => {
      store.clearActions();
    });

    describe('clearSwapsState', () => {
      it('calls the "swaps/clearSwapsState" action', () => {
        store.dispatch(swaps.clearSwapsState());
        const actions = store.getActions();
        expect(actions).toHaveLength(1);
        expect(actions[0].type).toBe('swaps/clearSwapsState');
      });
    });

    describe('setAggregatorMetadata', () => {
      it('calls the "swaps/setAggregatorMetadata" action', () => {
        const state = store.getState().swaps;
        const actionPayload = {
          name: 'agg1',
        };
        store.dispatch(swaps.setAggregatorMetadata(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setAggregatorMetadata');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.aggregatorMetadata).toBe(actionPayload);
      });
    });

    describe('setBalanceError', () => {
      it('calls the "swaps/setBalanceError" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 'balanceError';
        store.dispatch(swaps.setBalanceError(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setBalanceError');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.balanceError).toBe(actionPayload);
      });
    });

    describe('setFetchingQuotes', () => {
      it('calls the "swaps/setFetchingQuotes" action', () => {
        const state = store.getState().swaps;
        const actionPayload = true;
        store.dispatch(swaps.setFetchingQuotes(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setFetchingQuotes');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.fetchingQuotes).toBe(actionPayload);
      });
    });

    describe('setSwapsFromToken', () => {
      it('calls the "swaps/setFromToken" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 'ETH';
        store.dispatch(swaps.setSwapsFromToken(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setFromToken');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.fromToken).toBe(actionPayload);
      });
    });

    describe('setFromTokenError', () => {
      it('calls the "swaps/setFromTokenError" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 'fromTokenError';
        store.dispatch(swaps.setFromTokenError(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setFromTokenError');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.fromTokenError).toBe(actionPayload);
      });
    });

    describe('setFromTokenInputValue', () => {
      it('calls the "swaps/setFromTokenInputValue" action', () => {
        const state = store.getState().swaps;
        const actionPayload = '5';
        store.dispatch(swaps.setFromTokenInputValue(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setFromTokenInputValue');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.fromTokenInputValue).toBe(actionPayload);
      });
    });

    describe('setIsFeatureFlagLoaded', () => {
      it('calls the "swaps/setIsFeatureFlagLoaded" action', () => {
        const state = store.getState().swaps;
        const actionPayload = true;
        store.dispatch(swaps.setIsFeatureFlagLoaded(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setIsFeatureFlagLoaded');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.isFeatureFlagLoaded).toBe(actionPayload);
      });
    });

    describe('setMaxSlippage', () => {
      it('calls the "swaps/setMaxSlippage" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 3;
        store.dispatch(swaps.setMaxSlippage(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setMaxSlippage');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.maxSlippage).toBe(actionPayload);
      });
    });

    describe('setSwapQuotesFetchStartTime', () => {
      it('calls the "swaps/setQuotesFetchStartTime" action', () => {
        const state = store.getState().swaps;
        const actionPayload = '1664461886';
        store.dispatch(swaps.setSwapQuotesFetchStartTime(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setQuotesFetchStartTime');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.quotesFetchStartTime).toBe(actionPayload);
      });
    });

    describe('setReviewSwapClickedTimestamp', () => {
      it('calls the "swaps/setReviewSwapClickedTimestamp" action', () => {
        const state = store.getState().swaps;
        const actionPayload = '1664461886';
        store.dispatch(swaps.setReviewSwapClickedTimestamp(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setReviewSwapClickedTimestamp');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.reviewSwapClickedTimestamp).toBe(actionPayload);
      });
    });

    describe('setTopAssets', () => {
      it('calls the "swaps/setTopAssets" action', () => {
        const state = store.getState().swaps;
        const actionPayload = {
          '0x514910771af9ca656af840dff83e8264ecf986ca': {
            index: '0',
          },
          '0x04fa0d235c4abf4bcf4787af4cf447de572ef828': {
            index: '1',
          },
          '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
            index: '2',
          },
        };
        store.dispatch(swaps.setTopAssets(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setTopAssets');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.topAssets).toBe(actionPayload);
      });
    });

    describe('setSwapToToken', () => {
      it('calls the "swaps/setToToken" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 'USDC';
        store.dispatch(swaps.setSwapToToken(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/setToToken');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.toToken).toBe(actionPayload);
      });
    });

    describe('swapCustomGasModalPriceEdited', () => {
      it('calls the "swaps/swapCustomGasModalPriceEdited" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 5;
        store.dispatch(swaps.swapCustomGasModalPriceEdited(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/swapCustomGasModalPriceEdited');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.customGas.price).toBe(actionPayload);
      });
    });

    describe('swapCustomGasModalLimitEdited', () => {
      it('calls the "swaps/swapCustomGasModalLimitEdited" action', () => {
        const state = store.getState().swaps;
        const actionPayload = 100;
        store.dispatch(swaps.swapCustomGasModalLimitEdited(actionPayload));
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/swapCustomGasModalLimitEdited');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.customGas.limit).toBe(actionPayload);
      });
    });

    describe('swapCustomGasModalClosed', () => {
      it('calls the "swaps/swapCustomGasModalClosed" action', () => {
        const state = store.getState().swaps;
        store.dispatch(swaps.swapCustomGasModalClosed());
        const actions = store.getActions();
        expect(actions[0].type).toBe('swaps/swapCustomGasModalClosed');
        const newState = swapsReducer(state, actions[0]);
        expect(newState.customGas.price).toBe(null);
        expect(newState.customGas.limit).toBe(null);
      });
    });

    describe('getSwapRedesignEnabled', () => {
      it('returns true if feature flags are not returned from backend yet', () => {
        const state = createSwapsMockStore();
        delete state.metamask.singleChainSwapsState.swapsFeatureFlags
          .swapRedesign;
        expect(swaps.getSwapRedesignEnabled(state)).toBe(true);
      });

      it('returns false if the extension feature flag for swaps redesign is false', () => {
        const state = createSwapsMockStore();
        state.metamask.singleChainSwapsState.swapsFeatureFlags.swapRedesign.extensionActive = false;
        expect(swaps.getSwapRedesignEnabled(state)).toBe(false);
      });

      it('returns true if the extension feature flag for swaps redesign is true', () => {
        const state = createSwapsMockStore();
        expect(swaps.getSwapRedesignEnabled(state)).toBe(true);
      });
    });
  });
>>>>>>> upstream/multichain-swaps-controller
});
