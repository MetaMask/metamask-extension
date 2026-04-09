import OnboardingController from '../controllers/onboarding';
import { OnboardingControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the onboarding controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const OnboardingControllerInit: ControllerInitFunction<
  OnboardingController,
  OnboardingControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new OnboardingController({
    state: persistedState.OnboardingController,
    messenger: controllerMessenger,
  });

  return {
    controller,
  };
};
