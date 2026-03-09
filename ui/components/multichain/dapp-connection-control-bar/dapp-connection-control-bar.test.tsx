import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DappConnectionControlBar } from './dapp-connection-control-bar';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const connectedMockState = {
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    domains: {
      'https://metamask.github.io': 'sepolia-test-client',
    },
    networkConfigurationsByChainId: {
      ...mockState.metamask.networkConfigurationsByChainId,
      '0xaa36a7': {
        chainId: '0xaa36a7',
        name: 'Sepolia',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            type: 'custom',
            url: 'https://sepolia.test',
            networkClientId: 'sepolia-test-client',
          },
        ],
        defaultRpcEndpointIndex: 0,
      },
    },
    selectedMultichainNetworkChainId: 'eip155:11155111',
    isEvmSelected: true,
    selectedNetworkClientId: 'sepolia-test-client',
    multichainNetworkConfigurationsByChainId: {
      ...mockState.metamask.multichainNetworkConfigurationsByChainId,
      'eip155:11155111': {
        chainId: 'eip155:11155111',
        name: 'Sepolia',
        nativeCurrency: 'ETH',
        isEvm: true,
      },
    },
    internalAccounts: {
      accounts: {
        'eip155:11155111:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          id: 'eip155:11155111:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          type: 'eip155:eoa',
          metadata: {
            name: 'Test Account',
            lastSelected: Date.now(),
          },
          scopes: ['eip155:11155111'],
          methods: [],
          options: {},
        },
      },
      selectedAccount:
        'eip155:11155111:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    },
    accounts: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        balance: '0x0',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
        metadata: {
          id: 'test-keyring-id',
        },
      },
    ],
    subjects: {
      'https://metamask.github.io': {
        permissions: {
          'endowment:caip25': {
            parentCapability: 'endowment:caip25',
            caveats: [
              {
                type: 'authorizedScopes',
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:11155111': {
                      accounts: [
                        'eip155:11155111:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                      ],
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      },
    },
    subjectMetadata: {
      ...mockState.metamask.subjectMetadata,
      'https://metamask.github.io': {
        name: 'E2E Test Dapp',
        iconUrl: 'https://metamask.github.io/test-dapp/metamask-fox.svg',
        subjectType: 'website',
        origin: 'https://metamask.github.io',
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
};

const disconnectedMockState = {
  metamask: {
    ...mockState.metamask,
    completedOnboarding: true,
    subjects: {},
  },
  activeTab: {
    id: 113,
    title: 'E2E Test Dapp',
    origin: 'https://metamask.github.io',
    protocol: 'https:',
    url: 'https://metamask.github.io/test-dapp/',
  },
};

describe('DappConnectionControlBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when connected to a dapp', () => {
    const renderConnected = () => {
      const store = configureStore(connectedMockState);
      return renderWithProvider(<DappConnectionControlBar />, store);
    };

    it('renders the control bar', () => {
      const { getByTestId } = renderConnected();
      expect(getByTestId('dapp-connection-control-bar')).toBeInTheDocument();
    });

    it('displays the site origin', () => {
      const { getByText } = renderConnected();
      expect(getByText('metamask.github.io')).toBeInTheDocument();
    });

    it('displays the green connection dot on the favicon', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__connection-dot'),
      ).toBeInTheDocument();
    });

    it('displays the network button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__network-button'),
      ).toBeInTheDocument();
    });

    it('displays the permissions button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__permissions-button'),
      ).toBeInTheDocument();
    });

    it('displays the disconnect button', () => {
      const { getByTestId } = renderConnected();
      expect(
        getByTestId('dapp-connection-control-bar__disconnect-button'),
      ).toBeInTheDocument();
    });

    it('navigates to permissions page when permissions button is clicked', () => {
      const { getByTestId } = renderConnected();
      fireEvent.click(
        getByTestId('dapp-connection-control-bar__permissions-button'),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/review-permissions/https%3A%2F%2Fmetamask.github.io',
      );
    });

    it('opens disconnect modal when disconnect button is clicked', () => {
      const { getByTestId } = renderConnected();
      fireEvent.click(
        getByTestId('dapp-connection-control-bar__disconnect-button'),
      );
      expect(getByTestId('disconnect-all-modal')).toBeInTheDocument();
    });
  });

  describe('when not connected to a dapp', () => {
    it('does not render the control bar', () => {
      const store = configureStore(disconnectedMockState);
      const { queryByTestId } = renderWithProvider(
        <DappConnectionControlBar />,
        store,
      );
      expect(
        queryByTestId('dapp-connection-control-bar'),
      ).not.toBeInTheDocument();
    });
  });
});
