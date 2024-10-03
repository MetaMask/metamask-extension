import { act, screen } from '@testing-library/react';
import nock from 'nock';
import mockMetaMaskState from '../data/integration-init-state.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { createMockImplementation } from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
  callBackgroundMethod: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};


describe('Permit Confirmation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      createMockImplementation({
        getState: mockMetaMaskState,
        getTokenStandardAndDetails: { decimals: '2' },
      }),
    );
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it.only('displays the header account modal with correct data', async () => {
    //process.env.IN_TEST = '';

    await act(async () => {
      await integrationTestRender({
        preloadedState: mockMetaMaskState,
        backgroundConnection: backgroundConnectionMocked,
      });
    });

    expect(screen.getByTestId('network-display')).toBeInTheDocument();

    console.log(mockedBackgroundConnection.submitRequestToBackground.mock.calls);
  });

});
