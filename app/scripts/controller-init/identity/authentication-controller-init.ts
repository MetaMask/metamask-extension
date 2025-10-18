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
import { ENVIRONMENT } from '../../../../development/build/constants';

/**
 * Check if the build is a Development or Test build.
 *
 * @returns true if the build is a Development or Test build, false otherwise
 */
function isDevOrTestBuild() {
  return (
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.DEVELOPMENT ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING
  );
}

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
      env: isDevOrTestBuild() ? Env.DEV : Env.PRD,
    },
  });

  return {
    controller,
  };
};
