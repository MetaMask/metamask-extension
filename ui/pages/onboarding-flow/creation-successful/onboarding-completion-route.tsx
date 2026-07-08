import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../../components/ui/loading-screen';
import { useOnboardingCompletion } from '../hooks/useOnboardingCompletion';
import CreationSuccessful from './creation-successful';

type OnboardingCompletionRouteProps = {
  shouldAutoComplete: boolean;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingCompletionRoute({
  shouldAutoComplete,
}: OnboardingCompletionRouteProps) {
  const { completeOnboardingFromCompletionPage } = useOnboardingCompletion();
  const [autoCompleteFailed, setAutoCompleteFailed] = useState(false);

  useEffect(() => {
    if (!shouldAutoComplete || autoCompleteFailed) {
      return;
    }

    // Pass `true` so the hook skips `sidePanel.open()` (no user gesture) while still
    // enabling the side panel on the next toolbar click and navigating home.
    completeOnboardingFromCompletionPage(shouldAutoComplete).catch((error) => {
      console.error('Failed to auto-complete onboarding:', error);
      setAutoCompleteFailed(true);
    });
  }, [
    autoCompleteFailed,
    shouldAutoComplete,
    completeOnboardingFromCompletionPage,
  ]);

  if (shouldAutoComplete && !autoCompleteFailed) {
    return <LoadingScreen />;
  }

  return <CreationSuccessful />;
}
