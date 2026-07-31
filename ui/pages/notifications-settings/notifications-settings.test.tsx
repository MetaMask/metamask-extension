import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NOTIFICATIONS_SETTINGS_ROUTE } from '../../helpers/constants/routes';
import { createMockNotificationPreferences } from '../../hooks/metamask-notifications/mocks';
import { useNotificationPreferences } from '../../hooks/metamask-notifications/useNotificationPreferences';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { NotificationsSettingsContent } from './notifications-settings';

jest.mock('./notifications-settings-allow-notifications', () => ({
  NotificationsSettingsAllowNotifications: () => (
    <div data-testid="notifications-settings-allow" />
  ),
}));

jest.mock('../../hooks/metamask-notifications/useSwitchNotifications', () => ({
  useAccountSettingsProps: jest.fn(),
}));

jest.mock(
  '../../hooks/metamask-notifications/useNotificationPreferences',
  () => ({
    useNotificationPreferences: jest.fn(),
  }),
);

const mockStore = configureMockStore([thunk]);

describe('NotificationsSettingsContent', () => {
  beforeEach(() => {
    jest.mocked(useAccountSettingsProps).mockReturnValue({
      data: {},
      initialLoading: false,
      error: null,
      accountsBeingUpdated: [],
      update: jest.fn(),
    });
    jest.mocked(useNotificationPreferences).mockReturnValue({
      preferences: createMockNotificationPreferences(),
      hasNotificationPreferences: true,
      isLoading: false,
      isUpdatingPreferences: false,
      error: null,
      refetchPreferences: jest.fn(),
      updatePreference: jest.fn(),
      updatePreferencesSection: jest.fn(),
    });
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
      screen.getByTestId('notifications-settings-allow'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('notifications-settings-per-types'),
    ).toBeInTheDocument();
  });
});
