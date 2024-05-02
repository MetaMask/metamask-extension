import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import { TRIGGER_TYPES } from '../../../app/scripts/controllers/metamask-notifications/constants/notification-schema';
import * as actions from '../../store/actions';
import {
  useEnableNotifications,
  useDisableNotifications,
  useIsNotificationEnabled,
  useListNotifications,
  useMarkNotificationAsRead,
} from './useNotifications';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../store/actions', () => ({
  createOnChainTriggers: jest.fn(),
  deleteOnChainTriggersByAccount: jest.fn(),
  fetchAndUpdateMetamaskNotifications: jest.fn(),
  setMetamaskNotificationsEnabled: jest.fn(),
  setSnapNotificationsEnabled: jest.fn(),
  setFeatureAnnouncementsEnabled: jest.fn(),
  markMetamaskNotificationsAsRead: jest.fn(),
}));

describe('useNotifications', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        isMetamaskNotificationsEnabled: false,
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

  it('should enable notifications', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useEnableNotifications(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.enableNotifications();
    });

    await waitForNextUpdate();

    expect(actions.createOnChainTriggers).toHaveBeenCalled();
  });

  it('should disable notifications', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useDisableNotifications(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.disableNotifications();
    });

    await waitForNextUpdate();

    expect(actions.deleteOnChainTriggersByAccount).toHaveBeenCalled();
    expect(actions.setMetamaskNotificationsEnabled).toHaveBeenCalledWith(false);
    expect(actions.setSnapNotificationsEnabled).toHaveBeenCalledWith(false);
    expect(actions.setFeatureAnnouncementsEnabled).toHaveBeenCalledWith(false);
  });

  it('should check if notifications are enabled', () => {
    const { result } = renderHook(() => useIsNotificationEnabled(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.isNotificationEnabled).toBe(false);
  });

  it('should list notifications', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useListNotifications(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.listNotifications();
    });

    await waitForNextUpdate();

    expect(actions.fetchAndUpdateMetamaskNotifications).toHaveBeenCalled();
  });

  it('should mark notifications as read', async () => {
    const notifications = [
      {
        id: 'notif1',
        type: TRIGGER_TYPES.ERC20_SENT,
        isRead: true,
      },
      {
        id: 'notif2',
        type: TRIGGER_TYPES.ERC20_SENT,
        isRead: false,
      },
      {
        id: 'notif3',
        type: TRIGGER_TYPES.ERC20_SENT,
        isRead: false,
      },
    ];
    const { result, waitForNextUpdate } = renderHook(
      () => useMarkNotificationAsRead(notifications),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.markNotificationAsRead();
    });

    await waitForNextUpdate();

    expect(actions.markMetamaskNotificationsAsRead).toHaveBeenCalledWith(
      notifications,
    );
  });
});
