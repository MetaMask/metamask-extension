import {
  Env,
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { ControllerInitFunction } from '../types';
import { SubscriptionControllerInitMessenger } from '../messengers/subscription';

export const SubscriptionControllerInit: ControllerInitFunction<
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;
  const subscriptionService = new SubscriptionService({
    env: Env.DEV,
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
