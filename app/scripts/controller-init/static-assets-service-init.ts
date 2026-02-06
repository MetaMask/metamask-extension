import { Hex } from '@metamask/utils';
import {
  DEFAULT_TOP_X,
  DEFAULT_CACHE_EXPIRATION_MS,
  StaticAssetsService,
  StaticAssetsPollingFeatureFlagOptions,
} from '../controllers/static-assets-service';
import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { ControllerInitFunction } from './types';
import {
  StaticAssetsServiceMessenger,
  StaticAssetsServiceInitMessenger,
} from './messengers';

function getRemoteFeatureFlagControllerState(
  initMessenger: StaticAssetsServiceInitMessenger,
): StaticAssetsPollingFeatureFlagOptions | undefined {
  const state = initMessenger.call('RemoteFeatureFlagController:getState');
  return state?.remoteFeatureFlags
    ?.staticAssetsPollingOptions as StaticAssetsPollingFeatureFlagOptions;
}

export const StaticAssetsServiceInit: ControllerInitFunction<
  StaticAssetsService,
  StaticAssetsServiceMessenger,
  StaticAssetsServiceInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const service = new StaticAssetsService({
    messenger: controllerMessenger,
    getSupportedChains: (): Set<Hex> => {
      const supportedChains =
        getRemoteFeatureFlagControllerState(initMessenger)?.supportedChains;
      return new Set(Array.isArray(supportedChains) ? supportedChains : []);
    },
    getTopX: (): number => {
      const topX = getRemoteFeatureFlagControllerState(initMessenger)?.topX;
      return topX ? Number(topX) : DEFAULT_TOP_X;
    },
    fetchFn: async (url, requestOptions) => {
      const cacheExpirationTime =
        getRemoteFeatureFlagControllerState(initMessenger)?.cacheExpirationTime;

      const urlString = url.toString();
      return await fetchWithCache({
        url: urlString,
        fetchOptions: { method: 'GET', ...requestOptions },
        cacheOptions: {
          cacheRefreshTime: cacheExpirationTime
            ? Number(cacheExpirationTime)
            : DEFAULT_CACHE_EXPIRATION_MS,
        },
        functionName: 'fetchTopAssets',
      });
    },
  });
  return {
    controller: service,
    memStateKey: null,
    persistedStateKey: null,
  };
};
