import { Messenger } from '@metamask/messenger';

import { getRootMessenger } from '../../../lib/messenger';
import { getSeedlessOnboardingControllerMessenger } from './seedless-onboarding-controller-messenger';

describe('getSeedlessOnboardingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const seedlessOnboardingControllerMessenger =
      getSeedlessOnboardingControllerMessenger(messenger);

    expect(seedlessOnboardingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
