import { act, fireEvent, waitFor, screen } from '@testing-library/react';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { createMockImplementation } from '../helpers';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { getMockedNotificationsState } from './data/notification-state';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
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
      ...(mockRequests ?? {}),
    }),
  );
};

const selectors = {
  accountOptionsMenuButton: 'account-options-menu-button',
  notificationsMenuItem: 'notifications-menu-item',
  notificationsSettingsButton: 'notifications-settings-button',
  notificationsSettingsAllowToggleInput:
    'notifications-settings-allow-toggle-input',
  productAnnouncementsToggleInput: 'product-announcements-toggle-input',
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
          call[0] === 'trackMetaMetricsEvent' &&
          call[1]?.[0].category === expectedCategory,
      );

    expect(metametrics?.[0]).toBe('trackMetaMetricsEvent');

    const [metricsEvent] = metametrics?.[1] as unknown as [
      {
        event: string;
        category: string;
        properties: Record<string, unknown>;
      },
    ];

    expect(metricsEvent?.event).toBe(expectedEvent);
    expect(metricsEvent?.category).toBe(expectedCategory);
    expect(metricsEvent?.properties).toMatchObject(expectedProperties);
  });
};

describe('Notifications Toggle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.history.pushState({}, '', '/'); // return to homescreen
  });

  it('disabling notifications from settings', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedState,
          participateInMetaMetrics: true,
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
          settings_type: 'notifications',
          was_profile_syncing_on: true,
          old_value: true,
          new_value: false,
        },
      );
    });
  });

  it('enabling product announcements from settings', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedState,
          isBackupAndSyncEnabled: false,
          isNotificationServicesEnabled: true,
          isFeatureAnnouncementsEnabled: false,
          isMetamaskNotificationsFeatureSeen: true,
          dataCollectionForMarketing: false,
          participateInMetaMetrics: true,
        },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement(selectors.accountOptionsMenuButton);
      await waitForElement(selectors.notificationsMenuItem);
      await clickElement(selectors.notificationsMenuItem);
      await waitForElement(selectors.notificationsSettingsButton);
      await clickElement(selectors.notificationsSettingsButton);
      await waitForElement(selectors.productAnnouncementsToggleInput);
      await clickElement(selectors.productAnnouncementsToggleInput);

      await waitFor(() => {
        const enableFeatureNotifications =
          mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
            (call) => call[0] === 'setFeatureAnnouncementsEnabled',
          );

        const fetchAndUpdateMetamaskNotificationsCall =
          mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
            (call) => call[0] === 'fetchAndUpdateMetamaskNotifications',
          );

        expect(enableFeatureNotifications?.[0]).toBe(
          'setFeatureAnnouncementsEnabled',
        );
        expect(enableFeatureNotifications?.[1]).toEqual([true]);

        expect(fetchAndUpdateMetamaskNotificationsCall?.[0]).toBe(
          'fetchAndUpdateMetamaskNotifications',
        );
      });

      await verifyMetametricsEvent(
        MetaMetricsEventName.NotificationsSettingsUpdated,
        MetaMetricsEventCategory.NotificationSettings,
        {
          settings_type: 'product_announcements',
          old_value: false,
          new_value: true,
        },
      );
    });
  });
});
