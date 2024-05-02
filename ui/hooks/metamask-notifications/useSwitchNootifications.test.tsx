import React from 'react';
import { Provider } from 'react-redux';
import { renderHook, act } from '@testing-library/react-hooks';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import type { Store } from 'redux';
import * as actions from '../../store/actions';
import {
  useSwitchSnapNotifications,
  useSwitchSnapNotificationsChange,
  useSwitchFeatureAnnouncements,
  useSwitchFeatureAnnouncementsChange,
  useSwitchAccountNotifications,
  useSwitchAccountNotificationsChange,
} from './useSwitchNotifications';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../../store/actions', () => ({
  setSnapNotificationsEnabled: jest.fn(),
  setFeatureAnnouncementsEnabled: jest.fn(),
  checkAccountsPresence: jest.fn(),
  updateOnChainTriggersByAccount: jest.fn(),
  deleteOnChainTriggersByAccount: jest.fn(),
}));

describe('useSwitchNotifications', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        isSnapNotificationsEnabled: false,
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

    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return Promise.resolve();
    });

    jest.clearAllMocks();
  });

  it('should toggle snap notifications', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useSwitchSnapNotificationsChange(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.onChange(true);
    });

    await waitForNextUpdate();

    expect(actions.setSnapNotificationsEnabled).toHaveBeenCalledWith(true);
  });

  it('should toggle feature announcements', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useSwitchFeatureAnnouncementsChange(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.onChange(true);
    });

    await waitForNextUpdate();

    expect(actions.setFeatureAnnouncementsEnabled).toHaveBeenCalledWith(true);
  });

  it('should get current state of snap notifications', () => {
    const { result } = renderHook(() => useSwitchSnapNotifications(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.data).toBe(false);
  });

  it('should get current state of feature announcements', () => {
    const { result } = renderHook(() => useSwitchFeatureAnnouncements(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    expect(result.current.data).toBe(false);
  });

  it('should check account presence', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useSwitchAccountNotifications(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      result.current.data(['0x123']);
    });

    await waitForNextUpdate();

    expect(actions.checkAccountsPresence).toHaveBeenCalledWith(['0x123']);
  });

  it('should handle account notification changes', async () => {
    const { result, waitForNextUpdate } = renderHook(
      () => useSwitchAccountNotificationsChange(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    // Test enabling notifications
    act(() => {
      result.current.onChange('0x123', true);
    });

    await waitForNextUpdate();

    expect(actions.updateOnChainTriggersByAccount).toHaveBeenCalledWith([
      '0x123',
    ]);

    // Test disabling notifications
    act(() => {
      result.current.onChange('0x123', false);
    });

    await waitForNextUpdate();

    expect(actions.deleteOnChainTriggersByAccount).toHaveBeenCalledWith([
      '0x123',
    ]);
  });
});
