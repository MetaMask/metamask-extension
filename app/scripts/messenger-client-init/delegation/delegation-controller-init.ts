import {
  DelegationController,
  type DelegationControllerMessenger,
} from '@metamask/delegation-controller';
import { type Hex } from '../../../../shared/lib/delegation/utils';
import { getDeleGatorEnvironment } from '../../../../shared/lib/delegation';
import type { MessengerClientInitFunction } from '../types';

const getDelegationEnvironment = (chainId: Hex) => {
  return getDeleGatorEnvironment(Number(chainId));
};

/**
 * Initialize the Delegation controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const DelegationControllerInit: MessengerClientInitFunction<
  DelegationController,
  DelegationControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new DelegationController({
    messenger: controllerMessenger,
    state: persistedState.DelegationController,
    getDelegationEnvironment,
  });

  return {
    messengerClient,
    api: {
      signDelegation: messengerClient.signDelegation.bind(messengerClient),
    },
  };
};
