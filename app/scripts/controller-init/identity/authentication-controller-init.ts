import {
  AuthenticationControllerState,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { ControllerInitFunction } from '../types';
import { AuthenticationControllerMessenger } from '../messengers/identity';

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
