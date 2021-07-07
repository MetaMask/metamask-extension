import nock from 'nock';

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

    const createFeatureFlagsResponse = () => {
      return {
        bsc: {
          mobile_active: false,
          extension_active: true,
          fallback_to_v1: true,
        },
        ethereum: {
          mobile_active: false,
          extension_active: true,
          fallback_to_v1: true,
        },
        polygon: {
          mobile_active: false,
          extension_active: true,
          fallback_to_v1: false,
        },
      };
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
      const featureFlagsResponse = createFeatureFlagsResponse();
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
      const featureFlagsResponse = createFeatureFlagsResponse();
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
      const featureFlagsResponse = createFeatureFlagsResponse();
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
      const featureFlagsResponse = createFeatureFlagsResponse();
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
});
