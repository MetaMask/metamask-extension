import {
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
} from '@metamask/assets-controllers';
import { getIsDeprecatedController } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { MessengerClientInitFunction } from '../types';
import { MultichainAssetsControllerInitMessenger } from '../messengers/multichain/multichain-assets-controller-messenger';

/**
 * Initialize the Multichain Assets controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.initMessenger - The messenger to use for initialization.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const MultichainAssetsControllerInit: MessengerClientInitFunction<
  MultichainAssetsController,
  MultichainAssetsControllerMessenger,
  MultichainAssetsControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const messengerClient = new MultichainAssetsController({
    messenger: controllerMessenger,
    state: persistedState.MultichainAssetsController,
    isDeprecated: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      return getIsDeprecatedController(
        remoteFeatureFlags,
        'MultichainAssetsController',
      );
    },
  });

  return {
    messengerClient,
  };
};
