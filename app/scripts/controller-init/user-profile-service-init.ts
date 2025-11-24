import {
  Env,
  UserProfileService,
  UserProfileServiceMessenger,
} from '@metamask/user-profile-controller';
import { ControllerInitFunction } from './types';

/**
 * Initialize the user profile service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @returns The initialized controller.
 */
export const UserProfileServiceInit: ControllerInitFunction<
  UserProfileService,
  UserProfileServiceMessenger
> = ({ controllerMessenger }) => {
  // The environment must be the same used by AuthenticationController.
  const env = Env.PRD;

  const controller = new UserProfileService({
    messenger: controllerMessenger,
    fetch: fetch.bind(globalThis),
    env,
  });

  return {
    controller,
  };
};
