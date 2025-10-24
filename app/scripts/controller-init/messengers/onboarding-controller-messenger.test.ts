import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getOnboardingControllerMessenger } from './onboarding-controller-messenger';

describe('getOnboardingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const onboardingControllerMessenger =
      getOnboardingControllerMessenger(messenger);

    expect(onboardingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
