import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MetamaskNotificationsProvider } from '../../contexts/metamask-notifications/metamask-notifications';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: jest.fn(),
      createEventBuilder,
    }),
  };
});

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({
  metamask: {
    isMetamaskNotificationsEnabled: false,
  },
});

describe('NotificationsSettingsAllowNotifications', () => {
  it('renders correctly', () => {
    const testId = 'notifications-settings-allow';
    const { getByTestId } = render(
      <Provider store={store}>
        <MetamaskNotificationsProvider>
          <NotificationsSettingsAllowNotifications
            disabled={false}
            loading={false}
            setLoading={() => {
              return null;
            }}
            dataTestId={testId}
          />
        </MetamaskNotificationsProvider>
      </Provider>,
    );

    expect(getByTestId(`${testId}-toggle-box`)).toBeInTheDocument();
    expect(getByTestId(`${testId}-toggle-input`)).toBeInTheDocument();
  });
});
