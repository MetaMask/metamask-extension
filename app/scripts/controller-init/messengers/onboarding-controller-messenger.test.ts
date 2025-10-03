import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getOnboardingControllerMessenger } from './onboarding-controller-messenger';

describe('getOnboardingControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const onboardingControllerMessenger =
      getOnboardingControllerMessenger(messenger);

    expect(onboardingControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
