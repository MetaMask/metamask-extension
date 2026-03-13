import {
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionService,
} from '@metamask/subscription-controller';
import { createDeferredPromise } from '@metamask/utils';
import type { SnapControllerState } from '@metamask/snaps-controllers';
import { ControllerInitFunction } from '../types';
import { SubscriptionControllerInitMessenger } from '../messengers/subscription';
import { loadShieldConfig } from '../../../../shared/lib/shield';
import { captureException as captureExceptionWithSentry } from '../../../../shared/lib/sentry';

const shieldConfig = loadShieldConfig();

// Track snap initialization state to avoid race condition with authentication
const snapInitPromise = createDeferredPromise<void>();
let snapInitialized = false;

export const SubscriptionControllerInit: ControllerInitFunction<
  SubscriptionController,
  SubscriptionControllerMessenger,
  SubscriptionControllerInitMessenger
> = (request) => {
  const { initMessenger, controllerMessenger, persistedState } = request;

  // Subscribe to SnapController initialization completion
  // This resolves the race condition between snap initialization and authentication
  const handleSnapStateChange = (state: SnapControllerState) => {
    // Check if message-signing snap is loaded (has source code)
    const messageSigningSnap =
      state.snaps?.['npm:@metamask/message-signing-snap'];
    if (messageSigningSnap && !snapInitialized) {
      snapInitialized = true;
      snapInitPromise.resolve();
      // Unsubscribe after initialization
      initMessenger.unsubscribe(
        'SnapController:stateChange',
        handleSnapStateChange,
      );
    }
  };

  // Listen for snap state changes
  initMessenger.subscribe('SnapController:stateChange', handleSnapStateChange);

  // Also check current state in case snap is already loaded
  try {
    const currentState = initMessenger.call('SnapController:getState');
    handleSnapStateChange(currentState);
  } catch {
    // If we can't get state, we'll wait for the event
  }

  const subscriptionService = new SubscriptionService({
    env: shieldConfig.subscriptionEnv,
    auth: {
      getAccessToken: async () => {
        // Wait for snap initialization before attempting authentication
        if (!snapInitialized) {
          try {
            // Wait up to 10 seconds for snap initialization
            await Promise.race([
              snapInitPromise.promise,
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error('Snap initialization timeout')),
                  10000,
                ),
              ),
            ]);
          } catch (error) {
            // If initialization times out, let the auth attempt proceed
            // It will fail with a more specific error
            console.warn(
              'Snap initialization not complete before auth request:',
              error,
            );
          }
        }

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
