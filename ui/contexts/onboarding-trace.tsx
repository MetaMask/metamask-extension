import React, { createContext, useContext, type ReactNode } from 'react';

export type OnboardingTraceOutcome = 'completed' | 'abandoned';

export type OnboardingTraceContextValue = {
  startJourney: () => void;
  endJourney: (outcome: OnboardingTraceOutcome) => void;
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
}: {
  value: OnboardingTraceContextValue;
  children: ReactNode;
}) {
  return (
    <OnboardingTraceContext.Provider value={value}>
      {children}
    </OnboardingTraceContext.Provider>
  );
}

export function useOnboardingTrace(): OnboardingTraceContextValue {
  return useContext(OnboardingTraceContext);
}
