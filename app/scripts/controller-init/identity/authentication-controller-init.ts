import {
  AuthenticationControllerState,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Env, Platform } from '@metamask/profile-sync-controller/sdk';
import { ControllerInitFunction } from '../types';
import {
  AuthenticationControllerInitMessenger,
  AuthenticationControllerMessenger,
} from '../messengers/identity';
import { isProduction } from '../../../../shared/modules/environment';

/**
 * Initialize the Authentication controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The messenger to use for initialization.
 * @returns The initialized controller.
 */
export const AuthenticationControllerInit: ControllerInitFunction<
  AuthenticationController,
  AuthenticationControllerMessenger,
  AuthenticationControllerInitMessenger
> = ({ controllerMessenger, initMessenger, persistedState }) => {
  const controller = new AuthenticationController({
    messenger: controllerMessenger,
    state:
      persistedState.AuthenticationController as AuthenticationControllerState,
    metametrics: {
      getMetaMetricsId: initMessenger.call.bind(
        initMessenger,
        'MetaMetricsController:getMetaMetricsId',
      ),
      agent: Platform.EXTENSION,
    },
    config: {
      env: isProduction() ? Env.PRD : Env.DEV,
    },
  });

  return {
    controller,
  };
};
