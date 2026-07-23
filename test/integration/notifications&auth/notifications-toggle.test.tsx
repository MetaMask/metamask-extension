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
  marketingSection: 'notifications-settings-section-marketing',
  marketingInAppToggleInput: 'marketing-in-app-notifications-toggle-input',
};

const clickElement = async (testId: string) => {
  await act(async () => {
    fireEvent.click(await screen.findByTestId(testId));
  });
};

const waitForElement = async (testId: string) => {
  expect(await screen.findByTestId(testId)).toBeInTheDocument();
};

const verifyMetametricsEvent = async (
  expectedEvent: string,
  expectedCategory: string,
  expectedProperties: Record<string, unknown>,
) => {
  await waitFor(() => {
    const metametrics =
      mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
        (call) =>
          call[0] === 'trackAnalyticsEvent' &&
          call[1]?.[0]?.properties?.category === expectedCategory,
      );

    expect(metametrics?.[0]).toBe('trackAnalyticsEvent');

    const [metricsEvent] = metametrics?.[1] as unknown as [
      {
        name: string;
        properties: Record<string, unknown>;
      },
    ];

    expect(metricsEvent?.name).toBe(expectedEvent);
    expect(metricsEvent?.properties?.category).toBe(expectedCategory);
    expect(metricsEvent?.properties).toMatchObject(expectedProperties);
  });
};

describe('Notifications Toggle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.location.hash = '#/'; // return to homescreen
  });

  it('disabling notifications from settings', async () => {
    const mockedState = getMockedNotificationsState();
    await integrationTestRender({
      preloadedState: {
        ...mockedState,
        analyticsId: 'test-metametrics-id',
        completedMetaMetricsOnboarding: true,
        optedIn: true,
        dataCollectionForMarketing: false,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickElement(selectors.accountOptionsMenuButton);
    await waitForElement(selectors.notificationsMenuItem);
    await clickElement(selectors.notificationsMenuItem);
    await waitForElement(selectors.notificationsSettingsButton);
    await clickElement(selectors.notificationsSettingsButton);
    await waitForElement(selectors.notificationsSettingsAllowToggleInput);
    await clickElement(selectors.notificationsSettingsAllowToggleInput);

    await waitFor(() => {
      const disableNotificationsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'disableMetamaskNotifications',
        );

      const fetchAndUpdateMetamaskNotificationsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'fetchAndUpdateMetamaskNotifications',
        );

      expect(disableNotificationsCall?.[0]).toBe(
        'disableMetamaskNotifications',
      );

      expect(fetchAndUpdateMetamaskNotificationsCall?.[0]).toBe(
        'fetchAndUpdateMetamaskNotifications',
      );
    });

    await verifyMetametricsEvent(
      MetaMetricsEventName.NotificationsSettingsUpdated,
      MetaMetricsEventCategory.NotificationSettings,
      {
        /* eslint-disable @typescript-eslint/naming-convention */
        settings_type: 'master',
        notification_channel: 'all',
        enabled: false,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    );
  });

  it('enables marketing in-app notifications from settings', async () => {
    const mockedState = getMockedNotificationsState();
    setupSubmitRequestToBackgroundMocks({
      getNotificationPreferences: createMockNotificationPreferences({
        marketing: {
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: false,
        },
      }),
    });

    await integrationTestRender({
      preloadedState: {
        ...mockedState,
        isBackupAndSyncEnabled: false,
        isNotificationServicesEnabled: true,
        isFeatureAnnouncementsEnabled: false,
        isMetamaskNotificationsFeatureSeen: true,
        dataCollectionForMarketing: false,
        completedMetaMetricsOnboarding: true,
        optedIn: true,
      },
      backgroundConnection: backgroundConnectionMocked,
    });

    await clickElement(selectors.accountOptionsMenuButton);
    await waitForElement(selectors.notificationsMenuItem);
    await clickElement(selectors.notificationsMenuItem);
    await waitForElement(selectors.notificationsSettingsButton);
    await clickElement(selectors.notificationsSettingsButton);
    await waitForElement(selectors.marketingSection);
    await clickElement(selectors.marketingSection);
    await waitForElement(selectors.marketingInAppToggleInput);
    await clickElement(selectors.marketingInAppToggleInput);

    await waitFor(() => {
      const putNotificationPreferencesCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'putNotificationPreferences',
        );

      const fetchAndUpdateMetamaskNotificationsCall =
        mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
          (call) => call[0] === 'fetchAndUpdateMetamaskNotifications',
        );

      expect(putNotificationPreferencesCall?.[0]).toBe(
        'putNotificationPreferences',
      );
      expect(putNotificationPreferencesCall?.[1]?.[0]).toMatchObject({
        marketing: {
          pushNotificationsEnabled: false,
          inAppNotificationsEnabled: true,
        },
      });
      expect(putNotificationPreferencesCall?.[1]?.[1]).toBe('extension');

      expect(fetchAndUpdateMetamaskNotificationsCall?.[0]).toBe(
        'fetchAndUpdateMetamaskNotifications',
      );
    });

    await verifyMetametricsEvent(
      MetaMetricsEventName.NotificationsSettingsUpdated,
      MetaMetricsEventCategory.NotificationSettings,
      {
        /* eslint-disable @typescript-eslint/naming-convention */
        settings_type: 'marketing',
        notification_channel: 'in_app',
        enabled: true,
        /* eslint-enable @typescript-eslint/naming-convention */
      },
    );
  });
});
