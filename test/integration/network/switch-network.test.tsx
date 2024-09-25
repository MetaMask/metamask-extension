import { fireEvent, waitFor } from '@testing-library/react';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

describe.skip('Switch Network', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should switch to a new network when a different network is selected', async () => {
    const { getByTestId, queryByTestId } = await integrationTestRender({
        preloadedState: mockMetaMaskState,
      backgroundConnection: backgroundConnection,
    });

    // click to open the network list
    fireEvent.click(getByTestId('network-dropdown'));

    // click test id 'network-option-3' for the new network
    fireEvent.click(getByTestId('network-option-3'));

    // Wait for the network to change
    await waitFor(() => expect(mockedBackgroundConnection.submitRequestToBackground).toHaveBeenCalledWith({
      method: 'metamask_switchEthereumChain',
      params: [{ chainId: '3' }], // new network
    }));
  });
});