import nock from 'nock';

import { MOCKS, createSwapsMockStore } from '../../../test/jest';
import { setSwapsLiveness, setSwapsFeatureFlags } from '../../store/actions';
import { setStorageItem } from '../../helpers/utils/storage-helpers';
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
      state.metamask.swapsState.customMaxPriorityFeePerGas = customMaxPriorityFeePerGas;
      expect(swaps.getCustomMaxPriorityFeePerGas(state)).toBe(
        customMaxPriorityFeePerGas,
      );
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
      state.metamask.swapsState.swapsFeatureFlags = {};
      expect(swaps.getSmartTransactionsEnabled(state)).toBe(false);
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
});
