import {
  MultichainAssetsRatesController,
  MultichainAssetsRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { getIsDeprecatedController } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { MessengerClientInitFunction } from '../types';
import { MultichainAssetsRatesControllerInitMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Assets Rate controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const MultichainAssetsRatesControllerInit: MessengerClientInitFunction<
  MultichainAssetsRatesController,
  MultichainAssetsRatesControllerMessenger,
  MultichainAssetsRatesControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const messengerClient = new MultichainAssetsRatesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsRatesController,
    interval: 1000 * 60 * 3, // 3 mins
    isDeprecated: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      return getIsDeprecatedController(
        remoteFeatureFlags,
        'MultichainAssetsRatesController',
      );
    },
  });

  return {
    messengerClient,
  };
};
