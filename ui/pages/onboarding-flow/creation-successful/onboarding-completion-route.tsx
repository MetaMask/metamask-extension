import React, { useEffect } from 'react';
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

  useEffect(() => {
    if (!shouldAutoComplete) {
      return;
    }

    completeOnboardingFromCompletionPage().catch((error) => {
      console.error('Failed to auto-complete onboarding:', error);
    });
  }, [shouldAutoComplete, completeOnboardingFromCompletionPage]);

  if (shouldAutoComplete) {
    return <LoadingScreen />;
  }

  return <CreationSuccessful />;
}
