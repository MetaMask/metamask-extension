import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { act, screen } from '@testing-library/react';
import { createMockImplementation } from '../helpers';

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

const notificationsState = {
  ...mockMetaMaskState,
  isProfileSyncingEnabled: true,
  isProfileSyncingUpdateLoading: false,
  isMetamaskNotificationsFeatureSeen: true,
  isNotificationServicesEnabled: true,
  isFeatureAnnouncementsEnabled: true,
  metamaskNotificationsList: [],
  metamaskNotificationsReadList: ['enhanced-signatures'],
  isUpdatingMetamaskNotifications: false,
  isFetchingMetamaskNotifications: false,
  isUpdatingMetamaskNotificationsAccount: [],
};

describe('Notifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  it('should show badge with correct unread notifications', async () => {
    const mockedRequests = {
      getState: notificationsState,
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async () => {
      await integrationTestRender({
        preloadedState: notificationsState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(
      screen.getByTestId('notifications-tag-counter__unread-dot'),
    ).toBeInTheDocument();
  });
});
