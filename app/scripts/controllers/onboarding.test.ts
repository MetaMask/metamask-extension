import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingController, { OnboardingControllerState } from './onboarding';

describe('OnboardingController', () => {
  let onboardingController: OnboardingController;

  beforeEach(() => {
    onboardingController = new OnboardingController({
      initState: {
        seedPhraseBackedUp: null,
        firstTimeFlowType: null,
        completedOnboarding: false,
        onboardingTabs: {},
      },
    });
  });

  it('should set the seedPhraseBackedUp property', () => {
    const newSeedPhraseBackUpState = true;
    onboardingController.setSeedPhraseBackedUp(newSeedPhraseBackUpState);
    const state: OnboardingControllerState =
      onboardingController.store.getState();
    expect(state.seedPhraseBackedUp).toBe(newSeedPhraseBackUpState);
  });

  it('should set the firstTimeFlowType property', () => {
    const type: FirstTimeFlowType = FirstTimeFlowType.create;
    onboardingController.setFirstTimeFlowType(type);
    const state: OnboardingControllerState =
      onboardingController.store.getState();
    expect(state.firstTimeFlowType).toBe(type);
  });

  it('should register a site for onboarding', async () => {
    const location = 'example.com';
    const tabId = '123';
    await onboardingController.registerOnboarding(location, tabId);
    const state: OnboardingControllerState =
      onboardingController.store.getState();
    expect(state.onboardingTabs?.[location]).toBe(tabId);
  });

  it('should skip update state if the location is already onboard', async () => {
    const location = 'example.com';
    const tabId = '123';
    await onboardingController.registerOnboarding(location, tabId);
    const state: OnboardingControllerState =
      onboardingController.store.getState();
    const updateStateSpy = jest.spyOn(
      onboardingController.store,
      'updateState',
    );

    expect(state.onboardingTabs?.[location]).toBe(tabId);
    expect(updateStateSpy).not.toHaveBeenCalled();
  });
});
