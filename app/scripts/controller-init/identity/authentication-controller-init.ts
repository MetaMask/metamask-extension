import type { AuthenticationControllerState } from '@metamask/profile-sync-controller/auth';
import { Controller as AuthenticationController } from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';

import type { AuthenticationControllerMessenger } from '../messengers/identity';
import type { ControllerInitFunction } from '../types';

/**
 * Initialize the Authentication controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.getMetaMetricsId
 * @returns The initialized controller.
 */
export const AuthenticationControllerInit: ControllerInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger
> = ({ controllerMessenger, persistedState, getMetaMetricsId }) => {
  const controller = new AuthenticationController({
    messenger: controllerMessenger,
    state:
      persistedState.AuthenticationController as AuthenticationControllerState,
    metametrics: {
      getMetaMetricsId,
      agent: Platform.EXTENSION,
    },
  });

  return {
    controller,
  };
};
