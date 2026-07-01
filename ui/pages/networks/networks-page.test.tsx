import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { NETWORKS_ROUTE } from '../../helpers/constants/routes';
import { NetworksPage } from './networks-page';

const mockSafeChains = [
  {
    name: 'Gnosis',
    chainId: 100,
    nativeCurrency: { symbol: 'xDAI' },
    rpc: ['https://rpc.gnosischain.com'],
    explorers: [{ url: 'https://gnosisscan.io' }],
  },
  ...Array.from({ length: 101 }, (_, index) => ({
    name: `Chainlist Network ${index + 1}`,
    chainId: 1000 + index,
    nativeCurrency: { symbol: `T${index + 1}` },
    rpc: [`https://rpc-${index + 1}.example.com`],
    explorers: [{ url: `https://explorer-${index + 1}.example.com` }],
  })),
];

jest.mock('../../components/multichain/networks-form/use-safe-chains', () => ({
  ...jest.requireActual(
    '../../components/multichain/networks-form/use-safe-chains',
  ),
  useSafeChains: () => ({ safeChains: mockSafeChains }),
}));

jest.mock('../../components/ui/toggle-button', () => {
  const ReactActual = jest.requireActual('react');

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: ({
      dataTestId,
      disabled,
      value,
      onToggle,
    }: {
      dataTestId: string;
      disabled?: boolean;
      value: boolean;
      onToggle: (value: boolean) => void;
    }) =>
      ReactActual.createElement('input', {
        'data-testid': dataTestId,
        checked: value,
        disabled,
        onChange: () => onToggle(value),
        type: 'checkbox',
      }),
  };
});

