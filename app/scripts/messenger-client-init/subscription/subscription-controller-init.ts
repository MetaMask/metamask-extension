import {
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { MessengerClientInitFunction } from '../types';
import { SubscriptionControllerInitMessenger } from '../messengers/subscription';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException as captureExceptionWithSentry } from '../../../../shared/lib/sentry';

const shieldConfig = loadShieldConfig();

export const SubscriptionControllerInit: MessengerClientInitFunction<
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;
  const subscriptionService = new SubscriptionService({
    env: shieldConfig.subscriptionEnv,
    auth: {
      getAccessToken: () =>
        initMessenger.call('AuthenticationController:getBearerToken'),
    },
    fetchFunction: fetch.bind(globalThis),
    captureException: captureExceptionWithSentry,
  });

  const messengerClient = new SubscriptionController({
    messenger: controllerMessenger,
    state: persistedState.SubscriptionController,
    subscriptionService,
  });

  return {
    messengerClient,
  };
};
