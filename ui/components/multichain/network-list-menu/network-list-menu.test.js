/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { NetworkListMenu } from '.';

const mockSetShowTestNetworks = jest.fn();
const mockToggleNetworkMenu = jest.fn();
const mockSetNetworkClientIdForDomain = jest.fn();
const mockSetActiveNetwork = jest.fn();

jest.mock('../../../store/actions.ts', () => ({
  setShowTestNetworks: () => mockSetShowTestNetworks,
  setActiveNetwork: () => mockSetActiveNetwork,
  toggleNetworkMenu: () => mockToggleNetworkMenu,
  setNetworkClientIdForDomain: (network, id) =>
    mockSetNetworkClientIdForDomain(network, id),
}));

const MOCK_ORIGIN = 'https://portfolio.metamask.io';

const render = ({
  showTestNetworks = false,
  selectedNetworkClientId = 'goerli',
  isUnlocked = true,
  origin = MOCK_ORIGIN,
  selectedTabOriginInDomainsState = true,
} = {}) => {
  const state = {
    metamask: {
      ...mockState.metamask,
      isUnlocked,
      selectedNetworkClientId,
      preferences: {
        showTestNetworks,
      },
      useRequestQueue: true,
      domains: {
        ...(selectedTabOriginInDomainsState
          ? { [origin]: selectedNetworkClientId }
          : {}),
      },
    },
    activeTab: {
      origin,
    },
  };

  const store = configureStore(state);
  return renderWithProvider(<NetworkListMenu onClose={jest.fn()} />, store);
};

describe('NetworkListMenu', () => {
  beforeEach(() => {
    process.env.ENABLE_NETWORK_UI_REDESIGN = 'false';
    jest.clearAllMocks();
  });

  it('renders properly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
  it('displays important controls', () => {
    const { getByText, getByPlaceholderText } = render();

    expect(getByText('Add network')).toBeInTheDocument();
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
    const { getByText } = render();
    fireEvent.click(getByText(MAINNET_DISPLAY_NAME));
    expect(mockToggleNetworkMenu).toHaveBeenCalled();
    expect(mockSetActiveNetwork).toHaveBeenCalled();
  });

  it('shows the correct selected network when networks share the same chain ID', () => {
    // Mainnet and Custom Mainnet RPC both use chain ID 0x1
    render({
      showTestNetworks: false,
      currentChainId: CHAIN_IDS.MAINNET,
      selectedNetworkClientId: 'testNetworkConfigurationId',
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

    const selectedNodeText = selectedNodes[0].querySelector(
      '.multichain-network-list-item__network-name',
    ).textContent;
    expect(selectedNodeText).toStrictEqual('Custom Mainnet RPC');
  });

  it('narrows down search results', () => {
    const { queryByText, getByPlaceholderText } = render();

    expect(queryByText('Chain 5')).toBeInTheDocument();

    const searchBox = getByPlaceholderText('Search');
    fireEvent.focus(searchBox);
    fireEvent.change(searchBox, { target: { value: 'Main' } });

    expect(queryByText('Chain 5')).not.toBeInTheDocument();
  });

  it('enables the "Add Network" button when MetaMask is locked', () => {
    const { queryByText } = render({ isUnlocked: false });
    expect(queryByText('Add network')).toBeEnabled();
  });

  it('enables the "Add Network" button when MetaMask is true', () => {
    const { queryByText } = render({ isUnlocked: true });
    expect(queryByText('Add network')).toBeEnabled();
  });

  it('does not allow deleting networks when locked', () => {
    render({ isUnlocked: false });
    expect(
      document.querySelectorAll('multichain-network-list-item__delete'),
    ).toHaveLength(0);
  });

  describe('selectedTabOrigin is connected to wallet', () => {
    it('fires setNetworkClientIdForDomain when network item is clicked', () => {
      const { getByText } = render();
      fireEvent.click(getByText(MAINNET_DISPLAY_NAME));
      expect(mockSetNetworkClientIdForDomain).toHaveBeenCalledWith(
        MOCK_ORIGIN,
        NETWORK_TYPES.MAINNET,
      );
    });

    it('fires setNetworkClientIdForDomain when test network item is clicked', () => {
      const { getByText } = render({ showTestNetworks: true });
      fireEvent.click(getByText(SEPOLIA_DISPLAY_NAME));
      expect(mockSetNetworkClientIdForDomain).toHaveBeenCalledWith(
        MOCK_ORIGIN,
        NETWORK_TYPES.SEPOLIA,
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
    // Set the environment variable before tests run
    beforeEach(() => {
      window.metamaskFeatureFlags = {
        networkMenuRedesign: true,
      };
    });

    // Reset the environment variable after tests complete
    afterEach(() => {
      window.metamaskFeatureFlags = {
        networkMenuRedesign: false,
      };
    });

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
});
