import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { ConnectedSiteMenu } from '.';

describe('Connected Site Menu', () => {
  const mockAccount1 = createMockInternalAccount({
    id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    name: 'Account 1',
  });

  const mockAccount2 = createMockInternalAccount({
    id: '07c2cfec-36c9-46c4-8115-3836d3ac9047',
    address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
    name: 'Account 2',
  });

  const internalAccounts = {
    accounts: {
      [mockAccount1.id]: mockAccount1,
      [mockAccount2.id]: mockAccount2,
    },
    selectedAccount: mockAccount2.id,
  };

  const accounts = {
    [mockAccount1.address]: {
      address: mockAccount1.address,
      balance: '0x0',
    },
    [mockAccount2.address]: {
      address: mockAccount2.address,
      balance: '0x0',
    },
  };

  const defaultNetworkConfigurations = {
    [CHAIN_IDS.MAINNET]: {
      chainId: CHAIN_IDS.MAINNET,
      name: 'Ethereum Mainnet',
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'mainnet-infura',
          type: 'infura',
          url: 'https://mock-mainnet-url',
        },
      ],
      blockExplorerUrls: ['https://mock-mainnet-explorer'],
    },
    [CHAIN_IDS.POLYGON]: {
      chainId: CHAIN_IDS.POLYGON,
      name: 'Polygon',
      nickname: 'Polygon',
      nativeCurrency: 'MATIC',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'polygon-mainnet',
          type: 'custom',
          url: 'https://mock-polygon-url',
        },
      ],
      blockExplorerUrls: ['https://mock-polygon-explorer'],
    },
    [CHAIN_IDS.ARBITRUM]: {
      chainId: CHAIN_IDS.ARBITRUM,
      name: 'Arbitrum',
      nickname: 'Arbitrum',
      nativeCurrency: 'ETH',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'arbitrum-mainnet',
          type: 'custom',
          url: 'https://mock-arbitrum-url',
        },
      ],
      blockExplorerUrls: ['https://mock-arbitrum-explorer'],
    },
    [CHAIN_IDS.BSC]: {
      chainId: CHAIN_IDS.BSC,
      name: 'BNB Smart Chain',
      nickname: 'BNB Smart Chain',
      nativeCurrency: 'BNB',
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'bsc-mainnet',
          type: 'custom',
          url: 'https://mock-bsc-url',
        },
      ],
      blockExplorerUrls: ['https://mock-bsc-explorer'],
    },
  };

  const defaultSubjectMetadata = {
    'https://uniswap.org/': {
      iconUrl: 'https://uniswap.org/favicon.ico',
      name: 'Uniswap',
    },
  };

  const createMockStore = (customState = {}) => {
    const mergedMetamask = {
      internalAccounts,
      accounts,
      subjectMetadata: defaultSubjectMetadata,
      permissions: {
        subjects: {
          'https://uniswap.org/': {
            permissions: {
              'endowment:caip25': {
                caveats: [
                  {
                    type: 'authorizedScopes',
                    value: {
                      'eip155:1': {
                        methods: [],
                        notifications: [],
                        accounts: [`eip155:1:${mockAccount1.address}`],
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      domains: {
        'https://uniswap.org/': 'mainnet-infura',
      },
      networkConfigurationsByChainId: defaultNetworkConfigurations,
      selectedNetworkClientId: 'mainnet-infura',
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: [mockAccount1.address, mockAccount2.address],
          metadata: {
            id: 'test-keyring-id',
          },
        },
      ],
      // Add multichain network state
      selectedMultichainNetworkChainId: 'eip155:1',
      isEvmSelected: true,
      // Add permission history for the selector
      permissionHistory: {
        'https://uniswap.org/': {
          eth_accounts: {
            accounts: [`eip155:1:${mockAccount1.address}`],
          },
        },
      },
      ...customState.metamask,
    };

    // Ensure nested objects are properly merged
    if (customState.metamask?.subjectMetadata) {
      mergedMetamask.subjectMetadata = {
        ...defaultSubjectMetadata,
        ...customState.metamask.subjectMetadata,
      };
    }

    if (customState.metamask?.networkConfigurationsByChainId) {
      mergedMetamask.networkConfigurationsByChainId = {
        ...defaultNetworkConfigurations,
        ...customState.metamask.networkConfigurationsByChainId,
      };
    }

    return {
      metamask: mergedMetamask,
      activeTab: {
        origin: 'https://uniswap.org/',
        ...customState.activeTab,
      },
      ...customState,
    };
  };

  it('should render the site menu in connected state', () => {
    const props = {
      globalMenuColor: Color.successDefault,
      text: 'connected',
      status: STATUS_CONNECTED,
    };
    const store = configureMockStore()(createMockStore());
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render the site menu in not connected state', () => {
    const props = {
      globalMenuColor: Color.iconAlternative,
      status: STATUS_NOT_CONNECTED,
    };
    const store = configureMockStore()(createMockStore());
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render the site menu in not connected to current account state', () => {
    const props = {
      globalMenuColor: BackgroundColor.backgroundDefault,
      text: 'not connected',
      status: STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
    };
    const store = configureMockStore()(createMockStore());
    const { getByTestId, container } = renderWithProvider(
      <ConnectedSiteMenu {...props} />,
      store,
    );
    expect(getByTestId('connection-menu')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});
