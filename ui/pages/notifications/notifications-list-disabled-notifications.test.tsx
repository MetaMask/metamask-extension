import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { NotificationsListDisabledNotifications } from './notifications-list-disabled-notifications';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({ metamask: {} });

describe('NotificationsListDisabledNotifications', () => {
  it('renders correctly', () => {
    renderWithProvider(<NotificationsListDisabledNotifications />, store);

    expect(
      screen.getByTestId('notifications-list-disabled-notifications'),
    ).toBeInTheDocument();
  });
});
