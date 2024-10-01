import React from 'react';
import { Router, Route } from 'react-router-dom'; // Import Router and Route
import { createMemoryHistory } from 'history';
import {
  fireEvent,
  renderWithProvider,
  waitFor,
} from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { Connections } from './connections';

describe('Connections Content', () => {
  const connectedStore = configureStore({
    ...mockState,
    activeTab: {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io',
    },
    metamask: {
      ...mockState.metamask,
      subjectMetadata: {
        'https://app.uniswap.org': {
          extensionId: null,
          iconUrl: 'https://app.uniswap.org/favicon.png',
          name: 'Uniswap Interface',
          origin: 'https://app.uniswap.org',
          subjectType: 'website',
          addresses: [
            '0x7e35fc4dfe70c01e8f6c1b5c477b82f8fe69b1b1',
            '0x584b688963f8f1734b4bc6507506219da4e7b546',
          ],
          addressToNameMap: {
            '0x7e35fc4dfe70c01e8f6c1b5c477b82f8fe69b1b1': 'Account 4',
            '0x584b688963f8f1734b4bc6507506219da4e7b546': 'Account 5',
          },
        },
        'https://metamask.github.io': {
          origin: 'https://metamask.github.io',
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              date: 1616006369498,
              id: '3d0bdc27-e8e4-4fb0-a24b-340d61f6a3fa',
              invoker: 'https://metamask.github.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
      },
      permissionHistory: {
        'https://metamask.github.io': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
            },
          },
        },
      },
      subjects: {
        'https://metamask.github.io': {
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              invoker: 'https://metamask.github.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
      },
    },
    unconnectedAccount: {
      state: 'OPEN',
    },
  });

  it('should render correctly', () => {
    const history = createMemoryHistory();
    history.push('/connect/https%3A%2F%2Fmetamask.github.io');

    const { container, getByTestId } = renderWithProvider(
      <Router history={history}>
        <Route path="/connect/:origin">
          <Connections />
        </Route>
      </Router>,
      connectedStore,
    );
    expect(container).toMatchSnapshot();
    expect(getByTestId('connections-page')).toBeInTheDocument();
  });

  it('should render Disconnect all Account button of the page', () => {
    const history = createMemoryHistory();
    history.push('/connect/https%3A%2F%2Fmetamask.github.io');

    const { getByText } = renderWithProvider(
      <Router history={history}>
        <Route path="/connect/:origin">
          <Connections />
        </Route>
      </Router>,
      connectedStore,
    );
    expect(getByText('Disconnect all accounts')).toBeInTheDocument();
  });

  it('should trigger disconnect all accounts modal flow when disconnect all accounts button is clicked', async () => {
    const history = createMemoryHistory();
    history.push('/connect/https%3A%2F%2Fmetamask.github.io');

    const { getByText, getByTestId } = renderWithProvider(
      <Router history={history}>
        <Route path="/connect/:origin">
          <Connections />
        </Route>
      </Router>,
      connectedStore,
    );

    // Simulate click on disconnect-all-modal button
    fireEvent.click(getByText('Disconnect all accounts'));

    // Ensure DisconnectAllModal is rendered
    await waitFor(() => {
      expect(getByTestId('disconnect-all-modal')).toBeInTheDocument();
    });
  });
});
