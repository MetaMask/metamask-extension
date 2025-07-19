import {
  AuthenticationControllerState,
  Controller as AuthenticationController,
} from '@metamask/profile-sync-controller/auth';
import { Platform } from '@metamask/profile-sync-controller/sdk';
import { ControllerInitFunction } from '../types';
import { AuthenticationControllerMessenger } from '../messengers/identity';
import { fetchIntercept } from '../../lib/fetch-intercept';

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

  // Automatically authenticate all requests to these URLs with the bearer token.
  const ACCOUNTS_API_URL = 'https://accounts.api.cx.metamask.io';
  const URLS_TO_AUTHENTICATE = [ACCOUNTS_API_URL];
  fetchIntercept.register({
    request: async (input, init = {}) => {
      const inputURL = typeof input === 'string' ? input : input.toString();
      if (URLS_TO_AUTHENTICATE.some((url) => inputURL.startsWith(url))) {
        // Get the bearer token from the controller
        const token = await controller.getBearerToken();

        // Inject the bearer token into the existing request
        if (!init.headers) {
          init.headers = {};
        }
        init.headers = new Headers(init.headers);
        init.headers.set('Authorization', `Bearer ${token}`);
      }
      return [input, init];
    },
  });

  return {
    controller,
  };
};
