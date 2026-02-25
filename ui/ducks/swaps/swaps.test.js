import nock from 'nock';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { MOCKS, createSwapsMockStore } from '../../../test/jest';
import { setSwapsLiveness, setSwapsFeatureFlags } from '../../store/actions';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { setStorageItem } from '../../../shared/lib/storage-helpers';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { mockNetworkState } from '../../../test/stub/networks';
import swapsReducer, * as swaps from './swaps';

const middleware = [thunk];

jest.mock('../../store/actions.ts', () => ({
  setSwapsLiveness: jest.fn(),
  setSwapsFeatureFlags: jest.fn(),
  getTransactions: jest.fn(() => {
    return [];
  }),
}));

describe('Ducks - Swaps', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchSwapsLivenessAndFeatureFlags', () => {
    const cleanFeatureFlagApiCache = () => {
      setStorageItem(
        'cachedFetch:https://bridge.api.cx.metamask.io/featureFlags',
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
      const apiNock = nock('https://bridge.api.cx.metamask.io').get(
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
      const mockInternalAccount = createMockInternalAccount();

      return () => ({
        metamask: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
          internalAccounts: {
            accounts: {
              [mockInternalAccount.id]: mockInternalAccount,
            },
            selectedAccount: mockInternalAccount.id,
          },
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
  });
});
