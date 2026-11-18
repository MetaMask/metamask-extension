import {
  OnboardingController,
  OnboardingControllerMessenger,
} from '../controllers/onboarding';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the onboarding controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.platform - The extension platform used to observe tab removal.
 * @returns The initialized controller.
 */
export const OnboardingControllerInit: MessengerClientInitFunction<
  OnboardingController,
  OnboardingControllerMessenger
> = ({ controllerMessenger, persistedState, platform }) => {
  const messengerClient = new OnboardingController({
    state: persistedState.OnboardingController,
    messenger: controllerMessenger,
    platform,
  });

  return {
    messengerClient,
  };
};
