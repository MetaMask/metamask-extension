import { Messenger, RestrictedMessenger } from '@metamask/base-controller';

import { getSeedlessOnboardingControllerMessenger } from './seedless-onboarding-controller-messenger';

describe('getSeedlessOnboardingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const seedlessOnboardingControllerMessenger =
      getSeedlessOnboardingControllerMessenger(messenger);

    expect(seedlessOnboardingControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
