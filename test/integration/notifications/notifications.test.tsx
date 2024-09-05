import { fireEvent, screen, waitFor } from '@testing-library/react';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import * as actions from '../../../ui/store/actions';
import mockMetaMaskState from '../data/integration-init-state.json';
import { createMockImplementation } from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../../ui/store/actions', () => ({
  fetchAndUpdateMetamaskNotifications: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedActions = jest.mocked(actions);

describe('Notifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should not show badge before notifications and show after update', async () => {
    const { getByTestId, queryByTestId } = await integrationTestRender({
      preloadedState: mockMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    // Check that the badge is not present initially
    expect(
      queryByTestId('notifications-tag-counter__unread-dot'),
    ).toBeInTheDocument();

    // Simulate updating notifications
    fireEvent.click(queryByTestId('notifications-tag-counter__unread-dot')!);

    // Wait for and check that the badge appears after update
    await waitFor(() => {
      expect(getByTestId('notification-badge')).toBeInTheDocument();
    });

    // Verify the badge count
    expect(getByTestId('notification-badge')).toHaveTextContent('1');

    // Check if fetchAndUpdateMetamaskNotifications was called
    expect(
      mockedActions.fetchAndUpdateMetamaskNotifications,
    ).toHaveBeenCalledTimes(1);
  });
});
