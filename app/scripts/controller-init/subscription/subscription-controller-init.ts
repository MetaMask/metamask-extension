import {
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { ControllerInitFunction } from '../types';
import { SubscriptionControllerInitMessenger } from '../messengers/subscription';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException as captureExceptionWithSentry } from '../../../../shared/lib/sentry';

const shieldConfig = loadShieldConfig();

export const SubscriptionControllerInit: ControllerInitFunction<
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;
  const subscriptionService = new SubscriptionService({
    env: shieldConfig.subscriptionEnv,
    auth: {
      getAccessToken: async () => {
        try {
          return await initMessenger.call(
            'AuthenticationController:getBearerToken',
          );
        } catch (error) {
          // During initialization, the message-signing snap source code may not be loaded yet.
          // This can happen if SubscriptionController starts polling before
          // SnapController.init() completes loading preinstalled snaps.
          // Don't report this to Sentry as it's an expected race condition.
          if (
            error instanceof Error &&
            error.message.includes('Source code for Snap') &&
            error.message.includes('not found')
          ) {
            // Return a more specific error that won't trigger Sentry reporting
            throw new Error(
              'Snap not initialized yet - authentication unavailable during startup',
            );
          }
          throw error;
        }
      },
    },
    fetchFunction: fetch.bind(globalThis),
    captureException: (error) => {
      // Filter out the expected snap initialization race condition errors
      if (
        error instanceof Error &&
        error.message.includes('Snap not initialized yet')
      ) {
        // Don't send to Sentry - this is expected during startup
        console.debug(
          'SubscriptionController: Skipping Sentry report for expected snap initialization race:',
          error.message,
        );
        return;
      }
      // Report all other errors to Sentry
      captureExceptionWithSentry(error);
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
