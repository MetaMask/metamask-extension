import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import * as actions from '../../store/actions';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  useSwitchFeatureAnnouncementsChange,
  useSwitchAccountNotifications,
  useSwitchAccountNotificationsChange,
} from './useSwitchNotifications';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../store/actions', () => ({
  setFeatureAnnouncementsEnabled: jest.fn(),
  checkAccountsPresence: jest.fn(),
  updateOnChainTriggersByAccount: jest.fn(),
  deleteOnChainTriggersByAccount: jest.fn(),
  showLoadingIndication: jest.fn(),
  hideLoadingIndication: jest.fn(),
  fetchAndUpdateMetamaskNotifications: jest.fn(),
}));

describe('useSwitchNotifications', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        isFeatureAnnouncementsEnabled: false,
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

    jest
      .spyOn(store, 'dispatch')
      .mockImplementation()
      .mockImplementation((action) => {
        if (typeof action === 'function') {
          return action(store.dispatch, store.getState);
        }
        return Promise.resolve();
      });

    jest.clearAllMocks();
  });

  it('should toggle feature announcements', async () => {
    const { result } = renderHook(() => useSwitchFeatureAnnouncementsChange(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <MetamaskNotificationsProvider>
            {children}
          </MetamaskNotificationsProvider>
        </Provider>
      ),
    });

    await act(async () => {
      await result.current.onChange(true);
    });

    expect(actions.setFeatureAnnouncementsEnabled).toHaveBeenCalledWith(true);
  });

  it('should check account presence', async () => {
    const { result } = renderHook(() => useSwitchAccountNotifications(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <MetamaskNotificationsProvider>
            {children}
          </MetamaskNotificationsProvider>
        </Provider>
      ),
    });

    await act(async () => {
      await result.current.switchAccountNotifications(['0x123']);
    });

    expect(actions.checkAccountsPresence).toHaveBeenCalledWith(['0x123']);
  });

  it('should handle account notification changes', async () => {
    const { result } = renderHook(() => useSwitchAccountNotificationsChange(), {
      wrapper: ({ children }) => (
        <Provider store={store}>
          <MetamaskNotificationsProvider>
            {children}
          </MetamaskNotificationsProvider>
        </Provider>
      ),
    });

    // Test enabling notifications
    await act(async () => {
      await result.current.onChange(['0x123'], true);
    });

    expect(actions.updateOnChainTriggersByAccount).toHaveBeenCalledWith([
      '0x123',
    ]);

    // Test disabling notifications
    await act(async () => {
      await result.current.onChange(['0x123'], false);
    });

    expect(actions.deleteOnChainTriggersByAccount).toHaveBeenCalledWith([
      '0x123',
    ]);
  });
});
