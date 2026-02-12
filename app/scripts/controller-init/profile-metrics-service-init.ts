import {
  ProfileMetricsService,
  ProfileMetricsServiceMessenger,
} from '@metamask/profile-metrics-controller';
import { loadAuthenticationConfig } from '../../../shared/modules/authentication';
import { ControllerInitFunction } from './types';

/**
 * Initialize the profile metrics service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const ProfileMetricsServiceInit: ControllerInitFunction<
  ProfileMetricsService,
  ProfileMetricsServiceMessenger
> = ({ controllerMessenger }) => {
  // The environment must be the same used by AuthenticationController.
  const env = loadAuthenticationConfig();

  const controller = new ProfileMetricsService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
    env,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
