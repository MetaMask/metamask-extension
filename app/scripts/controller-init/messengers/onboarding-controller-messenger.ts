import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type OnboardingControllerMessenger = ReturnType<
  typeof getOnboardingControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * onboarding controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getOnboardingControllerMessenger(messenger: RootMessenger) {
  return new Messenger({
    namespace: 'OnboardingController',
    parent: messenger,
  });
}
