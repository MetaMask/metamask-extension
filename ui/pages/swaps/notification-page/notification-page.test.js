import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import { QUOTES_EXPIRED_ERROR } from '../../../../shared/constants/swaps';
import NotificationPage from './notification-page';

const middleware = [thunk];

describe('NotificationPage', () => {
  it('renders the component with the QUOTES_EXPIRED_ERROR', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText } = renderWithProvider(
      <NotificationPage notificationKey={QUOTES_EXPIRED_ERROR} />,
      store,
    );
    expect(getByText('Are you still there?')).toBeInTheDocument();
    expect(
      getByText(
        'We’re ready to show you the latest quotes when you want to continue',
      ),
    ).toBeInTheDocument();
    expect(getByText('Show latest quotes')).toBeInTheDocument();
    expect(getByText('Terms of service')).toBeInTheDocument();
  });

  it('renders the component with an unsupported error key', () => {
    const mockStore = createSwapsMockStore();
    const store = configureMockStore(middleware)(mockStore);
    const { getByText, queryByText } = renderWithProvider(
      <NotificationPage notificationKey="unsupportedNotificationKey" />,
      store,
    );
    expect(queryByText('Are you still there?')).not.toBeInTheDocument();
    expect(
      queryByText(
        'We’re ready to show you the latest quotes when you want to continue',
      ),
    ).not.toBeInTheDocument();
    expect(queryByText('Show latest quotes')).not.toBeInTheDocument();
    expect(getByText('Terms of service')).toBeInTheDocument();
  });
});
