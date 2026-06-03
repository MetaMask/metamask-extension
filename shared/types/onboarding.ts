import { FirstTimeFlowType } from '../constants/onboarding';

/**
 * State shape for the OnboardingController.
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: FirstTimeFlowType | null;
  completedOnboarding: boolean;
  onboardingTabs?: Record<string, string>;
};
