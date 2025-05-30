import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import { MetamaskNotificationsProvider } from '../../../../contexts/metamask-notifications/metamask-notifications';
import TurnOnMetamaskNotifications from './turn-on-metamask-notifications';

describe('TurnOnMetamaskNotifications', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProvider(
      <MetamaskNotificationsProvider>
        <TurnOnMetamaskNotifications />
      </MetamaskNotificationsProvider>,
      configureMockStore()({
        ...mockStore,
      }),
    );
    expect(getByText('Turn on')).toBeInTheDocument();
  });
});
