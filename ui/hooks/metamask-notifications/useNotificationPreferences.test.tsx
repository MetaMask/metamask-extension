import React, { type ReactNode } from 'react';
import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import { useNotificationPreferences } from './useNotificationPreferences';
import { createMockNotificationPreferences } from './mocks';

const mockDispatch = jest.fn();
const mockGetNotificationPreferences = jest.fn(() => ({
  type: 'getNotificationPreferences',
}));
const mockPutNotificationPreferences = jest.fn((preferences) => ({
  type: 'putNotificationPreferences',
  preferences,
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../store/actions', () => ({
  getNotificationPreferences: () => mockGetNotificationPreferences(),
  putNotificationPreferences: (preferences: unknown) =>
    mockPutNotificationPreferences(preferences),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children?: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('persists the full preference object when updating one section', async () => {
    const preferences = createMockNotificationPreferences({
      socialAI: {
        pushNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        mutedTraderProfileIds: ['trader-1'],
      },
    });
    const expectedPreferences = {
      ...preferences,
      walletActivity: {
        ...preferences.walletActivity,
        pushNotificationsEnabled: false,
      },
    };

    mockDispatch.mockImplementation((action) => {
      if (action.type === 'getNotificationPreferences') {
        return Promise.resolve(preferences);
      }

      if (action.type === 'putNotificationPreferences') {
        return Promise.resolve();
      }

      return undefined;
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(preferences);
    });

    await act(async () => {
      await result.current.updatePreference(
        'walletActivity',
        'pushNotificationsEnabled',
        false,
      );
    });

    expect(mockPutNotificationPreferences).toHaveBeenCalledWith(
      expectedPreferences,
    );
    expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  it('chains rapid section updates using the optimistic cache', async () => {
    const preferences = createMockNotificationPreferences();
    const firstExpectedPreferences = {
      ...preferences,
      walletActivity: {
        ...preferences.walletActivity,
        pushNotificationsEnabled: false,
      },
    };
    const secondExpectedPreferences = {
      ...firstExpectedPreferences,
      walletActivity: {
        ...firstExpectedPreferences.walletActivity,
        inAppNotificationsEnabled: false,
      },
    };
    const putPayloads: NotificationPreferences[] = [];
    let resolveFirstPut: () => void = () => undefined;
    const firstPut = new Promise<void>((resolve) => {
      resolveFirstPut = resolve;
    });

    mockDispatch.mockImplementation((action) => {
      if (action.type === 'getNotificationPreferences') {
        return Promise.resolve(preferences);
      }

      if (action.type === 'putNotificationPreferences') {
        putPayloads.push(action.preferences);
        return putPayloads.length === 1 ? firstPut : Promise.resolve();
      }

      return undefined;
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(preferences);
    });

    let firstUpdate: Promise<void>;
    await act(async () => {
      firstUpdate = result.current.updatePreference(
        'walletActivity',
        'pushNotificationsEnabled',
        false,
      );
    });

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(
        firstExpectedPreferences,
      );
    });
    await waitFor(() => {
      expect(putPayloads).toStrictEqual([firstExpectedPreferences]);
    });

    let secondUpdate: Promise<void>;
    await act(async () => {
      secondUpdate = result.current.updatePreference(
        'walletActivity',
        'inAppNotificationsEnabled',
        false,
      );
    });

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(
        secondExpectedPreferences,
      );
    });
    expect(putPayloads).toStrictEqual([firstExpectedPreferences]);

    await act(async () => {
      resolveFirstPut();
      await firstUpdate;
      await secondUpdate;
    });

    expect(putPayloads).toStrictEqual([
      firstExpectedPreferences,
      secondExpectedPreferences,
    ]);
    expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  it('rolls back optimistic cache when persisting preferences fails', async () => {
    const preferences = createMockNotificationPreferences({
      walletActivity: {
        pushNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        accounts: [],
      },
    });
    const failedPreferences = {
      ...preferences,
      walletActivity: {
        ...preferences.walletActivity,
        pushNotificationsEnabled: false,
      },
    };
    const persistError = new Error('Failed to persist preferences');

    mockDispatch.mockImplementation((action) => {
      if (action.type === 'getNotificationPreferences') {
        return Promise.resolve(preferences);
      }

      if (action.type === 'putNotificationPreferences') {
        return Promise.reject(persistError);
      }

      return undefined;
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(preferences);
    });

    await act(async () => {
      await expect(
        result.current.updatePreference(
          'walletActivity',
          'pushNotificationsEnabled',
          false,
        ),
      ).rejects.toThrow('Failed to persist preferences');
    });

    expect(mockPutNotificationPreferences).toHaveBeenCalledWith(
      failedPreferences,
    );

    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(preferences);
    });
  });
});
