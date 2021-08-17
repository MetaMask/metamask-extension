import nock from 'nock';

import { MOCKS, createSwapsMockStore } from '../../../test/jest';
import { setSwapsLiveness } from '../../store/actions';
import { setStorageItem } from '../../helpers/utils/storage-helpers';
import * as swaps from './swaps';

jest.mock('../../store/actions.js', () => ({
  setSwapsLiveness: jest.fn(),
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

  describe('fetchSwapsLiveness', () => {
    const cleanFeatureFlagApiCache = () => {
      setStorageItem(
        'cachedFetch:https://api2.metaswap.codefi.network/featureFlags',
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
      const apiNock = nock('https://api2.metaswap.codefi.network').get(
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
        metamask: { provider: { ...providerState } },
      });
    };

    it('checks that Swaps for ETH are enabled and can use new API', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: true,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled for API v2 and enabled for API v1', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: false,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      featureFlagsResponse.ethereum.extension_active = false;
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled for API v1 and v2', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
        useNewSwapsApi: false,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      featureFlagsResponse.ethereum.extension_active = false;
      featureFlagsResponse.ethereum.fallback_to_v1 = false;
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('checks that Swaps for ETH are disabled if the /featureFlags API call throws an error', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
        useNewSwapsApi: false,
      };
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        replyWithError: true,
      });
      const swapsLiveness = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock.isDone()).toBe(true);
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
      expect(swapsLiveness).toMatchObject(expectedSwapsLiveness);
    });

    it('only calls the API once and returns response from cache for the second call', async () => {
      const mockDispatch = jest.fn();
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: true,
      };
      const featureFlagsResponse = MOCKS.createFeatureFlagsResponse();
      const featureFlagApiNock = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      await swaps.fetchSwapsLiveness()(mockDispatch, createGetState());
      expect(featureFlagApiNock.isDone()).toBe(true);
      const featureFlagApiNock2 = mockFeatureFlagsApiResponse({
        featureFlagsResponse,
      });
      const swapsLiveness = await swaps.fetchSwapsLiveness()(
        mockDispatch,
        createGetState(),
      );
      expect(featureFlagApiNock2.isDone()).toBe(false); // Second API call wasn't made, cache was used instead.
      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(setSwapsLiveness).toHaveBeenCalledWith(expectedSwapsLiveness);
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

  describe('getUseNewSwapsApi', () => {
    it('returns true for "useNewSwapsApi"', () => {
      const state = createSwapsMockStore();
      const useNewSwapsApi = true;
      state.metamask.swapsState.useNewSwapsApi = useNewSwapsApi;
      expect(swaps.getUseNewSwapsApi(state)).toBe(useNewSwapsApi);
    });

    it('returns false for "useNewSwapsApi"', () => {
      const state = createSwapsMockStore();
      const useNewSwapsApi = false;
      state.metamask.swapsState.useNewSwapsApi = useNewSwapsApi;
      expect(swaps.getUseNewSwapsApi(state)).toBe(useNewSwapsApi);
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
});
