import React from 'react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { Connections } from './connections';

describe('Connections Content', () => {
  const render = () => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        permissionHistory: {
          'https://test.dapp': {
            eth_accounts: {
              accounts: {
                '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1596681857076,
              },
            },
          },
        },
        subjects: {
          'https://test.dapp': {
            permissions: {
              eth_accounts: {
                caveats: [
                  {
                    type: 'restrictReturnedAccounts',
                    value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                  },
                ],
                invoker: 'https://test.dapp',
                parentCapability: 'eth_accounts',
              },
            },
          },
        },
      },
      activeTab: {
        id: 113,
        title: 'E2E Test Dapp',
        origin: 'https://metamask.github.io',
        protocol: 'https:',
        url: 'https://metamask.github.io/test-dapp/',
      },
      unconnectedAccount: {
        state: 'OPEN',
      },
    });
    return renderWithProvider(<Connections />, store);
  };
  it('should render correctly', () => {
    const { container, getByTestId } = render();
    expect(container).toMatchSnapshot();
    expect(getByTestId('connections-page')).toBeInTheDocument();
  });

  it('it should render title of the dapp correctly', () => {
    const { getByText } = render();
    expect(getByText('metamask.github.io')).toBeInTheDocument();
  });

  it('it should render button of the page', () => {
    const { getByText } = render();
    expect(getByText('Connect accounts')).toBeInTheDocument();
  });
});
