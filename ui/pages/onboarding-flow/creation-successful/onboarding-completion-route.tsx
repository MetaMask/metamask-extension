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

    completeOnboardingFromCompletionPage({
      // No user gesture here; skip `sidePanel.open()` but still enable side panel on
      // the next toolbar click via `setUseSidePanelAsDefault` in the hook.
      openSidePanel: false,
    }).catch((error) => {
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
