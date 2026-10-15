import { act, render, renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../../contexts/metametrics';
import { submitRequestToBackground } from '../../../store/background-connection';
import { useOnboardingTrace } from '../../../contexts/onboarding-trace';
import { TraceName } from '../../../../shared/lib/trace';
import {
  getOnboardingTraceStep,
  OnboardingTraceProvider,
} from './useOnboardingTrace';

/* eslint-disable @typescript-eslint/naming-convention */

jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

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
            <OnboardingTraceProvider>{children}</OnboardingTraceProvider>
          </MetaMetricsContext.Provider>
        </MemoryRouter>
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onboardingParentContext.current = null;
    submitRequestToBackgroundMock.mockImplementation((method) =>
      method === 'startOnboardingJourney'
        ? Promise.resolve('journey-id')
        : Promise.resolve(undefined),
    );
  });

  it('starts the overall journey only once when requested repeatedly', async () => {
    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.startJourney();
      result.current.startJourney();
      await Promise.resolve();
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(1);
    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'startOnboardingJourney',
      [{ lastStep: 'welcome' }],
    );
    expect(onboardingParentContext.current).toEqual({
      _name: TraceName.OnboardingJourneyOverall,
      _id: 'journey-id',
    });
  });

  it('ends the journey once with its current step and result', async () => {
    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.startJourney();
      result.current.endJourney({ success: true });
      result.current.endJourney({ success: false, abandoned: true });
      await Promise.resolve();
    });

    expect(submitRequestToBackgroundMock).toHaveBeenCalledTimes(2);
    expect(submitRequestToBackgroundMock).toHaveBeenNthCalledWith(
      2,
      'endOnboardingJourney',
      [{ lastStep: 'welcome', success: true }],
    );
  });

  it('uses the latest route as the last step', async () => {
    const navigateRef: { current?: ReturnType<typeof useNavigate> } = {};

    function TestComponent() {
      navigateRef.current = useNavigate();
      const { startJourney, endJourney } = useOnboardingTrace();
      return (
        <>
          <button onClick={startJourney}>Start</button>
          <button
            onClick={() => endJourney({ success: false, abandoned: true })}
          >
            End
          </button>
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
          <OnboardingTraceProvider>
            <TestComponent />
          </OnboardingTraceProvider>
        </MetaMetricsContext.Provider>
      </MemoryRouter>,
    );

    await act(async () => {
      getByRole('button', { name: 'Start' }).click();
      await Promise.resolve();
    });
    await act(async () => {
      navigateRef.current?.('/onboarding/review-recovery-phrase');
      await Promise.resolve();
    });
    await act(async () => {
      getByRole('button', { name: 'End' }).click();
      await Promise.resolve();
    });

    expect(submitRequestToBackgroundMock).toHaveBeenNthCalledWith(
      2,
      'updateOnboardingJourney',
      [{ lastStep: 'review-recovery-phrase' }],
    );
    expect(submitRequestToBackgroundMock).toHaveBeenNthCalledWith(
      3,
      'endOnboardingJourney',
      [
        {
          lastStep: 'review-recovery-phrase',
          success: false,
          abandoned: true,
        },
      ],
    );
  });
});
