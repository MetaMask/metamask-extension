import { ControllerMessenger } from '@metamask/base-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingController, {
  getDefaultOnboardingControllerState,
} from './onboarding';

function setupController(): OnboardingController {
  const controllerMessenger = new ControllerMessenger();
  const messenger = controllerMessenger.getRestricted({
    name: 'OnboardingController',
    allowedActions: [],
    allowedEvents: [],
  });
  const onboardingController = new OnboardingController({
    messenger,
    state: getDefaultOnboardingControllerState(),
  });
  return onboardingController;
}

describe('OnboardingController', () => {
  it('should set the seedPhraseBackedUp property', () => {
    const controller = setupController();
    const newSeedPhraseBackUpState = true;
    controller.setSeedPhraseBackedUp(newSeedPhraseBackUpState);
    expect(controller.state.seedPhraseBackedUp).toBe(newSeedPhraseBackUpState);
  });

  it('should set the firstTimeFlowType property', () => {
    const controller = setupController();
    const type: FirstTimeFlowType = FirstTimeFlowType.create;
    controller.setFirstTimeFlowType(type);
    expect(controller.state.firstTimeFlowType).toBe(type);
  });

  it('should register a site for onboarding', async () => {
    const controller = setupController();
    const location = 'example.com';
    const tabId = '123';
    await controller.registerOnboarding(location, tabId);
    expect(controller.state.onboardingTabs?.[location]).toBe(tabId);
  });
});
