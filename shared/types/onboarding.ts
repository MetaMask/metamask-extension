import { FirstTimeFlowType } from '../constants/onboarding';

/**
 * State shape for the OnboardingController.
 */
export type OnboardingControllerState = {
  seedPhraseBackedUp: boolean | null;
  firstTimeFlowType: FirstTimeFlowType | null;
  completedOnboarding: boolean;
  hasSeenOnboardingCompletionPage: boolean;
  onboardingTabs?: Record<string, string>;
};

/**
 * Request data used to update an onboarding journey.
 */
export type OnboardingJourneyTraceRequest = {
  lastStep: string;
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

/**
 * Request data used by the onboarding controller after the trusted connection
 * has supplied the browser tab ID.
 */
export type OnboardingJourneyTraceControllerRequest =
  OnboardingJourneyTraceRequest & {
    tabId?: number;
  };

/**
 * Request data used by the onboarding controller to end a journey.
 */
export type OnboardingJourneyTraceControllerEndRequest =
  OnboardingJourneyTraceControllerRequest & OnboardingJourneyTraceEndData;
