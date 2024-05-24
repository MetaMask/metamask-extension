import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import { MetamaskNotificationsProvider } from '../../../../contexts/metamask-notifications/metamask-notifications';
import TurnOnMetamaskNotifications from './turn-on-metamask-notifications';

const mockDispatch = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

describe('TurnOnMetamaskNotifications', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockHistoryPush.mockClear();
  });

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
