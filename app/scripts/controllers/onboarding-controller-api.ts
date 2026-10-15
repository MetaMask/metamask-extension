import type {
  OnboardingJourneyTraceEndRequest,
  OnboardingJourneyTraceId,
  OnboardingJourneyTraceRequest,
} from '../../../shared/types/onboarding';
import type { OnboardingController } from './onboarding';

/**
 * Create the onboarding API exposed to trusted UI connections.
 *
 * The browser tab ID is resolved from the connection sender when available,
 * without exposing it to the UI.
 *
 * @param onboardingController - The onboarding controller.
 * @param sender - The browser message sender for the trusted connection.
 * @returns Bound onboarding controller methods.
 */
export function getOnboardingControllerApi(
  onboardingController: OnboardingController,
  sender: {
    tab?: {
      id?: number;
    };
  } = {},
): {
  setSeedPhraseBackedUp: OnboardingController['setSeedPhraseBackedUp'];
  completeOnboarding: OnboardingController['completeOnboarding'];
  setHasSeenOnboardingCompletionPage: OnboardingController['setHasSeenOnboardingCompletionPage'];
  setFirstTimeFlowType: OnboardingController['setFirstTimeFlowType'];
  startOnboardingJourney: (
    request: OnboardingJourneyTraceRequest,
  ) => OnboardingJourneyTraceId | undefined;
  updateOnboardingJourney: (request: OnboardingJourneyTraceRequest) => void;
  endOnboardingJourney: (request: OnboardingJourneyTraceEndRequest) => void;
} {
  const tabId = sender.tab?.id;

  return {
    setSeedPhraseBackedUp:
      onboardingController.setSeedPhraseBackedUp.bind(onboardingController),
    completeOnboarding:
      onboardingController.completeOnboarding.bind(onboardingController),
    setHasSeenOnboardingCompletionPage:
      onboardingController.setHasSeenOnboardingCompletionPage.bind(
        onboardingController,
      ),
    setFirstTimeFlowType:
      onboardingController.setFirstTimeFlowType.bind(onboardingController),
    // Onboarding journey sentry tracing
    startOnboardingJourney: (request) =>
      onboardingController.startOnboardingJourney({
        ...request,
        tabId,
      }),
    updateOnboardingJourney: (request) =>
      onboardingController.updateOnboardingJourney({
        ...request,
        tabId,
      }),
    endOnboardingJourney: (request) =>
      onboardingController.endOnboardingJourney({
        ...request,
        tabId,
      }),
  };
}
