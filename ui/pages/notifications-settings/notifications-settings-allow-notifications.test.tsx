import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';

const mockStore = configureStore();
const store = mockStore({
  metamask: {
    isMetamaskNotificationsEnabled: false,
  },
});

describe('NotificationsSettingsAllowNotifications', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <MetamaskNotificationsProvider>
          <NotificationsSettingsAllowNotifications
            disabled={false}
            loading={false}
            setLoading={() => {
              return null;
            }}
          />
        </MetamaskNotificationsProvider>
      </Provider>,
    );

    expect(
      getByTestId('notifications-settings-allow-notifications'),
    ).toBeInTheDocument();
  });
});
