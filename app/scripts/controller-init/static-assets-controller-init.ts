
import { Hex } from '@metamask/utils';
import { StaticAssetsController } from '../controllers/static-assets-controller';
import { ControllerInitFunction } from './types';
import {
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger,
} from './messengers';

export const StaticAssetsControllerInit: ControllerInitFunction<
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger
> = ({ controllerMessenger, initMessenger }) => {
  const controller = new StaticAssetsController({
    messenger: controllerMessenger,
    interval: 3 * 60 * 60 * 1000, // 3 hour
    supportedChains: (): Set<Hex> => {
      const state = initMessenger.call('RemoteFeatureFlagController:getState');

      const supportedChains =
        state?.remoteFeatureFlags?.staticAssetsSupportedChains;

      return new Set(Array.isArray(supportedChains)
      ? (supportedChains as Hex[])
      : []);
    },
  });

  return {
    controller,
  };
};
