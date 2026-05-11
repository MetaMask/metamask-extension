import { SnapAccountService } from '@metamask/snap-account-service';
import { MessengerClientInitFunction } from '../types';
import { SnapAccountServiceMessenger } from '../messengers/accounts';

/**
 * Initialize the Snap account service.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the service.
 * @param request.ensureOnboardingComplete - Ensure onboarding is complete before initializing.
 * @returns The initialized service.
 */
export const SnapAccountServiceInit: MessengerClientInitFunction<
  SnapAccountService,
  SnapAccountServiceMessenger
> = ({ controllerMessenger, ensureOnboardingComplete }) => {
  const service = new SnapAccountService({
    messenger: controllerMessenger,
    config: {
      snapPlatformWatcher: {
        ensureOnboardingComplete,
      }
    },
  });

  return {
    memStateKey: null,
    persistedStateKey: null,
    messengerClient: service,
  };
};
