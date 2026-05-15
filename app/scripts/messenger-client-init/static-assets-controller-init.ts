import { Hex } from '@metamask/utils';
import {
  DEFAULT_TOP_X,
  DEFAULT_CACHE_EXPIRATION_MS,
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsPollingFeatureFlagOptions,
} from '../controllers/static-assets-controller';
import {
  isAssetsUnifyStateFeatureEnabled,
  ASSETS_UNIFY_STATE_VERSION_1,
  type AssetsUnifyStateFeatureFlag,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import { MessengerClientInitFunction } from './types';
import { StaticAssetsControllerInitMessenger } from './messengers';

function getRemoteFeatureFlagControllerState(
  initMessenger: StaticAssetsControllerInitMessenger,
): StaticAssetsPollingFeatureFlagOptions | undefined {
  const state = initMessenger.call('RemoteFeatureFlagController:getState');
  return state?.remoteFeatureFlags
    ?.staticAssetsPollingOptions as StaticAssetsPollingFeatureFlagOptions;
}

export const StaticAssetsControllerInit: MessengerClientInitFunction<
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const messengerClient = new StaticAssetsController({
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
    getIsAssetsUnifyStateEnabled: (): boolean => {
      if (!getIsAssetsUnifiedStateIncludedInBuild()) {
        return false;
      }
      const state = initMessenger.call('RemoteFeatureFlagController:getState');
      return isAssetsUnifyStateFeatureEnabled(
        state?.remoteFeatureFlags?.assetsUnifyState as
          | AssetsUnifyStateFeatureFlag
          | null
          | undefined,
        ASSETS_UNIFY_STATE_VERSION_1,
      );
    },
  });
  return {
    messengerClient,
  };
};
