import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import {
  act,
  fireEvent,
  waitFor,
  screen,
  within,
} from '@testing-library/react';
import { createMockImplementation } from '../helpers';
import { getMockedNotificationsState } from './data/notification-state';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

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

const trackNotificationsActivatedMetaMetricsEvent = async (
  actionType: string,
  profileSyncEnabled: boolean,
) => {
  await waitFor(() => {
    const action =
      mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
        (call) =>
          call[0] === 'trackMetaMetricsEvent' &&
          call[1]?.[0].category ===
            MetaMetricsEventCategory.NotificationsActivationFlow &&
          call[1]?.[0].properties.action_type === actionType,
      );

    expect(action?.[0]).toBe('trackMetaMetricsEvent');

    const [event] = action?.[1] as unknown as [
      {
        event: string;
        category: string;
        properties: Record<string, unknown>;
      },
    ];

    expect(event?.event).toBe(MetaMetricsEventName.NotificationsActivated);
    expect(event?.category).toBe(
      MetaMetricsEventCategory.NotificationsActivationFlow,
    );
    expect(event?.properties).toMatchObject({
      action_type: actionType,
      is_profile_syncing_enabled: profileSyncEnabled,
    });
  });
};

describe('Notifications Activation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.history.pushState({}, '', '/'); // return to homescreen
  });

  const clickElement = async (testId: string) => {
    await act(async () => {
      fireEvent.click(screen.getByTestId(testId));
    });
  };

  const waitForElement = async (testId: string) => {
    await waitFor(() => {
      expect(screen.getByTestId(testId)).toBeInTheDocument();
    });
  };

  it('should successfully activate notification for the first time', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      await integrationTestRender({
        preloadedState: {
          ...mockedState,
          isProfileSyncingEnabled: false,
          isNotificationServicesEnabled: false,
          isFeatureAnnouncementsEnabled: false,
          isMetamaskNotificationsFeatureSeen: false,
        },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement('account-options-menu-button');
      await waitForElement('notifications-menu-item');
      await clickElement('notifications-menu-item');

      await waitFor(() => {
        expect(
          within(screen.getByRole('dialog')).getByText('Turn on'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText('Turn on'));
      });

      await waitFor(() => {
        const createOnChainTriggersCall =
          mockedBackgroundConnection.submitRequestToBackground.mock.calls?.find(
            (call) => call[0] === 'createOnChainTriggers',
          );

        expect(createOnChainTriggersCall?.[0]).toBe('createOnChainTriggers');
      });

      await trackNotificationsActivatedMetaMetricsEvent('started', false);
      await trackNotificationsActivatedMetaMetricsEvent('activated', true);
    });
  });

  it('should successfully send correct metrics when notifications modal is dismissed', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      const { container } = await integrationTestRender({
        preloadedState: {
          ...mockedState,
          isProfileSyncingEnabled: false,
          isNotificationServicesEnabled: false,
          isFeatureAnnouncementsEnabled: false,
          isMetamaskNotificationsFeatureSeen: false,
        },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement('account-options-menu-button');
      await waitForElement('notifications-menu-item');
      await clickElement('notifications-menu-item');

      await waitFor(() => {
        expect(
          within(screen.getByRole('dialog')).getByText('Turn on'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('button', {
            name: 'Close',
          }),
        );
      });

      await trackNotificationsActivatedMetaMetricsEvent('dismissed', false);
    });
  });

  it.only('should successfully send correct metrics when notifications modal is dismissed', async () => {
    const mockedState = getMockedNotificationsState();
    await act(async () => {
      const { container } = await integrationTestRender({
        preloadedState: {
          ...mockedState,
          isProfileSyncingEnabled: false,
          isNotificationServicesEnabled: false,
          isFeatureAnnouncementsEnabled: false,
          isMetamaskNotificationsFeatureSeen: false,
        },
        backgroundConnection: backgroundConnectionMocked,
      });

      await clickElement('account-options-menu-button');
      await waitForElement('notifications-menu-item');
      await clickElement('notifications-menu-item');

      await waitFor(() => {
        expect(
          within(screen.getByRole('dialog')).getByText('Turn on'),
        ).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('button', {
            name: 'Close',
          }),
        );
      });

      await trackNotificationsActivatedMetaMetricsEvent('dismissed', false);
    });
  });
});
