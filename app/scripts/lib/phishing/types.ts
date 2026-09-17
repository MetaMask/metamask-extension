import type { PhishingController } from '@metamask/phishing-controller';

/**
 * Narrow controller slice required for early phishing detection in the background.
 */
export type PhishingDetectionController = {
  onboardingController: {
    state: {
      completedOnboarding: boolean;
    };
  };
  preferencesController: {
    state: {
      usePhishDetect: boolean;
    };
  };
  phishingController: Pick<
    PhishingController,
    'maybeUpdateState' | 'isBlockedRequest' | 'test'
  >;
};
