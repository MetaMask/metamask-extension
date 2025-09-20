import {
  Env,
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { ControllerInitFunction } from '../types';
import { SubscriptionControllerInitMessenger } from '../messengers/subscription';
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

export const SubscriptionControllerInit: ControllerInitFunction<
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;
  const subscriptionService = new SubscriptionService({
    env: isDevOrTestBuild() ? Env.DEV : Env.PRD,
    auth: {
      getAccessToken: () =>
        initMessenger.call('AuthenticationController:getBearerToken'),
    },
  });

  const controller = new SubscriptionController({
    messenger: controllerMessenger,
    state: persistedState.SubscriptionController,
    subscriptionService,
  });

  return {
    controller,
  };
};
