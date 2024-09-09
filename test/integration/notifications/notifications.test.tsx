import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import { act, screen } from '@testing-library/react';
import { createMockImplementation } from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));


const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const setupSubmitRequestToBackgroundMocks = (
  mockRequests?: Record<string, unknown>,
) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    createMockImplementation({
      ...(mockRequests ?? {}),
    }),
  );
};

describe('Notifications', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  it('should show badge with correct unread notifications', async () => {
    const mockedRequests = {
      getState: mockMetaMaskState,
    };

    setupSubmitRequestToBackgroundMocks(mockedRequests);

    await act(async() => {
      await integrationTestRender({
        preloadedState: {
          ...mockMetaMaskState,
         },
        backgroundConnection: backgroundConnectionMocked,
      });
    })

    expect(
      screen.getByTestId('notifications-tag-counter__unread-dot'),
    ).toBeInTheDocument();
  });
});
