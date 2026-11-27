import React, { type ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NotificationPreferences } from '@metamask/authenticated-user-storage';
import { useNotificationPreferences } from './useNotificationPreferences';
import { createMockNotificationPreferences } from './mocks';

const mockDispatch = jest.fn();
const mockGetNotificationPreferences = jest.fn(() => ({
  type: 'getNotificationPreferences',
}));
const mockUpdateNotificationPreferences = jest.fn((update) => ({
  type: 'updateNotificationPreferences',
  update,
}));

jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

jest.mock('../../store/actions', () => ({
  getNotificationPreferences: () => mockGetNotificationPreferences(),
  updateNotificationPreferences: (update: unknown) =>
    mockUpdateNotificationPreferences(update),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children?: ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  return { Wrapper, queryClient };
};

const createDeferred = <Value,>() => {
  let resolve: (value: Value) => void = () => undefined;
  const promise = new Promise<Value>((resolveFn) => {
    resolve = resolveFn;
  });
  return { promise, resolve };
};

/**
 * Renders the hook with background responses: reads return `read()`, and
 * updates are handled by `update`.
 *
 * @param options - Background responses.
 * @param options.read - Returns the stored preferences.
 * @param options.update - Handles an update and returns the saved preferences.
 * @returns The rendered hook.
 */
const renderPreferencesHook = async ({
  read,
  update,
}: {
  read: () => Promise<NotificationPreferences | null>;
  update?: (
    patch: Record<string, unknown>,
  ) => Promise<NotificationPreferences | undefined>;
}) => {
  mockDispatch.mockImplementation((action) => {
    if (action.type === 'getNotificationPreferences') {
      return read();
    }
    if (action.type === 'updateNotificationPreferences') {
      return update?.(action.update);
    }
    return undefined;
  });
  const { Wrapper } = createWrapper();
  const rendered = renderHook(() => useNotificationPreferences(), {
    wrapper: Wrapper,
  });
  await waitFor(() => {
    expect(rendered.result.current.preferences).toBeDefined();
  });
  return rendered;
};

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends only the changed field and shows what was saved', async () => {
    const preferences = createMockNotificationPreferences();
    const saved = createMockNotificationPreferences({
      perps: {
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      },
    });
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: async () => saved,
    });

    await act(async () => {
      await result.current.updatePreference(
        'perps',
        'pushNotificationsEnabled',
        false,
      );
    });

    expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
      perps: { pushNotificationsEnabled: false },
    });
    expect(result.current.preferences).toStrictEqual(saved);
    expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  it('shows a change straight away, before it is saved', async () => {
    const preferences = createMockNotificationPreferences();
    const save = createDeferred<NotificationPreferences>();
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: () => save.promise,
    });

    let saving: Promise<void> = Promise.resolve();
    act(() => {
      saving = result.current.updatePreference(
        'priceAlerts',
        'inAppNotificationsEnabled',
        false,
      );
    });

    await waitFor(() => {
      expect(
        result.current.preferences?.priceAlerts.inAppNotificationsEnabled,
      ).toBe(false);
    });
    expect(result.current.isUpdatingPreferences).toBe(true);

    await act(async () => {
      save.resolve(
        createMockNotificationPreferences({
          priceAlerts: {
            pushNotificationsEnabled: true,
            inAppNotificationsEnabled: false,
          },
        }),
      );
      await saving;
    });
    expect(result.current.isUpdatingPreferences).toBe(false);
  });

  it('keeps every change from quick toggles while earlier ones are saving', async () => {
    const preferences = createMockNotificationPreferences();
    const firstSave = createDeferred<NotificationPreferences>();
    const afterFirst = createMockNotificationPreferences({
      perps: {
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      },
    });
    const afterBoth = createMockNotificationPreferences({
      perps: {
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      },
      socialAI: {
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
        mutedTraderProfileIds: [],
      },
    });
    const saves = [firstSave.promise, Promise.resolve(afterBoth)];
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: async () => saves.shift(),
    });

    let first: Promise<void> = Promise.resolve();
    let second: Promise<void> = Promise.resolve();
    act(() => {
      first = result.current.updatePreference(
        'perps',
        'pushNotificationsEnabled',
        false,
      );
    });
    act(() => {
      second = result.current.updatePreference(
        'socialAI',
        'pushNotificationsEnabled',
        false,
      );
    });
    await act(async () => {
      await second;
    });

    // The first save is still pending, so the second change stays shown.
    await waitFor(() => {
      expect(
        result.current.preferences?.socialAI.pushNotificationsEnabled,
      ).toBe(false);
    });
    await act(async () => {
      firstSave.resolve(afterFirst);
      await first;
    });

    expect(mockUpdateNotificationPreferences).toHaveBeenNthCalledWith(1, {
      perps: { pushNotificationsEnabled: false },
    });
    expect(mockUpdateNotificationPreferences).toHaveBeenNthCalledWith(2, {
      socialAI: { pushNotificationsEnabled: false },
    });
    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(afterBoth);
    });
  });

  it('re-reads preferences when an update fails', async () => {
    const preferences = createMockNotificationPreferences();
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: async () => {
        throw new Error('AUS unavailable');
      },
    });

    await act(async () => {
      await expect(
        result.current.updatePreference(
          'perps',
          'pushNotificationsEnabled',
          false,
        ),
      ).rejects.toThrow('AUS unavailable');
    });

    await waitFor(() => {
      expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(result.current.preferences).toStrictEqual(preferences);
    });
  });

  it('does nothing when the section is unchanged', async () => {
    const preferences = createMockNotificationPreferences();
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
    });

    await act(async () => {
      await result.current.updatePreference(
        'perps',
        'pushNotificationsEnabled',
        true,
      );
    });

    expect(mockUpdateNotificationPreferences).not.toHaveBeenCalled();
  });

  it('sends a replaced array whole', async () => {
    const preferences = createMockNotificationPreferences({
      socialAI: {
        pushNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        mutedTraderProfileIds: ['trader-1'],
      },
    });
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: async () => preferences,
    });

    await act(async () => {
      await result.current.updatePreferencesSection('socialAI', (current) => ({
        ...current,
        mutedTraderProfileIds: [...current.mutedTraderProfileIds, 'trader-2'],
      }));
    });

    expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
      socialAI: { mutedTraderProfileIds: ['trader-1', 'trader-2'] },
    });
  });

  it('shows marketing channels off after markMarketingChannelsOff, without writing them', async () => {
    const preferences = createMockNotificationPreferences();
    const { result } = await renderPreferencesHook({
      read: async () => preferences,
      update: async () => undefined,
    });

    act(() => {
      result.current.markMarketingChannelsOff();
    });
    await waitFor(() => {
      expect(result.current.preferences?.marketing).toStrictEqual({
        pushNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
      });
    });

    await act(async () => {
      await result.current.updatePreference(
        'perps',
        'pushNotificationsEnabled',
        false,
      );
    });

    expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith({
      perps: { pushNotificationsEnabled: false },
    });
  });

  it('resolves ensurePreferences from the in-flight read without refetching', async () => {
    const preferences = createMockNotificationPreferences();
    let resolveRead: (value: NotificationPreferences) => void = () => undefined;
    mockDispatch.mockImplementation((action) => {
      if (action.type === 'getNotificationPreferences') {
        return new Promise((resolve) => {
          resolveRead = resolve;
        });
      }
      return undefined;
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: Wrapper,
    });

    const ensured = result.current.ensurePreferences();
    resolveRead(preferences);

    await expect(ensured).resolves.toStrictEqual(preferences);
    await expect(result.current.ensurePreferences()).resolves.toStrictEqual(
      preferences,
    );
    expect(mockGetNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  it('does not read preferences when disabled', async () => {
    mockDispatch.mockResolvedValue(createMockNotificationPreferences());

    const { Wrapper } = createWrapper();
    const { result } = renderHook(
      () => useNotificationPreferences({ enabled: false }),
      { wrapper: Wrapper },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.preferences).toBeUndefined();
    expect(mockGetNotificationPreferences).not.toHaveBeenCalled();
  });
});
