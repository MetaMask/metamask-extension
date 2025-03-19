import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import * as actions from '../../store/actions';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  useCreateNotifications,
  useDisableNotifications,
} from './useNotifications';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../store/actions', () => ({
  createOnChainTriggers: jest.fn(),
  deleteOnChainTriggersByAccount: jest.fn(),
  fetchAndUpdateMetamaskNotifications: jest.fn(),
  setFeatureAnnouncementsEnabled: jest.fn(),
  markMetamaskNotificationsAsRead: jest.fn(),
  showLoadingIndication: jest.fn(),
  hideLoadingIndication: jest.fn(),
  disableMetamaskNotifications: jest.fn(),
}));

jest.mock('./useProfileSyncing', () => ({
  useEnableProfileSyncing: jest.fn(() => ({
    enableProfileSyncing: jest.fn(),
  })),
  useAccountSyncingEffect: jest.fn(),
}));

describe('useNotifications', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        isMetamaskNotificationsEnabled: false,
        isProfileSyncingEnabled: false,
        internalAccounts: {
          accounts: [
            {
              address: '0x123',
              id: 'account1',
              metadata: {},
              options: {},
              methods: [],
              type: 'eip155:eoa',
              balance: '100',
              keyring: { type: 'type1' },
              label: 'Account 1',
            },
          ],
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
  });

  it('should create notifications', async () => {
    const { result } = renderHook(() => useCreateNotifications(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <MetamaskNotificationsProvider>
            {children}
          </MetamaskNotificationsProvider>
        </Provider>
      ),
    });

    act(() => {
      result.current.createNotifications();
    });

    expect(actions.createOnChainTriggers).toHaveBeenCalled();
  });

  it('should disable notifications and handle states', async () => {
    const { result } = renderHook(() => useDisableNotifications(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    act(() => {
      result.current.disableNotifications();
    });

    expect(actions.disableMetamaskNotifications).toHaveBeenCalled();
  });
});
