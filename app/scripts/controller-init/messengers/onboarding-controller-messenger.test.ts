import { Messenger } from '@metamask/messenger';
import { getOnboardingControllerMessenger } from './onboarding-controller-messenger';
import { getRootMessenger } from '.';

describe('getOnboardingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger();
    const onboardingControllerMessenger =
      getOnboardingControllerMessenger(messenger);

    expect(onboardingControllerMessenger).toBeInstanceOf(Messenger);
  });
});
