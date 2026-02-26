import { Hex } from '@metamask/utils';
import {
  DEFAULT_TOP_X,
  DEFAULT_CACHE_EXPIRATION_MS,
  StaticAssetsController,
  StaticAssetsPollingFeatureFlagOptions,
} from '../controllers/static-assets-controller';
import { ControllerInitFunction } from './types';
import {
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger,
} from './messengers';

function getRemoteFeatureFlagControllerState(
  initMessenger: StaticAssetsControllerInitMessenger,
): StaticAssetsPollingFeatureFlagOptions | undefined {
  const state = initMessenger.call('RemoteFeatureFlagController:getState');
  return state?.remoteFeatureFlags
    ?.staticAssetsPollingOptions as StaticAssetsPollingFeatureFlagOptions;
}

export const StaticAssetsControllerInit: ControllerInitFunction<
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new StaticAssetsController({
    messenger: controllerMessenger,
    getSupportedChains: (): Set<Hex> => {
      const supportedChains =
        getRemoteFeatureFlagControllerState(initMessenger)?.supportedChains;
      return new Set(Array.isArray(supportedChains) ? supportedChains : []);
    },
    getCacheExpirationTime: (): number => {
      const cacheExpirationTime =
        getRemoteFeatureFlagControllerState(initMessenger)?.cacheExpirationTime;
      return cacheExpirationTime
        ? Number(cacheExpirationTime)
        : DEFAULT_CACHE_EXPIRATION_MS;
    },
    getTopX: (): number => {
      const topX = getRemoteFeatureFlagControllerState(initMessenger)?.topX;
      return topX ? Number(topX) : DEFAULT_TOP_X;
    },
  });
  return {
    controller,
  };
};
