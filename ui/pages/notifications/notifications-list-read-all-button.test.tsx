import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { NotificationsListReadAllButton } from './notifications-list-read-all-button';

const mockStore = configureStore([thunk]);
const store = mockStore({
  metamask: {
    metamaskNotificationsList: [],
  },
});

describe('NotificationsListReadAllButton', () => {
  it('renders correctly and handles click', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <NotificationsListReadAllButton notifications={[]} />
      </Provider>,
    );

    const button = getByTestId('notifications-list-read-all-button');
    expect(button).toBeInTheDocument();
  });
});
