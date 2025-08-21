/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { RpcEndpointType } from '@metamask/network-controller';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
  NETWORK_TYPES,
  LINEA_MAINNET_DISPLAY_NAME,
  BNB_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
} from '../../../../shared/constants/network';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { NetworkListMenu } from '.';

const mockSetShowTestNetworks = jest.fn();
const mockToggleNetworkMenu = jest.fn();
const mockSetNetworkClientIdForDomain = jest.fn();
const mockSetActiveNetwork = jest.fn();
const mockUpdateCustomNonce = jest.fn();
const mockSetNextNonce = jest.fn();
const mockSetTokenNetworkFilter = jest.fn();
const mockSetEnabledNetworks = jest.fn();
const mockDetectNfts = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setShowTestNetworks: () => {
    mockSetShowTestNetworks();
    return { type: 'SET_SHOW_TEST_NETWORKS' };
  },
  setActiveNetwork: () => {
    mockSetActiveNetwork();
    return { type: 'SET_ACTIVE_NETWORK' };
  },
  toggleNetworkMenu: () => {
    mockToggleNetworkMenu();
    return { type: 'TOGGLE_NETWORK_MENU' };
  },
  updateCustomNonce: () => {
    mockUpdateCustomNonce();
    return { type: 'UPDATE_CUSTOM_NONCE' };
  },
  setNextNonce: () => {
    mockSetNextNonce();
    return { type: 'SET_NEXT_NONCE' };
  },
  setNetworkClientIdForDomain: jest.fn((network, id) => {
    mockSetNetworkClientIdForDomain(network, id);
    return { type: 'SET_NETWORK_CLIENT_ID_FOR_DOMAIN', network, id };
  }),
  setTokenNetworkFilter: () => {
    mockSetTokenNetworkFilter();
    return { type: 'SET_TOKEN_NETWORK_FILTER' };
  },
  setEnabledNetworks: () => {
    mockSetEnabledNetworks();
    return { type: 'SET_ENABLED_NETWORKS' };
  },
  detectNfts: () => {
    mockDetectNfts();
    return { type: 'DETECT_NFTS' };
  },
}));

const MOCK_ORIGIN = 'https://portfolio.metamask.io';

const render = ({
  showTestNetworks = false,
  selectedNetworkClientId = 'goerli',
  isUnlocked = true,
  origin = MOCK_ORIGIN,
  selectedTabOriginInDomainsState = true,
  isAddingNewNetwork = false,
  isAccessedFromDappConnectedSitePopover = false,
  editedNetwork = undefined,
  neNetworkDiscoverButton = { '0x531': true, '0xe708': true },
} = {}) => {
  const state = {
    appState: {
      isAddingNewNetwork,
      editedNetwork,
      isAccessedFromDappConnectedSitePopover,
    },
    metamask: {
      ...mockState.metamask,
      networkConfigurationsByChainId: {
        '0x1': {
          nativeCurrency: 'ETH',
          chainId: '0x1',
          name: MAINNET_DISPLAY_NAME,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: NETWORK_TYPES.MAINNET,
            },
          ],
        },
        '0xe708': {
          nativeCurrency: 'ETH',
          chainId: '0xe708',
          name: LINEA_MAINNET_DISPLAY_NAME,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: 'linea-mainnet',
            },
          ],
        },
        '0x38': {
          nativeCurrency: 'BNB',
          chainId: '0x38',
          name: BNB_DISPLAY_NAME,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: 'bnb-network',
            },
          ],
        },
        '0x5': {
          nativeCurrency: 'ETH',
          chainId: '0x5',
          name: 'Chain 5',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: 'goerli',
            },
          ],
        },
        '0x539': {
          nativeCurrency: 'ETH',
          chainId: '0x539',
          name: SEPOLIA_DISPLAY_NAME,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: 'sepolia',
            },
          ],
        },
        '0xe705': {
          nativeCurrency: 'ETH',
          chainId: '0xe705',
          name: LINEA_SEPOLIA_DISPLAY_NAME,
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'http://localhost/rpc',
              type: RpcEndpointType.Custom,
              networkClientId: 'linea-sepolia',
            },
          ],
        },
      },
      isUnlocked,
      selectedNetworkClientId: NETWORK_TYPES.MAINNET,
      preferences: {
        showTestNetworks,
        tokenNetworkFilter: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
        },
      },
      domains: {
        ...(selectedTabOriginInDomainsState
          ? { [origin]: selectedNetworkClientId }
          : {}),
      },
      remoteFeatureFlags: {
        neNetworkDiscoverButton,
      },
    },
    activeTab: {
      origin: selectedTabOriginInDomainsState ? origin : undefined,
    },
  };

  const store = configureStore(state);
  return renderWithProvider(<NetworkListMenu onClose={jest.fn()} />, store);
};

