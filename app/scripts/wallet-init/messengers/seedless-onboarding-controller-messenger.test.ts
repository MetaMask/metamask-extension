import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSeedlessOnboardingControllerInitMessenger } from './seedless-onboarding-controller-messenger';

describe('getSeedlessOnboardingControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const seedlessOnboardingControllerInitMessenger =
      getSeedlessOnboardingControllerInitMessenger(messenger);

    expect(seedlessOnboardingControllerInitMessenger).toBeInstanceOf(
      Messenger,
    );
  });
});
