import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { waitFor } from '@testing-library/react';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications';
import * as actions from '../../store/actions';
import {
  useEnableProfileSyncing,
  useDisableProfileSyncing,
  useAccountSyncingEffect,
  useDeleteAccountSyncingDataFromUserStorage,
} from './useProfileSyncing';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../store/actions', () => ({
  performSignIn: jest.fn(),
  performSignOut: jest.fn(),
  enableProfileSyncing: jest.fn(),
  disableProfileSyncing: jest.fn(),
  showLoadingIndication: jest.fn(),
  hideLoadingIndication: jest.fn(),
  syncInternalAccountsWithUserStorage: jest.fn(),
  deleteAccountSyncingDataFromUserStorage: jest.fn(),
}));

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

const arrangeMocks = (
  metamaskStateOverrides?: ArrangeMocksMetamaskStateOverrides,
) => {
  const store = mockStore({
    metamask: {
      ...initialMetamaskState,
      ...metamaskStateOverrides,
      participateInMetaMetrics: false,
      internalAccounts: {
        accounts: {
          '0x123': {
            address: '0x123',
            id: 'account1',
            metadata: {},
            options: {},
            methods: [],
            type: 'eip155:eoa',
          },
        },
      },
    },
  });

  store.dispatch = jest.fn().mockImplementation((action) => {
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }
    return Promise.resolve();
  });

  jest.clearAllMocks();

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

describe('useProfileSyncing', () => {
  it('should enable profile syncing', async () => {
    const { store } = arrangeMocks();

    const { result } = renderHook(() => useEnableProfileSyncing(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    act(() => {
      result.current.enableProfileSyncing();
    });

    expect(actions.enableProfileSyncing).toHaveBeenCalled();
  });

  it('should disable profile syncing', async () => {
    const { store } = arrangeMocks();

    const { result } = renderHook(() => useDisableProfileSyncing(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    act(() => {
      result.current.disableProfileSyncing();
    });

    expect(actions.disableProfileSyncing).toHaveBeenCalled();
  });

  it('should dispatch account syncing when conditions are met', async () => {
    const { store } = arrangeMocks({
      isSignedIn: true,
      isProfileSyncingEnabled: true,
    });

    renderHook(() => useAccountSyncingEffect(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    await waitFor(() => {
      expect(actions.syncInternalAccountsWithUserStorage).toHaveBeenCalled();
    });
  });

  it('should not dispatch account syncing when conditions are not met', async () => {
    const { store } = arrangeMocks();

    renderHook(() => useAccountSyncingEffect(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    await waitFor(() => {
      expect(
        actions.syncInternalAccountsWithUserStorage,
      ).not.toHaveBeenCalled();
    });
  });

  it('should dispatch account sync data deletion', async () => {
    const { store } = arrangeMocks();

    const { result } = renderHook(
      () => useDeleteAccountSyncingDataFromUserStorage(),
      {
        wrapper: ({ children }) => (
          <RenderWithProviders store={store}>{children}</RenderWithProviders>
        ),
      },
    );

    act(() => {
      result.current.dispatchDeleteAccountSyncingDataFromUserStorage();
    });

    expect(actions.deleteAccountSyncingDataFromUserStorage).toHaveBeenCalled();
  });
});
