import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import {
  NOTIFICATIONS_SETTINGS_ROUTE,
  NOTIFICATIONS_SETTINGS_SECTION_ROUTES,
  NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
  type NotificationsSettingsSectionType,
} from '../../../shared/lib/notifications-settings';
import { createMockNotificationPreferences } from '../../hooks/metamask-notifications/mocks';
import { useNotificationPreferences } from '../../hooks/metamask-notifications/useNotificationPreferences';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { useEnableNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { getIsPerpsIncludedInBuild } from '../../../shared/lib/environment';

// eslint-disable-next-line import-x/no-restricted-paths -- Test the section redirect and main page together.
import { NotificationSectionSubPage } from '../settings/notifications-tab/notification-section-sub-page';
import { NotificationsSettingsContent } from './notifications-settings';

const mockEnableNotifications = jest.fn();
const mockRefetchPreferences = jest.fn();
const mockListNotifications = jest.fn();

// Keep the real notification toggle handler, replacing only the legacy toggle UI.
jest.mock('../../components/ui/toggle-button', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({
    value,
    onToggle,
    disabled,
    dataTestId,
  }: {
    value: boolean;
    onToggle: () => void;
    disabled: boolean;
    dataTestId: string;
  }) => (
    <input
      type="checkbox"
      checked={value}
      onChange={onToggle}
      disabled={disabled}
      data-testid={dataTestId}
    />
  ),
}));

jest.mock('../../hooks/metamask-notifications/useNotifications', () => ({
  ...jest.requireActual('../../hooks/metamask-notifications/useNotifications'),
  useEnableNotifications: jest.fn(),
  useDisableNotifications: () => ({
    disableNotifications: jest.fn(),
    error: null,
  }),
}));

jest.mock(
  '../../contexts/metamask-notifications/metamask-notifications',
  () => ({
    useMetamaskNotificationsContext: () => ({
      listNotifications: mockListNotifications,
    }),
  }),
);

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({ trackEvent: jest.fn(), createEventBuilder }),
  };
});

jest.mock('../../hooks/metamask-notifications/useSwitchNotifications', () => ({
  useAccountSettingsProps: jest.fn(),
  useSwitchAccountNotificationsChange: () => ({
    onChange: jest.fn(),
    error: null,
  }),
}));

jest.mock(
  '../../hooks/metamask-notifications/useNotificationPreferences',
  () => ({
    useNotificationPreferences: jest.fn(),
  }),
);

const mockStore = configureMockStore([thunk]);

const createPreferencesResult = (): ReturnType<
  typeof useNotificationPreferences
> => ({
  preferences: createMockNotificationPreferences(),
  hasNotificationPreferences: true,
  isLoading: false,
  isUpdatingPreferences: false,
  error: null,
  refetchPreferences: mockRefetchPreferences,
  updatePreference: jest.fn(),
  updatePreferencesSection: jest.fn(),
});

const NotificationSettingsFlow = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="notification-settings-location">
        {pathname}
        {search}
      </output>
      <button onClick={() => navigate(NOTIFICATIONS_SETTINGS_ROUTE)}>
        Back to notifications
      </button>
      <button onClick={() => navigate('/other-page')}>Leave settings</button>
      <Routes>
        <Route
          path={NOTIFICATIONS_SETTINGS_ROUTE}
          element={<NotificationsSettingsContent />}
        />
        {Object.entries(NOTIFICATIONS_SETTINGS_SECTION_ROUTES).map(
          ([sectionType, path]) => (
            <Route
              key={sectionType}
              path={path}
              element={
                <NotificationSectionSubPage
                  sectionType={sectionType as NotificationsSettingsSectionType}
                />
              }
            />
          ),
        )}
        <Route path="*" element={<div>Other page</div>} />
      </Routes>
    </>
  );
};

