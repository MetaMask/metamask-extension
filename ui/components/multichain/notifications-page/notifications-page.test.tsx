import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { NotificationsPage } from './notifications-page';

const mockStore = configureStore([]);

describe('NotificationsPage', () => {
  it('renders without crashing', () => {
    const store = mockStore({
      metamask: {
        theme: 'light',
      },
    });

    const { getByTestId } = render(
      <Provider store={store}>
        <Router>
          <NotificationsPage>
            <div>Test Child</div>
          </NotificationsPage>
        </Router>
      </Provider>,
    );

    expect(getByTestId('notifications-page')).toBeInTheDocument();
  });
});
