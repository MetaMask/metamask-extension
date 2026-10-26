import { renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import {
  OnboardingTraceContextProvider,
  useOnboardingTrace,
} from './onboarding-trace';

describe('useOnboardingTrace', () => {
  it('returns the actions provided by the lifecycle owner', () => {
    const actions = {
      startJourney: jest.fn(),
      endJourney: jest.fn(),
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
      <OnboardingTraceContextProvider value={actions}>
        {children}
      </OnboardingTraceContextProvider>
    );

    const { result } = renderHook(() => useOnboardingTrace(), { wrapper });

    expect(result.current).toBe(actions);
  });

  it('provides safe no-op actions outside an onboarding lifecycle', () => {
    const { result } = renderHook(() => useOnboardingTrace());

    expect(() => result.current.startJourney()).not.toThrow();
    expect(() =>
      result.current.endJourney({ success: false, abandoned: true }),
    ).not.toThrow();
  });
});
