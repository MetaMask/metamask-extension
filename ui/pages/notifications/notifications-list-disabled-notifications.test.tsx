import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { NotificationsListDisabledNotifications } from './notifications-list-disabled-notifications';

const mockEnableNotifications = jest.fn();
const mockListNotifications = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock('../../hooks/metamask-notifications/useNotifications', () => ({
  ...jest.requireActual('../../hooks/metamask-notifications/useNotifications'),
  useEnableNotifications: () => ({
    enableNotifications: mockEnableNotifications,
    error: null,
    isLoading: false,
  }),
  useListNotifications: () => ({
    listNotifications: mockListNotifications,
    notificationsData: [],
    isLoading: false,
    error: null,
  }),
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({
  metamask: {
    isMetamaskNotificationsEnabled: false,
    isUpdatingMetamaskNotifications: false,
  },
});

const renderComponent = () =>
  render(
    <Provider store={store}>
      <MetaMetricsContext.Provider
        value={{
          trackEvent: mockTrackEvent,
          createEventBuilder: jest.fn(),
        }}
      >
        <MetamaskNotificationsProvider>
          <NotificationsListDisabledNotifications />
        </MetamaskNotificationsProvider>
      </MetaMetricsContext.Provider>
    </Provider>,
  );

describe('NotificationsListDisabledNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnableNotifications.mockResolvedValue(undefined);
  });

  it('renders correctly', () => {
    renderComponent();

    expect(
      screen.getByTestId('notifications-list-disabled-notifications'),
    ).toBeInTheDocument();
  });

  it('enables notifications and tracks settings update when turn on is clicked', async () => {
    renderComponent();

    fireEvent.click(
      screen.getByTestId('notifications-list-turn-on-notifications-button'),
    );

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.NotificationSettings,
        event: MetaMetricsEventName.NotificationsSettingsUpdated,
        properties: {
          /* eslint-disable @typescript-eslint/naming-convention */
          settings_type: 'master',
          notification_channel: 'all',
          enabled: true,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      });
      expect(mockEnableNotifications).toHaveBeenCalled();
      expect(mockListNotifications).toHaveBeenCalled();
    });
  });
});
