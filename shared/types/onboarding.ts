import { FirstTimeFlowType } from '../constants/onboarding';

/**
 * State shape for the OnboardingController.
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: FirstTimeFlowType | null;
  completedOnboarding: boolean;
  hasSeenOnboardingCompletionPage: boolean;
  /**
   * True after a journey ends successfully. Later mounts must not open another
   * trace for the same profile.
   */
  onboardingJourneyEnded: boolean;
  onboardingTabs?: Record<string, string>;
};

/**
 * Request data used to identify and update an onboarding journey.
 */
export type OnboardingJourneyTraceRequest = {
  lastStep: string;
  tabId?: string;
};

/**
 * Data used to end an onboarding journey.
 */
export type OnboardingJourneyTraceEndData = {
  success: boolean;
  abandoned?: true;
};

/**
 * Request data used to end an onboarding journey.
 */
export type OnboardingJourneyTraceEndRequest = OnboardingJourneyTraceRequest &
  OnboardingJourneyTraceEndData;
