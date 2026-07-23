import { act, fireEvent, waitFor, screen } from '@testing-library/react';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { createMockImplementation } from '../helpers';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createMockNotificationPreferences } from '../../../ui/hooks/metamask-notifications/mocks';
import { getMockedNotificationsState } from './data/notification-state';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      getNotificationPreferences: createMockNotificationPreferences(),
      ...mockRequests,
    }),
  );
};

const selectors = {
  accountOptionsMenuButton: 'account-options-menu-button',
  notificationsMenuItem: 'notifications-menu-item',
  notificationsSettingsButton: 'notifications-settings-button',
  notificationsSettingsAllowToggleInput:
    'notifications-settings-allow-toggle-input',
  notificationsListDisabled: 'notifications-list-disabled-notifications',
};

const clickElement = async (testId: string) => {
  const element = await screen.findByTestId(testId);
  await act(async () => {
    fireEvent.click(element);
  });
};

const waitForElement = async (testId: string) => {
  await waitFor(() => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
};

const verifyNotificationsSettingsUpdatedEvent = async (
  expectedProperties: Record<string, unknown>,
) => {
  await waitFor(() => {
    const metametrics =
      mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
        (call) =>
          call[0] === 'trackAnalyticsEvent' &&
          call[1]?.[0]?.properties?.category ===
            MetaMetricsEventCategory.NotificationSettings,
      );

    expect(metametrics?.[0]).toBe('trackAnalyticsEvent');

    const [metricsEvent] = metametrics?.[1] as unknown as [
      {
        name: string;
        properties: Record<string, unknown>;
      },
    ];

    expect(metricsEvent?.name).toBe(
      MetaMetricsEventName.NotificationsSettingsUpdated,
    );
    expect(metricsEvent?.properties?.category).toBe(
      MetaMetricsEventCategory.NotificationSettings,
    );
    expect(metricsEvent?.properties).toMatchObject(expectedProperties);
  });
};

describe('Notifications Activation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.location.hash = '#/';
  });

  it('enables notifications from settings for the first time and sends correct metrics', async () => {
    const mockedState = getMockedNotificationsState();

    await integrationTestRender({
      preloadedState: {
        ...mockedState,
        isBackupAndSyncEnabled: false,
        isNotificationServicesEnabled: false,
        isFeatureAnnouncementsEnabled: false,
        isMetamaskNotificationsFeatureSeen: false,
        completedMetaMetricsOnboarding: true,
        optedIn: true,
        dataCollectionForMarketing: false,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickElement(selectors.accountOptionsMenuButton);
    await waitForElement(selectors.notificationsMenuItem);
    await clickElement(selectors.notificationsMenuItem);
    await waitForElement(selectors.notificationsListDisabled);
    await waitForElement(selectors.notificationsSettingsButton);
    await clickElement(selectors.notificationsSettingsButton);
    await waitForElement(selectors.notificationsSettingsAllowToggleInput);
    await clickElement(selectors.notificationsSettingsAllowToggleInput);

    await waitFor(() => {
      const enableMetamaskNotificationsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'enableMetamaskNotifications',
        );

      expect(enableMetamaskNotificationsCall?.[0]).toBe(
        'enableMetamaskNotifications',
      );
      expect(enableMetamaskNotificationsCall?.[1]).toStrictEqual([
        {
          hasMarketingConsent: false,
          productAnnouncementEnabled: false,
        },
      ]);
    });

    await verifyNotificationsSettingsUpdatedEvent({
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      settings_type: 'notifications',
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      was_profile_syncing_on: false,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      old_value: false,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      new_value: true,
    });
  });

  it('shows disabled notifications state when opening notifications for the first time', async () => {
    const mockedState = getMockedNotificationsState();

    await integrationTestRender({
      preloadedState: {
        ...mockedState,
        isBackupAndSyncEnabled: false,
        isNotificationServicesEnabled: false,
        isFeatureAnnouncementsEnabled: false,
        isMetamaskNotificationsFeatureSeen: false,
        completedMetaMetricsOnboarding: true,
        optedIn: true,
        dataCollectionForMarketing: false,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickElement(selectors.accountOptionsMenuButton);
    await waitForElement(selectors.notificationsMenuItem);
    await clickElement(selectors.notificationsMenuItem);
    await waitForElement(selectors.notificationsListDisabled);

    const enableMetamaskNotificationsCall =
      mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
        (call) => call[0] === 'enableMetamaskNotifications',
      );

    expect(enableMetamaskNotificationsCall).toBeUndefined();
  });
});
