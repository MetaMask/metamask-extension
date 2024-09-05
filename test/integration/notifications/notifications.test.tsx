import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import * as actions from '../../../ui/store/actions';
import mockMetaMaskState from '../data/integration-init-state.json';

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

  it('should show badge with correct unread notifications', async () => {
    const { queryByTestId } = await integrationTestRender({
      preloadedState: mockMetaMaskState,
      backgroundConnection: backgroundConnectionMocked,
    });

    expect(
      queryByTestId('notifications-tag-counter__unread-dot'),
    ).toBeInTheDocument();
  });
});
