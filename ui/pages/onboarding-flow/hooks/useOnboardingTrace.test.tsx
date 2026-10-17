import { act, render, renderHook } from '@testing-library/react';
import React, { type ReactNode } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import {
  MetaMetricsContext,
  type MetaMetricsContextValue,
} from '../../../contexts/metametrics';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { UIMessengerProvider } from '../../../contexts/ui-messenger';
import { createMockUIMessenger } from '../../../../test/lib/mock-ui-messenger';
import { useOnboardingTrace } from '../../../contexts/onboarding-trace';
import { TraceName } from '../../../../shared/lib/trace';
import { ONBOARDING_TRACE_ROUTE_CAPABILITIES } from '../messenger';
import {
  getOnboardingTraceStep,
  OnboardingTraceProvider,
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
  const startOnboardingJourney = jest.fn();
  const updateOnboardingJourney = jest.fn();
  const endOnboardingJourney = jest.fn();

  const contextValue: MetaMetricsContextValue = {
    trackEvent: jest.fn().mockResolvedValue(undefined),
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext,
  };

  const createWrapper = (
    initialEntry = '/onboarding/welcome',
    tabId?: number,
  ) => {
    const store = configureStore({
      reducer: () => ({
        activeTab: { id: tabId },
        metamask: {
          appActiveTab: tabId === undefined ? undefined : { id: tabId },
        },
      }),
    });

    return function wrapper({ children }: { children: ReactNode }) {
      const uiMessenger = createMockUIMessenger({
        'OnboardingController:startOnboardingJourney': startOnboardingJourney,
        'OnboardingController:updateOnboardingJourney': updateOnboardingJourney,
        'OnboardingController:endOnboardingJourney': endOnboardingJourney,
      } as never);

      return (
        <MemoryRouter
          initialEntries={[initialEntry]}
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Provider store={store}>
            <UIMessengerProvider value={uiMessenger}>
              <RouteMessengerProvider
                path="/onboarding"
                capabilities={ONBOARDING_TRACE_ROUTE_CAPABILITIES}
              >
                <MetaMetricsContext.Provider value={contextValue}>
                  <OnboardingTraceProvider>{children}</OnboardingTraceProvider>
                </MetaMetricsContext.Provider>
              </RouteMessengerProvider>
            </UIMessengerProvider>
          </Provider>
        </MemoryRouter>
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onboardingParentContext.current = null;
    startOnboardingJourney.mockResolvedValue('journey-id');
    updateOnboardingJourney.mockResolvedValue(undefined);
    endOnboardingJourney.mockResolvedValue(undefined);
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

    expect(startOnboardingJourney).toHaveBeenCalledTimes(1);
    expect(startOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
    });
    expect(onboardingParentContext.current).toEqual({
      _name: TraceName.OnboardingJourneyOverall,
      _id: 'journey-id',
    });
  });

  it('publishes the journey name before the trace id resolves', async () => {
    let resolveJourney: (traceId: string | undefined) => void = () => undefined;
    startOnboardingJourney.mockReturnValue(
      new Promise((resolve) => {
        resolveJourney = resolve;
      }),
    );

    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.startJourney();
    });

    expect(onboardingParentContext.current).toEqual({
      _name: TraceName.OnboardingJourneyOverall,
    });

    await act(async () => {
      resolveJourney('journey-id');
    });

    expect(onboardingParentContext.current).toEqual({
      _name: TraceName.OnboardingJourneyOverall,
      _id: 'journey-id',
    });
  });

  it('includes the UI tab ID in tracing requests', async () => {
    const { result } = renderHook(() => useOnboardingTrace(), {
      wrapper: createWrapper('/onboarding/welcome', 42),
    });

    await act(async () => {
      result.current.startJourney();
      await Promise.resolve();
    });

    expect(startOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      tabId: '42',
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

    expect(startOnboardingJourney).toHaveBeenCalledTimes(1);
    expect(endOnboardingJourney).toHaveBeenCalledTimes(1);
    expect(endOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'welcome',
      success: true,
    });
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

    const Wrapper = createWrapper();
    const { getByRole } = render(
      <Wrapper>
        <TestComponent />
      </Wrapper>,
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

    expect(updateOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'review-recovery-phrase',
    });
    expect(endOnboardingJourney).toHaveBeenCalledWith({
      lastStep: 'review-recovery-phrase',
      success: false,
      abandoned: true,
    });
  });
});
