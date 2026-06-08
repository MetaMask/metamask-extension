import {
  MultichainBalancesController,
  MultichainBalancesControllerMessenger,
} from '@metamask/assets-controllers';
import { getIsDeprecatedController } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
import { MessengerClientInitFunction } from '../types';
import { MultichainBalancesControllerInitMessenger } from '../messengers/multichain';

/**
 * Initialize the Multichain Balances controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @returns The initialized controller.
 */
export const MultichainBalancesControllerInit: MessengerClientInitFunction<
  MultichainBalancesController,
  MultichainBalancesControllerMessenger,
  MultichainBalancesControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const messengerClient = new MultichainBalancesController({
    messenger: controllerMessenger,
    state: persistedState.MultichainBalancesController,
    isDeprecated: () => {
      const { remoteFeatureFlags } = initMessenger.call(
        'RemoteFeatureFlagController:getState',
      );
      return getIsDeprecatedController(
        remoteFeatureFlags,
        'MultichainBalancesController',
      );
    },
  });

  return { messengerClient };
};