describe('NotificationsSettingsContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnableNotifications.mockReset();
    mockRefetchPreferences.mockReset();
    jest.mocked(useEnableNotifications).mockReturnValue({
      enableNotifications: mockEnableNotifications,
      error: null,
    });
    jest.mocked(useAccountSettingsProps).mockReturnValue({
      data: {},
      initialLoading: false,
      error: null,
      accountsBeingUpdated: [],
      update: jest.fn(),
    });
    jest
      .mocked(useNotificationPreferences)
      .mockReturnValue(createPreferencesResult());
  });

  it('renders the notifications settings list page', () => {
    const store = mockStore({
      metamask: {
        isNotificationServicesEnabled: true,
        isUpdatingMetamaskNotifications: false,
        accountTree: { selectedAccountGroup: '', wallets: {} },
        internalAccounts: { selectedAccount: '', accounts: {} },
      },
    });

    renderWithProvider(
      <NotificationsSettingsContent />,
      store,
      NOTIFICATIONS_SETTINGS_ROUTE,
    );

    expect(
      screen.getByTestId('notifications-settings-allow-toggle-input'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('notifications-settings-per-types'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.notificationsSettingsAgenticCliTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('notifications-settings-section-walletActivity'),
    ).not.toHaveTextContent(
      `${messages.notificationsSettingsStatusPush.message}, ${messages.notificationsSettingsStatusInApp.message}`,
    );
    expect(
      screen.getByTestId('notifications-settings-section-marketing'),
    ).toHaveTextContent(
      `${messages.notificationsSettingsStatusPush.message}, ${messages.notificationsSettingsStatusInApp.message}`,
    );
  });

  describe('deferred section navigation', () => {
    const createStore = (enabled = false) => {
      let state = {
        metamask: {
          isNotificationServicesEnabled: enabled,
          isUpdatingMetamaskNotifications: false,
          accountTree: { selectedAccountGroup: '', wallets: {} },
          internalAccounts: { selectedAccount: '', accounts: {} },
        },
      };
      const store = mockStore(() => state);
      const enable = () => {
        state = {
          metamask: { ...state.metamask, isNotificationServicesEnabled: true },
        };
        store.dispatch({ type: 'NOTIFICATIONS_ENABLED' });
      };
      return { store, enable };
    };

    it('resumes the requested section after the main toggle enables notifications', async () => {
      const { store, enable } = createStore();
      mockEnableNotifications.mockImplementation(async () => enable());
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );

      expect(
        screen.getByTestId('notification-settings-location'),
      ).toHaveTextContent(
        `${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`,
      );
      expect(
        screen.queryByTestId(
          'notifications-settings-section-content-walletActivity',
        ),
      ).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByTestId('notifications-settings-allow-toggle-input'),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId(
            'notifications-settings-section-content-walletActivity',
          ),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE);

      fireEvent.click(screen.getByText('Back to notifications'));
      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(NOTIFICATIONS_SETTINGS_ROUTE);
      expect(
        screen.getByTestId('notifications-settings-per-types'),
      ).toBeInTheDocument();
    });

    it('waits for section preferences before resuming navigation', async () => {
      const { store, enable } = createStore();
      mockEnableNotifications.mockImplementation(async () => enable());
      let finishRefresh: () => void = () => undefined;
      mockRefetchPreferences.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishRefresh = resolve;
        }),
      );
      const preferencesMock = jest.mocked(useNotificationPreferences);
      const initialResult = createPreferencesResult();
      preferencesMock.mockReturnValue({
        ...initialResult,
        preferences: undefined,
        hasNotificationPreferences: false,
        isLoading: true,
      });
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
      fireEvent.click(
        screen.getByTestId('notifications-settings-allow-toggle-input'),
      );
      await waitFor(() => {
        expect(mockRefetchPreferences).toHaveBeenCalled();
      });

      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(`${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`);

      preferencesMock.mockReturnValue(initialResult);
      await act(async () => finishRefresh());
      await waitFor(() => {
        expect(
          screen.getByTestId(
            'notifications-settings-section-content-walletActivity',
          ),
        ).toBeInTheDocument();
      });
    });

    it('waits for the enable operation and preference refresh to finish', async () => {
      const { store, enable } = createStore();
      mockEnableNotifications.mockImplementation(async () => enable());
      let finishRefresh: () => void = () => undefined;
      mockRefetchPreferences.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          finishRefresh = resolve;
        }),
      );
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
      fireEvent.click(
        screen.getByTestId('notifications-settings-allow-toggle-input'),
      );

      await waitFor(() => {
        expect(mockRefetchPreferences).toHaveBeenCalled();
      });
      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(`${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`);

      await act(async () => finishRefresh());
      await waitFor(() => {
        expect(
          screen.getByTestId(
            'notifications-settings-section-content-walletActivity',
          ),
        ).toBeInTheDocument();
      });
    });

    it('keeps the pending section when enabling does not enable notifications', async () => {
      const { store } = createStore();
      mockEnableNotifications.mockResolvedValueOnce(undefined);
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
      fireEvent.click(
        screen.getByTestId('notifications-settings-allow-toggle-input'),
      );
      await waitFor(() => {
        expect(mockRefetchPreferences).toHaveBeenCalled();
      });

      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(`${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`);
      expect(
        screen.queryByTestId(
          'notifications-settings-section-content-walletActivity',
        ),
      ).not.toBeInTheDocument();
    });

    it('returns to the main page when the requested section has no preferences', () => {
      const { store } = createStore(true);
      const preferences = createMockNotificationPreferences();
      Reflect.deleteProperty(preferences, 'agenticCli');
      jest.mocked(useNotificationPreferences).mockReturnValue({
        ...createPreferencesResult(),
        preferences,
      });
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_SECTION_ROUTES.agenticCli,
      );

      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(NOTIFICATIONS_SETTINGS_ROUTE);
    });

    it('does not resume a pending section when preferences fail to load', () => {
      const { store } = createStore(true);
      jest.mocked(useNotificationPreferences).mockReturnValue({
        ...createPreferencesResult(),
        error: new Error('Unable to load preferences'),
      });
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        `${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`,
      );

      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe(`${NOTIFICATIONS_SETTINGS_ROUTE}?section=wallet-activity`);
      expect(
        screen.queryByTestId(
          'notifications-settings-section-content-walletActivity',
        ),
      ).not.toBeInTheDocument();
    });

    const otherSections: NotificationsSettingsSectionType[] = [
      'marketing',
      'agenticCli',
      ...(getIsPerpsIncludedInBuild() ? ['perps' as const] : []),
    ];
    for (const sectionType of otherSections) {
      it(`resumes the ${sectionType} section after enabling`, async () => {
        const { store, enable } = createStore();
        mockEnableNotifications.mockImplementation(async () => enable());
        const path = NOTIFICATIONS_SETTINGS_SECTION_ROUTES[sectionType];
        renderWithProvider(<NotificationSettingsFlow />, store, path);
        fireEvent.click(
          screen.getByTestId('notifications-settings-allow-toggle-input'),
        );

        await waitFor(() => {
          expect(
            screen.getByTestId(
              `notifications-settings-section-content-${sectionType}`,
            ),
          ).toBeInTheDocument();
        });
        expect(
          screen.getByTestId('notification-settings-location').textContent,
        ).toBe(path);
      });
    }

    it('does not resume navigation after leaving the notifications page', async () => {
      const { store, enable } = createStore();
      let finishEnable: () => void = () => undefined;
      mockEnableNotifications.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            finishEnable = () => {
              enable();
              resolve();
            };
          }),
      );
      renderWithProvider(
        <NotificationSettingsFlow />,
        store,
        NOTIFICATIONS_SETTINGS_WALLET_ACTIVITY_ROUTE,
      );
      fireEvent.click(
        screen.getByTestId('notifications-settings-allow-toggle-input'),
      );
      fireEvent.click(screen.getByText('Leave settings'));

      await act(async () => finishEnable());
      expect(
        screen.getByTestId('notification-settings-location').textContent,
      ).toBe('/other-page');
    });

    for (const search of [
      '',
      '?section=price-alerts',
      '?section=not-a-section',
    ]) {
      it(`stays on the main page after enabling without a supported pending section (${search})`, async () => {
        const { store, enable } = createStore();
        mockEnableNotifications.mockImplementation(async () => enable());
        renderWithProvider(
          <NotificationSettingsFlow />,
          store,
          `${NOTIFICATIONS_SETTINGS_ROUTE}${search}`,
        );
        fireEvent.click(
          screen.getByTestId('notifications-settings-allow-toggle-input'),
        );
        await waitFor(() => {
          expect(
            screen.getByTestId('notifications-settings-per-types'),
          ).toBeInTheDocument();
        });
        expect(
          screen.getByTestId('notification-settings-location').textContent,
        ).toBe(`${NOTIFICATIONS_SETTINGS_ROUTE}${search}`);
      });
    }
  });
});
