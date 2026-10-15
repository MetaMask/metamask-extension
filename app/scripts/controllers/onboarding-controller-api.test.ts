import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import type { OnboardingController } from './onboarding';
import { getOnboardingControllerApi } from './onboarding-controller-api';

describe('getOnboardingControllerApi', () => {
  it('returns bound legacy onboarding methods', () => {
    const onboardingController = {
      setSeedPhraseBackedUp: jest.fn(),
      completeOnboarding: jest.fn(),
      setHasSeenOnboardingCompletionPage: jest.fn(),
      setFirstTimeFlowType: jest.fn(),
    } as unknown as OnboardingController;
    const api = getOnboardingControllerApi(onboardingController);

    api.setSeedPhraseBackedUp(true);
    api.completeOnboarding();
    api.setHasSeenOnboardingCompletionPage(true);
    api.setFirstTimeFlowType(FirstTimeFlowType.create);

    expect(onboardingController.setSeedPhraseBackedUp).toHaveBeenCalledWith(
      true,
    );
    expect(onboardingController.completeOnboarding).toHaveBeenCalled();
    expect(
      onboardingController.setHasSeenOnboardingCompletionPage,
    ).toHaveBeenCalledWith(true);
    expect(onboardingController.setFirstTimeFlowType).toHaveBeenCalledWith(
      FirstTimeFlowType.create,
    );
  });

  it('scopes journey requests to the sender tab', () => {
    const onboardingController = {
      setSeedPhraseBackedUp: jest.fn(),
      completeOnboarding: jest.fn(),
      setHasSeenOnboardingCompletionPage: jest.fn(),
      setFirstTimeFlowType: jest.fn(),
      startOnboardingJourney: jest.fn().mockReturnValue('trace-id'),
      updateOnboardingJourney: jest.fn(),
      endOnboardingJourney: jest.fn(),
    } as unknown as OnboardingController;
    const api = getOnboardingControllerApi(onboardingController, {
      tab: { id: 42 },
    });

    expect(api.startOnboardingJourney({ lastStep: 'welcome' })).toBe(
      'trace-id',
    );
    api.updateOnboardingJourney({ lastStep: 'create-password' });
    api.endOnboardingJourney({
      lastStep: 'complete',
      success: true,
    });

    expect(onboardingController.startOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      tabId: 42,
    });
    expect(onboardingController.updateOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'create-password',
      tabId: 42,
    });
    expect(onboardingController.endOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'complete',
      success: true,
      tabId: 42,
    });
  });

  it('keeps journey tracing working without a tab ID', () => {
    const onboardingController = {
      setSeedPhraseBackedUp: jest.fn(),
      completeOnboarding: jest.fn(),
      setHasSeenOnboardingCompletionPage: jest.fn(),
      setFirstTimeFlowType: jest.fn(),
      startOnboardingJourney: jest.fn().mockReturnValue('trace-id'),
      updateOnboardingJourney: jest.fn(),
      endOnboardingJourney: jest.fn(),
    } as unknown as OnboardingController;
    const api = getOnboardingControllerApi(onboardingController, {});

    expect(api.startOnboardingJourney({ lastStep: 'welcome' })).toBe(
      'trace-id',
    );
    api.updateOnboardingJourney({ lastStep: 'welcome' });
    api.endOnboardingJourney({
      lastStep: 'welcome',
      success: false,
      abandoned: true,
    });

    expect(onboardingController.startOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      tabId: undefined,
    });
    expect(onboardingController.updateOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      tabId: undefined,
    });
    expect(onboardingController.endOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      success: false,
      abandoned: true,
      tabId: undefined,
    });
  });
});
