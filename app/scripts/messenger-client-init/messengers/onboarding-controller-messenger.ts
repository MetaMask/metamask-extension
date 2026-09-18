import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';
import { OnboardingControllerMessenger } from '../../controllers/onboarding';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * onboarding controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getOnboardingControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<OnboardingControllerMessenger>,
    MessengerEvents<OnboardingControllerMessenger>
  >,
) {
  const onboardingControllerMessenger: OnboardingControllerMessenger =
    new Messenger({
      namespace: 'OnboardingController',
      parent: messenger,
    });

  return onboardingControllerMessenger;
}