const mockNetworkConfigurations = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum',
    rpcEndpoints: [
      {
        url: 'https://mainnet.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://etherscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
};

const customNetworkConfiguration = {
  '0x12345': {
    chainId: '0x12345',
    name: 'Custom network 1',
    rpcEndpoints: [
      {
        url: 'https://custom-rpc.example.com',
        type: RpcEndpointType.Custom,
        networkClientId: 'custom-network-1',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: [],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
};

const gnosisNetworkConfiguration = {
  '0x64': {
    chainId: '0x64',
    name: 'Gnosis',
    rpcEndpoints: [
      {
        url: 'https://rpc.gnosischain.com',
        type: RpcEndpointType.Custom,
        networkClientId: 'gnosis-mainnet',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: ['https://gnosisscan.io'],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'xDAI',
  },
};

const testNetworkConfiguration = {
  '0xaa36a7': {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    rpcEndpoints: [
      {
        url: 'https://sepolia.infura.io/v3/123',
        type: RpcEndpointType.Infura,
        networkClientId: 'sepolia',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: [],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'ETH',
  },
};

describe('NetworksPage', () => {
  const renderNetworksPage = ({
    pathname = NETWORKS_ROUTE,
    networkConfigurationsByChainId = mockNetworkConfigurations,
    selectedNetworkClientId = 'mainnet',
    selectedProviderChainId = '0x1',
    enabledNetworkMap = {
      eip155: {
        '0x1': true,
      },
    },
    showTestNetworks = false,
  }: {
    pathname?: string;
    networkConfigurationsByChainId?: typeof mockNetworkConfigurations;
    selectedNetworkClientId?: string;
    selectedProviderChainId?: string;
    enabledNetworkMap?: Record<string, Record<string, boolean>>;
    showTestNetworks?: boolean;
  } = {}) => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networkConfigurationsByChainId,
        selectedNetworkClientId,
        providerConfig: {
          chainId: selectedProviderChainId,
          rpcUrl: 'https://mainnet.infura.io/v3/123',
          type: 'rpc',
          ticker: 'ETH',
        },
        enabledNetworkMap,
        preferences: {
          ...mockState.metamask.preferences,
          showTestNetworks,
        },
      },
    });

    return renderWithProvider(<NetworksPage />, store, pathname);
  };

  it('renders the sectioned networks view and keeps testnets visible while selected on a testnet', async () => {
    renderNetworksPage({
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...customNetworkConfiguration,
        ...testNetworkConfiguration,
      },
      selectedNetworkClientId: 'sepolia',
      selectedProviderChainId: '0xaa36a7',
      enabledNetworkMap: {
        eip155: {
          '0xaa36a7': true,
        },
      },
      showTestNetworks: false,
    });

    const defaultNetworksHeader = screen.getByText(
      messages.defaultNetworks.message,
    );
    const customNetworksHeader = screen.getByText(
      messages.customNetworks.message,
    );
    const showTestNetworksHeader = screen.getByText(
      messages.showTestnetNetworks.message,
    );
    const additionalNetworksHeader = screen.getByText(
      messages.additionalNetworks.message,
    );

    expect(screen.getByText('Custom network 1')).toBeInTheDocument();
    expect(screen.getByText('Sepolia')).toBeInTheDocument();
    expect(
      defaultNetworksHeader.compareDocumentPosition(customNetworksHeader),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      customNetworksHeader.compareDocumentPosition(showTestNetworksHeader),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      showTestNetworksHeader.compareDocumentPosition(additionalNetworksHeader),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      screen.getByText(messages.addACustomNetwork.message),
    ).toBeInTheDocument();

    const testnetToggle = screen.getByTestId(
      'networks-page-show-test-networks',
    );

    expect(testnetToggle).toBeChecked();
    expect(testnetToggle).toBeDisabled();

    await userEvent.click(screen.getByTestId('settings-header-search-button'));
    await userEvent.type(
      screen.getByTestId('settings-header-search-input'),
      'ugtfvh',
    );

    expect(screen.getByTestId('networks-page-no-results')).toBeInTheDocument();
    expect(
      screen.getByText(messages.settingsSearchMatchingNotFound.message),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(messages.settingsSearchMatchingNotFound.message),
    ).toHaveAttribute('src', './images/empty-state-activity-light.png');
    expect(screen.queryByText('Custom network 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Sepolia')).not.toBeInTheDocument();
  });

  it('renders the add network flow from the query param', () => {
    renderNetworksPage({ pathname: `${NETWORKS_ROUTE}?view=add` });

    expect(screen.getByText(messages.addNetwork.message)).toBeInTheDocument();
  });

  it('renders the Chainlist picker from the query param', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
    });

    expect(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Gnosis')).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.chainlistNetworkDetails.message
          .replace('$1', 'xDAI')
          .replace('$2', '100'),
      ),
    ).toBeInTheDocument();
  });

  it('renders an empty state when the Chainlist search has no results', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
    });

    await userEvent.type(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      'ugtfvh',
    );

    expect(
      screen.getByTestId('networks-page-chainlist-no-results'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.settingsSearchMatchingNotFound.message),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText(messages.settingsSearchMatchingNotFound.message),
    ).toHaveAttribute('src', './images/empty-state-activity-light.png');
    expect(screen.queryByText('Gnosis')).not.toBeInTheDocument();
  });

  it('loads more Chainlist networks as the user scrolls', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
    });

    expect(await screen.findByText('Chainlist Network 99')).toBeInTheDocument();
    expect(screen.queryByText('Chainlist Network 100')).not.toBeInTheDocument();

    const networkList = screen.getByTestId(
      'networks-page-chainlist-network-list',
    );
    Object.defineProperty(networkList, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(networkList, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(networkList, 'scrollTop', {
      configurable: true,
      value: 450,
    });

    fireEvent.scroll(networkList);

    expect(
      await screen.findByText('Chainlist Network 100'),
    ).toBeInTheDocument();
  });

  it('shows an Added pill for already configured Chainlist networks', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...gnosisNetworkConfiguration,
      },
    });

    expect(await screen.findByText('Gnosis')).toBeInTheDocument();
    const gnosisButton = screen.getByText('Gnosis').closest('button');
    expect(gnosisButton).toHaveClass('bg-muted');
    expect(
      screen.getByTestId('networks-page-chainlist-added-pill'),
    ).toHaveTextContent(messages.added.message);

    fireEvent.click(gnosisButton as HTMLButtonElement);

    expect(
      await screen.findByText(messages.editNetwork.message),
    ).toBeInTheDocument();
  });

  it('renders the custom rpc page with footer actions and adds the rpc', async () => {
    renderNetworksPage({ pathname: `${NETWORKS_ROUTE}?view=edit-rpc` });

    expect(
      screen.getByTestId('page-container-footer-cancel'),
    ).toHaveTextContent('Cancel');
    expect(screen.getByTestId('page-container-footer-next')).toHaveTextContent(
      'Add URL',
    );

    await userEvent.type(
      screen.getByTestId('rpc-url-input-test'),
      'https://new-rpc.example.com',
    );
    await userEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(screen.getByText(messages.editNetwork.message)).toBeInTheDocument();
  });
});
