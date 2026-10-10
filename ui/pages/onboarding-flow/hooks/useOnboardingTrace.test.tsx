import { act, render, renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../../contexts/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import {
  getOnboardingTraceStep,
  useOnboardingTrace,
} from './useOnboardingTrace';

/* eslint-disable @typescript-eslint/naming-convention */

describe('getOnboardingTraceStep', () => {
  it('returns the route after the onboarding prefix', () => {
    expect(getOnboardingTraceStep('/onboarding/create-password')).toBe(
      'create-password',
    );
  });

  it('returns root for the onboarding container route', () => {
    expect(getOnboardingTraceStep('/onboarding')).toBe('root');
  });

  it('leaves non-onboarding paths unchanged', () => {
    expect(getOnboardingTraceStep('/home')).toBe('/home');
  });
});

describe('useOnboardingTrace', () => {
  const bufferedTrace = jest.fn().mockResolvedValue(undefined);
  const bufferedEndTrace = jest.fn();
  const onboardingParentContext = { current: null };

  const contextValue: MetaMetricsContextValue = {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext,
  };

  const createWrapper = (initialEntry = '/onboarding/welcome') => {
    return function wrapper({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter
          initialEntries={[initialEntry]}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <MetaMetricsContext.Provider value={contextValue}>
            {children}
          </MetaMetricsContext.Provider>
        </MemoryRouter>
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onboardingParentContext.current = null;
  });

  it('starts the overall journey when requested', () => {
    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper(),
    });

    expect(bufferedTrace).not.toHaveBeenCalled();

    act(() => {
      result.current.startJourney();
    });

    expect(bufferedTrace).toHaveBeenCalledTimes(1);
    expect(bufferedTrace).toHaveBeenCalledWith({
      name: TraceName.OnboardingJourneyOverall,
      op: TraceOperation.OnboardingUserJourney,
    });
  });

  it('ends the journey once with its current step and outcome', () => {
    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startJourney();
      result.current.endJourney('completed');
      result.current.endJourney('abandoned');
    });

    expect(bufferedEndTrace).toHaveBeenCalledTimes(1);
    expect(bufferedEndTrace).toHaveBeenCalledWith({
      name: TraceName.OnboardingJourneyOverall,
      data: {
        outcome: 'completed',
        last_step: 'welcome',
      },
    });
  });

  it('uses the latest route as the last step', () => {
    const navigateRef: { current?: ReturnType<typeof useNavigate> } = {};

    function TestComponent() {
      navigateRef.current = useNavigate();
      const { startJourney, endJourney } = useOnboardingTrace();
      return (
        <>
          <button onClick={startJourney}>Start</button>
          <button onClick={() => endJourney('abandoned')}>End</button>
        </>
      );
    }

    const { getByRole } = render(
      <MemoryRouter
        initialEntries={['/onboarding/welcome']}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MetaMetricsContext.Provider value={contextValue}>
          <TestComponent />
        </MetaMetricsContext.Provider>
      </MemoryRouter>,
    );

    act(() => {
      getByRole('button', { name: 'Start' }).click();
      navigateRef.current?.('/onboarding/review-recovery-phrase');
    });
    act(() => {
      getByRole('button', { name: 'End' }).click();
    });

    expect(bufferedEndTrace).toHaveBeenCalledWith({
      name: TraceName.OnboardingJourneyOverall,
      data: {
        outcome: 'abandoned',
        last_step: 'review-recovery-phrase',
      },
    });
  });
});
