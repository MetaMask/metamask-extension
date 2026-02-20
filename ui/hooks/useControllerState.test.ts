import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { StateSubscriptionService } from '../store/state-subscription-service';
import {
  StateSubscriptionServiceContext,
  useControllerState,
  useControllerFullState,
} from './useControllerState';

type TestState = {
  theme: string;
  locale: string;
};

function createWrapper(service: StateSubscriptionService) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      StateSubscriptionServiceContext.Provider,
      { value: service },
      children,
    );
  };
}

describe('useControllerState', () => {
  let service: StateSubscriptionService;

  beforeEach(() => {
    service = new StateSubscriptionService();
    service.initialize({
      PreferencesController: { theme: 'dark', locale: 'en' } as TestState,
      NetworkController: { chainId: '0x1' },
    });
  });

  it('returns the selected value from controller state', () => {
    const { result } = renderHook(
      () =>
        useControllerState<TestState, string>(
          'PreferencesController',
          (state) => state.theme,
        ),
      { wrapper: createWrapper(service) },
    );

    expect(result.current).toBe('dark');
  });

  it('re-renders when the selected value changes', () => {
    const { result } = renderHook(
      () =>
        useControllerState<TestState, string>(
          'PreferencesController',
          (state) => state.theme,
        ),
      { wrapper: createWrapper(service) },
    );

    expect(result.current).toBe('dark');

    act(() => {
      service.applyBatch({
        PreferencesController: [
          { op: 'replace' as const, path: ['theme'], value: 'light' },
        ],
      });
      service.flush();
    });

    expect(result.current).toBe('light');
  });

  it('does not re-render when an unrelated controller changes', () => {
    let renderCount = 0;

    const { result } = renderHook(
      () => {
        renderCount += 1;
        return useControllerState<TestState, string>(
          'PreferencesController',
          (state) => state.theme,
        );
      },
      { wrapper: createWrapper(service) },
    );

    expect(result.current).toBe('dark');
    const initialRenderCount = renderCount;

    act(() => {
      service.applyBatch({
        NetworkController: { chainId: '0x5' },
      });
      service.flush();
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  it('does not re-render when a non-selected property changes', () => {
    let renderCount = 0;

    const { result } = renderHook(
      () => {
        renderCount += 1;
        return useControllerState<TestState, string>(
          'PreferencesController',
          (state) => state.theme,
        );
      },
      { wrapper: createWrapper(service) },
    );

    expect(result.current).toBe('dark');
    const initialRenderCount = renderCount;

    act(() => {
      service.applyBatch({
        PreferencesController: [
          { op: 'replace' as const, path: ['locale'], value: 'fr' },
        ],
      });
      service.flush();
    });

    expect(renderCount).toBe(initialRenderCount);
  });

  it('throws when context is not provided', () => {
    const { result } = renderHook(() =>
      useControllerState('PreferencesController', (s: TestState) => s.theme),
    );

    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(
      /StateSubscriptionServiceContext is not provided/u,
    );
  });

  it('throws when requesting an unregistered controller', () => {
    const { result } = renderHook(
      () =>
        useControllerState('NonExistent', (s: Record<string, unknown>) => s),
      { wrapper: createWrapper(service) },
    );

    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(/no proxy registered/u);
  });
});

describe('useControllerFullState', () => {
  let service: StateSubscriptionService;

  beforeEach(() => {
    service = new StateSubscriptionService();
    service.initialize({
      PreferencesController: { theme: 'dark', locale: 'en' } as TestState,
    });
  });

  it('returns the full controller state', () => {
    const { result } = renderHook(
      () => useControllerFullState<TestState>('PreferencesController'),
      { wrapper: createWrapper(service) },
    );

    expect(result.current).toEqual({ theme: 'dark', locale: 'en' });
  });

  it('re-renders when any property changes', () => {
    const { result } = renderHook(
      () => useControllerFullState<TestState>('PreferencesController'),
      { wrapper: createWrapper(service) },
    );

    act(() => {
      service.applyBatch({
        PreferencesController: [
          { op: 'replace' as const, path: ['locale'], value: 'fr' },
        ],
      });
      service.flush();
    });

    expect(result.current).toEqual({ theme: 'dark', locale: 'fr' });
  });
});
