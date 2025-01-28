import {
  act,
  fireEvent,
  waitFor,
  within,
  screen,
} from '@testing-library/react';
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

describe('Notifications Toggle', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.history.pushState({}, '', '/'); // return to homescreen
  });

  const clickElement = async (testId: string) => {
    await act(async () => {
      fireEvent.click(await screen.findByTestId(testId));
    });
  };

  const waitForElement = async (testId: string) => {
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  };

  it('disabling notifications from settings', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      await integrationTestRender({
        preloadedState: { ...mockedState },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement('account-options-menu-button');
      await waitForElement('notifications-menu-item');
      await clickElement('notifications-menu-item');
      await waitForElement('notifications-settings-button');
      await clickElement('notifications-settings-button');
      await waitForElement('notifications-settings-allow-notifications');

      const toggleSection = await screen.findByTestId(
        'notifications-settings-allow-notifications',
      );

      await act(async () => {
        fireEvent.click(await within(toggleSection).findByRole('checkbox'));
      });

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

      await waitFor(() => {
        const metametrics =
          mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
            (call) =>
              call[0] === 'trackMetaMetricsEvent' &&
              call[1]?.[0].category ===
                MetaMetricsEventCategory.NotificationSettings,
          );

        expect(metametrics?.[0]).toBe('trackMetaMetricsEvent');

        const [metricsEvent] = metametrics?.[1] as unknown as [
          {
            event: string;
            category: string;
            properties: Record<string, unknown>;
          },
        ];

        expect(metricsEvent?.event).toBe(
          MetaMetricsEventName.NotificationsSettingsUpdated,
        );

        expect(metricsEvent?.category).toBe(
          MetaMetricsEventCategory.NotificationSettings,
        );

        expect(metricsEvent?.properties).toMatchObject({
          settings_type: 'notifications',
          was_profile_syncing_on: true,
          old_value: true,
          new_value: false,
        });
      });
    });
  });

  it('enabling product announcments from settings', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedState,
          isProfileSyncingEnabled: false,
          isNotificationServicesEnabled: true,
          isFeatureAnnouncementsEnabled: false,
          isMetamaskNotificationsFeatureSeen: true,
        },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement('account-options-menu-button');
      await waitForElement('notifications-menu-item');
      await clickElement('notifications-menu-item');
      await waitForElement('notifications-settings-button');
      await clickElement('notifications-settings-button');
      await waitForElement('notifications-settings-allow-notifications');

      const allToggles = await screen.findAllByTestId('test-toggle');

      await act(async () => {
        fireEvent.click(allToggles[1]);
      });

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

      await waitFor(() => {
        const metametrics =
          mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
            (call) =>
              call[0] === 'trackMetaMetricsEvent' &&
              call[1]?.[0].category ===
                MetaMetricsEventCategory.NotificationSettings,
          );

        expect(metametrics?.[0]).toBe('trackMetaMetricsEvent');

        const [metricsEvent] = metametrics?.[1] as unknown as [
          {
            event: string;
            category: string;
            properties: Record<string, unknown>;
          },
        ];

        expect(metricsEvent?.event).toBe(
          MetaMetricsEventName.NotificationsSettingsUpdated,
        );

        expect(metricsEvent?.category).toBe(
          MetaMetricsEventCategory.NotificationSettings,
        );

        expect(metricsEvent?.properties).toMatchObject({
          settings_type: 'product_announcements',
          old_value: false,
          new_value: true,
        });
      });
    });
  });
});
