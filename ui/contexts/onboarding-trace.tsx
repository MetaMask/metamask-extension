import React, { createContext, useContext, type ReactNode } from 'react';
import type { OnboardingJourneyTraceEndData } from '../../shared/types/onboarding';

export type OnboardingTraceContextValue = {
  startJourney: () => void;
  endJourney: (data: OnboardingJourneyTraceEndData) => void;
};

const defaultOnboardingTraceContext: OnboardingTraceContextValue = {
  startJourney: () => undefined,
  endJourney: () => undefined,
};

const OnboardingTraceContext = createContext<OnboardingTraceContextValue>(
  defaultOnboardingTraceContext,
);

export function OnboardingTraceContextProvider({
  value,
  children,
}: Readonly<{
  value: OnboardingTraceContextValue;
  children: ReactNode;
}>) {
  return (
    <OnboardingTraceContext.Provider value={value}>
      {children}
    </OnboardingTraceContext.Provider>
  );
}

export function useOnboardingTrace(): OnboardingTraceContextValue {
  return useContext(OnboardingTraceContext);
}
