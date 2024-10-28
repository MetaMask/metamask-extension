import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../../contexts/metamask-notifications';
import * as actions from '../../../store/actions';
import {
  useEnableProfileSyncing,
  useDisableProfileSyncing,
  useShouldDispatchProfileSyncing,
} from './profileSyncing';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn?: boolean;
  isProfileSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
};

const initialMetamaskState: ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: false,
  isProfileSyncingEnabled: false,
  isUnlocked: true,
  useExternalServices: true,
  completedOnboarding: true,
};

const arrangeMockStore = (
  metamaskStateOverrides?: ArrangeMocksMetamaskStateOverrides,
) => {
  const store = mockStore({
    metamask: {
      ...initialMetamaskState,
      ...metamaskStateOverrides,
    },
  });

  store.dispatch = jest.fn().mockImplementation((action) => {
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }
    return Promise.resolve();
  });

  return { store };
};

const RenderWithProviders = ({
  store,
  children,
}: {
  store: Store;
  children: ReactNode;
}) => (
  <Provider store={store}>
    <MetamaskNotificationsProvider>{children}</MetamaskNotificationsProvider>
  </Provider>
);

describe('useEnableProfileSyncing()', () => {
  it('should enable profile syncing', async () => {
    const mockEnableProfileSyncingAction = jest.spyOn(
      actions,
      'enableProfileSyncing',
    );

    const { store } = arrangeMockStore();

    const { result } = renderHook(() => useEnableProfileSyncing(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    await act(async () => {
      await result.current.enableProfileSyncing();
    });

    expect(mockEnableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useDisableProfileSyncing()', () => {
  it('should disable profile syncing', async () => {
    const mockDisableProfileSyncingAction = jest.spyOn(
      actions,
      'disableProfileSyncing',
    );

    const { store } = arrangeMockStore();

    const { result } = renderHook(() => useDisableProfileSyncing(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockDisableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useShouldDispatchProfileSyncing()', () => {
  const testCases = (() => {
    const properties = [
      'isSignedIn',
      'isProfileSyncingEnabled',
      'isUnlocked',
      'useExternalServices',
      'completedOnboarding',
    ] as const;
    const baseState = {
      isSignedIn: true,
      isProfileSyncingEnabled: true,
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
    };

    const failureStateCases: {
      state: ArrangeMocksMetamaskStateOverrides;
      failingField: string;
    }[] = [];

    // Generate test cases by toggling each property
    properties.forEach((property) => {
      const state = { ...baseState, [property]: false };
      failureStateCases.push({ state, failingField: property });
    });

    const successTestCase = { state: baseState };

    return { successTestCase, failureStateCases };
  })();

  it('should return true if all conditions are met', () => {
    const { store } = arrangeMockStore(testCases.successTestCase.state);
    const hook = renderHook(() => useShouldDispatchProfileSyncing(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });
    expect(hook.result.current).toBe(true);
  });

  testCases.failureStateCases.forEach(({ state, failingField }) => {
    it(`should return false if not all conditions are met [${failingField} = false]`, () => {
      const { store } = arrangeMockStore(state);
      const hook = renderHook(() => useShouldDispatchProfileSyncing(), {
        wrapper: ({ children }) => (
          <RenderWithProviders store={store}>{children}</RenderWithProviders>
        ),
      });
      expect(hook.result.current).toBe(false);
    });
  });
});
