import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetamaskNotificationsProvider } from '../../../../contexts/metamask-notifications/metamask-notifications';
import TurnOnMetamaskNotifications from './turn-on-metamask-notifications';

const mockDispatch = jest.fn();
const mockHistoryPush = jest.fn();

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

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