describe('NetworkListMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders properly', () => {
    const { baseElement } = render();
    expect(baseElement).toMatchSnapshot();
  });

  it('should match snapshot when adding a network', async () => {
    const { baseElement } = render({
      isAddingNewNetwork: true,
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('should match snapshot when editing a network', async () => {
    const { baseElement } = render({
      editedNetwork: { chainId: 'eip155:1' },
    });
    expect(baseElement).toMatchSnapshot();
  });

  it('displays important controls', () => {
    const { getByText, getByPlaceholderText } = render();

    expect(getByText('Add a custom network')).toBeInTheDocument();
    expect(getByText('Show test networks')).toBeInTheDocument();
    expect(getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('renders mainnet item', () => {
    const { getByText } = render();
    expect(getByText(MAINNET_DISPLAY_NAME)).toBeInTheDocument();
  });

  it('renders test networks when it should', () => {
    const { getByText } = render({ showTestNetworks: true });
    expect(getByText(SEPOLIA_DISPLAY_NAME)).toBeInTheDocument();
  });

  it('toggles showTestNetworks when toggle is clicked', () => {
    const { queryAllByRole } = render();
    const [testNetworkToggle] = queryAllByRole('checkbox');
    fireEvent.click(testNetworkToggle);
    expect(mockSetShowTestNetworks).toHaveBeenCalled();
  });

  it('disables toggle when on test network', () => {
    render(false, { currentChainId: CHAIN_IDS.GOERLI });
    expect(document.querySelector('.toggle-button--disabled')).toBeDefined();
  });

  it('switches networks when an item is clicked', () => {
    const origin = 'https://portfolio.metamask.io';
    const { getByText } = render({
      selectedTabOriginInDomainsState: true,
      isUnlocked: true,
      isAccessedFromDappConnectedSitePopover: true,
      origin,
    });
    const mainnetItem = getByText(MAINNET_DISPLAY_NAME);
    expect(mainnetItem).toBeInTheDocument();
    fireEvent.click(mainnetItem);
    expect(mockToggleNetworkMenu).toHaveBeenCalled();
    expect(mockSetActiveNetwork).toHaveBeenCalled();
    expect(mockUpdateCustomNonce).toHaveBeenCalled();
    expect(mockSetNextNonce).toHaveBeenCalled();
    expect(mockDetectNfts).toHaveBeenCalled();
  });

  it('shows the correct selected network when networks share the same chain ID', () => {
    const { queryByText } = render({
      showTestNetworks: false,
      currentChainId: CHAIN_IDS.MAINNET,
      selectedNetworkClientId: NETWORK_TYPES.MAINNET,
      selectedTabOriginInDomainsState: true,
      isUnlocked: true,
      isAccessedFromDappConnectedSitePopover: true,
      origin: 'https://portfolio.metamask.io',
    });

    // Contains Mainnet, Linea Mainnet and the two custom networks
    const networkItems = document.querySelectorAll(
      '.multichain-network-list-item',
    );
    expect(networkItems).toHaveLength(4);

    const selectedNodes = document.querySelectorAll(
      '.multichain-network-list-item--selected',
    );
    expect(selectedNodes).toHaveLength(1);

    expect(queryByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('narrows down search results', () => {
    const { queryByText, getByPlaceholderText } = render();

    expect(queryByText('Chain 5')).toBeInTheDocument();

    const searchBox = getByPlaceholderText('Search');
    fireEvent.focus(searchBox);
    fireEvent.change(searchBox, { target: { value: 'Main' } });

    expect(queryByText('Chain 5')).not.toBeInTheDocument();
  });

  it('enables the "Add a custom network" button when MetaMask is locked', () => {
    const { queryByText } = render({ isUnlocked: false });
    expect(queryByText('Add a custom network')).toBeEnabled();
  });

  it('enables the "Add a custom network" button when MetaMask is true', () => {
    const { queryByText } = render({ isUnlocked: true });
    expect(queryByText('Add a custom network')).toBeEnabled();
  });

  it('does not allow deleting networks when locked', () => {
    render({ isUnlocked: false });
    expect(
      document.querySelectorAll('multichain-network-list-item__delete'),
    ).toHaveLength(0);
  });

  it('enables the "Discover" for Linea Mainnet button when the Feature Flag `neNetworkDiscoverButton` is true for Linea and the network is supported', () => {
    const { queryByTestId } = render({
      neNetworkDiscoverButton: {
        '0xe708': true,
      },
    });

    const menuButton = queryByTestId(
      `network-list-item-options-button-eip155:${hexToDecimal(
        CHAIN_IDS.LINEA_MAINNET,
      )}`,
    );
    fireEvent.click(menuButton);

    expect(
      queryByTestId('network-list-item-options-discover'),
    ).toBeInTheDocument();
  });

  it('disables the "Discover" button when the Feature Flag `neNetworkDiscoverButton` is false for Linea even if the network is supported', () => {
    const { queryByTestId } = render({
      neNetworkDiscoverButton: {
        '0x531': true,
        '0xe708': false,
      },
    });

    const menuButton = queryByTestId(
      `network-list-item-options-button-eip155:${hexToDecimal(
        CHAIN_IDS.LINEA_MAINNET,
      )}`,
    );
    fireEvent.click(menuButton);

    expect(
      queryByTestId('network-list-item-options-discover'),
    ).not.toBeInTheDocument();
  });

  it('disables the "Discover" button when the network is not in the list of `CHAIN_ID_PORTFOLIO_LANDING_PAGE_URL_MAP`', () => {
    const { queryByTestId } = render({
      neNetworkDiscoverButton: {
        '0x1': true,
      },
    });

    const menuButton = queryByTestId(
      `network-list-item-options-button-eip155:${hexToDecimal(
        CHAIN_IDS.MAINNET,
      )}`,
    );
    fireEvent.click(menuButton);

    expect(
      queryByTestId('network-list-item-options-discover'),
    ).not.toBeInTheDocument();
  });

  describe('selectedTabOrigin is connected to wallet', () => {
    it('fires setNetworkClientIdForDomain when network item is clicked', () => {
      const state = {
        appState: {
          isAddingNewNetwork: false,
          editedNetwork: undefined,
          isAccessedFromDappConnectedSitePopover: true,
        },
        metamask: {
          ...mockState.metamask,
          networkConfigurationsByChainId: {
            '0x1': {
              nativeCurrency: 'ETH',
              chainId: '0x1',
              name: MAINNET_DISPLAY_NAME,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  url: 'http://localhost/rpc',
                  type: RpcEndpointType.Custom,
                  networkClientId: NETWORK_TYPES.MAINNET,
                },
              ],
            },
          },
          isUnlocked: true,
          selectedNetworkClientId: NETWORK_TYPES.MAINNET,
          preferences: {
            showTestNetworks: false,
            tokenNetworkFilter: {
              [CHAIN_IDS.MAINNET]: true,
            },
          },
          domains: {
            [MOCK_ORIGIN]: NETWORK_TYPES.MAINNET,
          },
          remoteFeatureFlags: {
            '0x531': true,
            '0xe708': true,
          },
        },
        activeTab: {
          origin: MOCK_ORIGIN,
        },
      };
      const store = configureStore(state);
      jest.spyOn(store, 'dispatch');
      const { getByText } = renderWithProvider(
        <NetworkListMenu onClose={jest.fn()} />,
        store,
      );
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_NETWORK_CLIENT_ID_FOR_DOMAIN',
          network: MOCK_ORIGIN,
          id: NETWORK_TYPES.MAINNET,
        }),
      );
    });

    it('fires setNetworkClientIdForDomain when test network item is clicked', () => {
      const state = {
        appState: {
          isAddingNewNetwork: false,
          editedNetwork: undefined,
          isAccessedFromDappConnectedSitePopover: true,
        },
        metamask: {
          ...mockState.metamask,
          networkConfigurationsByChainId: {
            '0x539': {
              nativeCurrency: 'ETH',
              chainId: '0x539',
              name: SEPOLIA_DISPLAY_NAME,
              defaultRpcEndpointIndex: 0,
              rpcEndpoints: [
                {
                  url: 'http://localhost/rpc',
                  type: RpcEndpointType.Custom,
                  networkClientId: NETWORK_TYPES.SEPOLIA,
                },
              ],
            },
          },
          isUnlocked: true,
          selectedNetworkClientId: NETWORK_TYPES.SEPOLIA,
          preferences: {
            showTestNetworks: true,
            tokenNetworkFilter: {
              [CHAIN_IDS.SEPOLIA]: true,
            },
          },
          domains: {
            [MOCK_ORIGIN]: NETWORK_TYPES.SEPOLIA,
          },
          remoteFeatureFlags: {
            '0x531': true,
            '0xe708': true,
          },
        },
        activeTab: {
          origin: MOCK_ORIGIN,
        },
      };
      const store = configureStore(state);
      jest.spyOn(store, 'dispatch');
      const { getByText } = renderWithProvider(
        <NetworkListMenu onClose={jest.fn()} />,
        store,
      );
      fireEvent.click(getByText(SEPOLIA_DISPLAY_NAME));
      expect(store.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SET_NETWORK_CLIENT_ID_FOR_DOMAIN',
          network: MOCK_ORIGIN,
          id: NETWORK_TYPES.SEPOLIA,
        }),
      );
    });
  });

  describe('selectedTabOrigin is not connected to wallet', () => {
    it('does not fire setNetworkClientIdForDomain when network item is clicked', () => {
      const { getByText } = render({ selectedTabOriginInDomainsState: false });
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));
      expect(mockSetNetworkClientIdForDomain).not.toHaveBeenCalled();
    });
  });

  describe('NetworkListMenu with ENABLE_NETWORK_UI_REDESIGN', () => {
    it('should display "Arbitrum" when ENABLE_NETWORK_UI_REDESIGN is true', async () => {
      const { queryByText, getByPlaceholderText } = render();

      // Now "Arbitrum" should be in the document if PopularNetworkList is rendered
      expect(queryByText('Arbitrum One')).toBeInTheDocument();

      // Simulate typing "Optimism" into the search box
      const searchBox = getByPlaceholderText('Search');
      fireEvent.focus(searchBox);
      fireEvent.change(searchBox, { target: { value: 'OP Mainnet' } });

      // "Optimism" should be visible, but "Arbitrum" should not
      expect(queryByText('OP Mainnet')).toBeInTheDocument();
      expect(queryByText('Arbitrum One')).not.toBeInTheDocument();
    });

    it('should filter testNets when ENABLE_NETWORK_UI_REDESIGN is true', async () => {
      const { queryByText, getByPlaceholderText } = render({
        showTestNetworks: true,
      });

      // Check if all testNets are available
      expect(queryByText('Linea Sepolia')).toBeInTheDocument();
      expect(queryByText('Sepolia')).toBeInTheDocument();

      // Simulate typing "Linea Sepolia" into the search box
      const searchBox = getByPlaceholderText('Search');
      fireEvent.focus(searchBox);
      fireEvent.change(searchBox, { target: { value: 'Linea Sepolia' } });

      // "Linea Sepolia" should be visible, but "Sepolia" should not
      expect(queryByText('Linea Sepolia')).toBeInTheDocument();
      expect(queryByText('Sepolia')).not.toBeInTheDocument();
    });
  });

  describe('NetworkListMenu with REMOVE_GNS enabled', () => {
    it('should not switch networks when clicking network items', () => {
      const { getByText } = render({ selectedTabOriginInDomainsState: false });
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));

      expect(mockToggleNetworkMenu).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockUpdateCustomNonce).not.toHaveBeenCalled();
      expect(mockSetNextNonce).not.toHaveBeenCalled();
      expect(mockDetectNfts).not.toHaveBeenCalled();
    });

    it('should not show any networks as selected', () => {
      render({ selectedTabOriginInDomainsState: false });
      const selectedNodes = document.querySelectorAll(
        '.multichain-network-list-item--selected',
      );
      expect(selectedNodes).toHaveLength(0);
    });

    it('should still allow searching networks even when switching is disabled', () => {
      const { getByPlaceholderText, queryByText } = render();

      const searchBox = getByPlaceholderText('Search');
      fireEvent.focus(searchBox);
      fireEvent.change(searchBox, { target: { value: 'Main' } });

      // Search should still work
      expect(queryByText(MAINNET_DISPLAY_NAME)).toBeInTheDocument();
      expect(queryByText('Chain 5')).not.toBeInTheDocument();
    });

    it('should not fire network switch when isAccessedFromDappConnectedSitePopover is false', () => {
      const { getByText } = render({
        isAccessedFromDappConnectedSitePopover: false,
      });
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));

      expect(mockToggleNetworkMenu).not.toHaveBeenCalled();
      expect(mockSetActiveNetwork).not.toHaveBeenCalled();
      expect(mockUpdateCustomNonce).not.toHaveBeenCalled();
      expect(mockSetNextNonce).not.toHaveBeenCalled();
      expect(mockDetectNfts).not.toHaveBeenCalled();
    });

    it('should fire network switch when isAccessedFromDappConnectedSitePopover is true', () => {
      const { getByText } = render({
        isAccessedFromDappConnectedSitePopover: true,
      });
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));

      expect(mockToggleNetworkMenu).toHaveBeenCalled();
      expect(mockSetActiveNetwork).toHaveBeenCalled();
      expect(mockUpdateCustomNonce).toHaveBeenCalled();
      expect(mockSetNextNonce).toHaveBeenCalled();
      expect(mockDetectNfts).toHaveBeenCalled();
    });
  });
});
