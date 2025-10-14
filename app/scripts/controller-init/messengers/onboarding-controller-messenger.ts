import { Messenger } from '@metamask/base-controller';

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
export function getOnboardingControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'OnboardingController',

    // This controller doesn't call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
