import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { NETWORKS_ROUTE } from '../../helpers/constants/routes';
import { NetworksPage } from './networks-page';

const mockTrackEvent = jest.fn();

jest.mock('../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockSafeChains = [
  {
    name: 'Gnosis',
    chainId: 100,
    nativeCurrency: { symbol: 'xDAI' },
    rpc: ['https://rpc.gnosischain.com'],
    explorers: [{ url: 'https://gnosisscan.io' }],
  },
  {
    name: 'Cronos Mainnet',
    chainId: 25,
    nativeCurrency: { symbol: 'CRO' },
    rpc: ['https://evm.cronos.org'],
    explorers: [{ url: 'https://cronoscan.com' }],
  },
  {
    name: 'Sepolia',
    chainId: 11155111,
    nativeCurrency: { symbol: 'SepoliaETH' },
    rpc: ['https://sepolia.infura.io/v3/123'],
    explorers: [{ url: 'https://sepolia.etherscan.io' }],
  },
  {
    name: 'HTTP Only Network',
    chainId: 200,
    nativeCurrency: { symbol: 'HTTP' },
    rpc: ['http://rpc.http-only.example.com'],
    explorers: [{ url: 'http://explorer.http-only.example.com' }],
  },
  ...Array.from({ length: 101 }, (_, index) => ({
    name: `Chainlist Network ${index + 1}`,
    chainId: 1000 + index,
    nativeCurrency: { symbol: `T${index + 1}` },
    rpc: [`https://rpc-${index + 1}.example.com`],
    explorers: [{ url: `https://explorer-${index + 1}.example.com` }],
  })),
  {
    name: 'Multi RPC Network',
    chainId: 300,
    nativeCurrency: { symbol: 'MULTI' },
    rpc: [
      'https://rpc-primary.example.com',
      'https://rpc-secondary.example.com',
      'https://rpc-tertiary.example.com',
    ],
    explorers: [{ url: 'https://explorer-multi.example.com' }],
  },
];

jest.mock('../../components/multichain/networks-form/use-safe-chains', () => ({
  ...jest.requireActual(
    '../../components/multichain/networks-form/use-safe-chains',
  ),
  useSafeChains: () => ({ safeChains: mockSafeChains }),
}));

const mockJsonRpcRequest = jest.fn().mockResolvedValue('0x1');
jest.mock('../../../shared/lib/rpc.utils', () => ({
  ...jest.requireActual('../../../shared/lib/rpc.utils'),
  jsonRpcRequest: (...args: unknown[]) => mockJsonRpcRequest(...args),
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
    name: 'Gnosis Custom',
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

const multiRpcNetworkConfiguration = {
  '0x12c': {
    chainId: '0x12c',
    name: 'Multi RPC Network',
    rpcEndpoints: [
      {
        url: 'https://rpc-primary.example.com',
        type: RpcEndpointType.Custom,
        networkClientId: 'multi-rpc',
      },
    ],
    defaultRpcEndpointIndex: 0,
    blockExplorerUrls: [],
    defaultBlockExplorerUrlIndex: 0,
    nativeCurrency: 'MULTI',
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
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockJsonRpcRequest.mockReset();
    mockJsonRpcRequest.mockResolvedValue('0x1');
  });

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
    editedNetwork,
    remoteFeatureFlags = {},
    showTestNetworks = false,
  }: {
    pathname?: string;
    networkConfigurationsByChainId?: typeof mockNetworkConfigurations;
    selectedNetworkClientId?: string;
    selectedProviderChainId?: string;
    enabledNetworkMap?: Record<string, Record<string, boolean>>;
    editedNetwork?: { chainId: string; nickname?: string };
    remoteFeatureFlags?: Record<string, unknown>;
    showTestNetworks?: boolean;
  } = {}) => {
    const store = configureStore({
      ...mockState,
      appState: {
        ...mockState.appState,
        editedNetwork,
      },
      metamask: {
        ...mockState.metamask,
        networkConfigurationsByChainId,
        selectedNetworkClientId,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          ...remoteFeatureFlags,
        },
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

    await userEvent.click(screen.getByTestId('page-header-search-button'));
    fireEvent.change(screen.getByTestId('page-header-search-input'), {
      target: { value: 'ugtfvh' },
    });
    await waitFor(() => {
      expect(
        screen.getByTestId('networks-page-no-results'),
      ).toBeInTheDocument();
    });
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
    expect(
      screen.queryByTestId('network-form-add-from-chainlist'),
    ).not.toBeInTheDocument();
  });

  it('opens the add network flow from the add custom network button', async () => {
    renderNetworksPage();

    await userEvent.click(
      screen.getByTestId('networks-page-add-custom-network-button'),
    );

    expect(
      await screen.findByText(messages.addNetwork.message),
    ).toBeInTheDocument();
  });

  it('keeps the add from Chainlist button when chainlist v2 is off', () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    expect(
      screen.getByTestId('network-form-add-from-chainlist'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('networks-page-chainlist-source-banner'),
    ).not.toBeInTheDocument();
  });

  it('opens the Chainlist dropdown from the network name field', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    expect(
      screen.queryByRole('button', {
        name: messages.addFromChainlist.message,
      }),
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId('network-form-network-name'));
    });

    expect(
      screen.getByTestId('networks-page-chainlist-source-banner'),
    ).toBeInTheDocument();
    expect(screen.getByText('Gnosis')).toBeInTheDocument();
    const nameDropdown = screen.getByTestId('networks-page-chainlist-dropdown');
    expect(nameDropdown).toHaveAttribute('data-anchor', 'name');
  });

  it('caps the Chainlist list above the Save button', () => {
    const rectSpy = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        const rect = {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON() {
            return {};
          },
        };
        if (this.classList.contains('networks-form__footer')) {
          rect.top = 500;
          rect.y = 500;
        }
        if (
          this.getAttribute('data-testid') ===
          'networks-page-chainlist-dropdown'
        ) {
          rect.top = 120;
          rect.y = 120;
        }
        return rect as DOMRect;
      });

    try {
      renderNetworksPage({
        pathname: `${NETWORKS_ROUTE}?view=add`,
        remoteFeatureFlags: {
          extensionUxChainlist: true,
          extensionUxChainlistV2: true,
        },
      });

      expect(
        screen.getByTestId('networks-page-chainlist-dropdown')
          .firstElementChild,
      ).toHaveStyle({ maxHeight: '372px' });

      fireEvent.focus(screen.getByTestId('network-form-chain-id'));

      expect(
        screen.getByTestId('networks-page-chainlist-dropdown')
          .firstElementChild,
      ).toHaveStyle({ maxHeight: '372px' });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it('fills the add network form when a Chainlist network is chosen', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('network-form-network-name'));
    });
    await act(async () => {
      fireEvent.click(
        screen.getByText('Gnosis').closest('button') as HTMLButtonElement,
      );
    });

    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Gnosis',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('100');
    expect(screen.getByTestId('network-form-ticker-input')).toHaveValue('xDAI');
    expect(
      screen.queryByTestId('networks-page-chainlist-source-banner'),
    ).not.toBeInTheDocument();
  });

  it('keeps a typed network name when Chainlist has no match', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    await act(async () => {
      fireEvent.change(screen.getByTestId('network-form-network-name'), {
        target: { value: 'sasdf' },
      });
    });

    expect(
      screen.getByText(messages.chainlistNoMatches.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Use "sasdf" as network name')).toBeInTheDocument();
    expect(
      screen.getByText(messages.chainlistEnterNetworkDetailsManually.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('networks-page-chainlist-source-banner'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Gnosis')).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByTestId('networks-page-chainlist-use-typed-name'),
      );
    });

    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'sasdf',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('');
    expect(
      screen.queryByTestId('networks-page-chainlist-use-typed-name'),
    ).not.toBeInTheDocument();
  });

  it('redirects away from the Chainlist picker when the remote feature flag is disabled', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
    });

    expect(
      await screen.findByText(messages.addNetwork.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
    ).not.toBeInTheDocument();
  });

  it('renders the Chainlist picker from the query param', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    expect(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen
        .getByTestId('networks-page-chainlist-network-list')
        .contains(screen.getByTestId('networks-page-chainlist-search')),
    ).toBe(false);
    expect(
      screen
        .getByTestId('networks-page-chainlist-network-list')
        .contains(screen.getByTestId('networks-page-chainlist-source-banner')),
    ).toBe(true);
    expect(screen.getByText('Gnosis')).toBeInTheDocument();
    expect(screen.queryByText('HTTP Only Network')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        messages.chainlistNetworkDetails.message
          .replace('$1', 'xDAI')
          .replace('$2', '100'),
      ),
    ).toBeInTheDocument();
  });

  it('keeps Chainlist network details populated when a stale edited network exists', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      editedNetwork: { chainId: '0x1', nickname: 'Ethereum' },
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    const gnosisButton = (await screen.findByText('Gnosis')).closest('button');
    expect(gnosisButton).toBeInTheDocument();

    fireEvent.click(gnosisButton as HTMLButtonElement);

    expect(
      await screen.findByText(messages.addNetwork.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Gnosis',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('100');
    expect(screen.getByTestId('network-form-ticker-input')).toHaveValue('xDAI');
  });

  it('hides built-in test networks from Chainlist when test networks are hidden', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...testNetworkConfiguration,
      },
      remoteFeatureFlags: { extensionUxChainlist: true },
      showTestNetworks: false,
    });

    fireEvent.change(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      { target: { value: 'Sepolia' } },
    );
    await waitFor(() => {
      expect(screen.queryByText('Sepolia')).not.toBeInTheDocument();
    });
    expect(
      screen.queryByTestId('networks-page-chainlist-added-pill'),
    ).not.toBeInTheDocument();
  });

  it('shows built-in test networks in Chainlist when test networks are shown', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...testNetworkConfiguration,
      },
      remoteFeatureFlags: { extensionUxChainlist: true },
      showTestNetworks: true,
    });

    fireEvent.change(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      { target: { value: 'Sepolia' } },
    );
    expect(await screen.findByText('Sepolia')).toBeInTheDocument();
    expect(
      screen.getByTestId('networks-page-chainlist-added-pill'),
    ).toHaveTextContent(messages.added.message);
  });

  it('prefills only the top Chainlist RPC URL in the add network form', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    fireEvent.change(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      { target: { value: 'Multi RPC' } },
    );

    const multiRpcButton = (
      await screen.findByText('Multi RPC Network')
    ).closest('button');
    expect(multiRpcButton).toBeInTheDocument();

    fireEvent.click(multiRpcButton as HTMLButtonElement);

    expect(
      await screen.findByText(messages.addNetwork.message),
    ).toBeInTheDocument();
    expect(screen.getByText('rpc-primary.example.com')).toBeInTheDocument();
    expect(
      screen.queryByText('rpc-secondary.example.com'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('rpc-tertiary.example.com'),
    ).not.toBeInTheDocument();
  });

  it('opens the Chainlist dropdown from the chain ID field', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    fireEvent.focus(screen.getByTestId('network-form-chain-id'));

    expect(
      await screen.findByTestId('networks-page-chainlist-source-banner'),
    ).toBeInTheDocument();
    const chainIdDropdown = screen.getByTestId(
      'networks-page-chainlist-dropdown',
    );
    expect(chainIdDropdown).toHaveAttribute('data-anchor', 'chainId');
    expect(
      screen.getByTestId('network-form-chain-id-input').parentElement,
    ).toContainElement(chainIdDropdown);
  });

  it('does not write a chain ID search into the network name', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    fireEvent.change(screen.getByTestId('network-form-chain-id'), {
      target: { value: '999999' },
    });

    expect(
      await screen.findByText(messages.chainlistNoMatches.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('networks-page-chainlist-use-typed-name'),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('network-form-network-name')).toHaveValue('');
  });

  it('keeps Chainlist details when leaving and returning from add RPC', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      editedNetwork: { chainId: '0x1', nickname: 'Ethereum' },
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    fireEvent.click(screen.getByTestId('network-form-network-name'));
    fireEvent.click(
      (await screen.findByText('Gnosis')).closest(
        'button',
      ) as HTMLButtonElement,
    );

    fireEvent.click(screen.getByTestId('test-add-rpc-drop-down'));
    fireEvent.click(screen.getByText(messages.addRpcUrl.message));

    expect(await screen.findByTestId('rpc-url-input-test')).toBeInTheDocument();
    expect(screen.getByTestId('add-rpc-network-name')).toHaveTextContent(
      'Gnosis',
    );

    fireEvent.click(screen.getByTestId('networks-page-form-back-button'));

    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Gnosis',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('100');
    expect(screen.getByTestId('network-form-ticker-input')).toHaveValue('xDAI');
    expect(
      screen.queryByTestId('networks-page-chainlist-dropdown'),
    ).not.toBeInTheDocument();
  });

  it('keeps Chainlist details when leaving and returning from add block explorer', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      editedNetwork: { chainId: '0x1', nickname: 'Ethereum' },
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    fireEvent.click(screen.getByTestId('network-form-network-name'));
    fireEvent.click(
      (await screen.findByText('Gnosis')).closest(
        'button',
      ) as HTMLButtonElement,
    );

    fireEvent.click(screen.getByTestId('test-explorer-drop-down'));
    fireEvent.click(screen.getByText(messages.addBlockExplorerUrl.message));

    expect(
      await screen.findByText(messages.addBlockExplorerUrl.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('networks-page-form-back-button'));

    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Gnosis',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('100');
    expect(screen.getByTestId('network-form-ticker-input')).toHaveValue('xDAI');
    expect(
      screen.queryByTestId('networks-page-chainlist-dropdown'),
    ).not.toBeInTheDocument();
  });

  it('returns to the edit network form from add block explorer', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=edit`,
      editedNetwork: { chainId: '0x1', nickname: 'Ethereum' },
    });

    expect(screen.getByText(messages.editNetwork.message)).toBeInTheDocument();
    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Ethereum',
    );

    fireEvent.click(screen.getByTestId('test-explorer-drop-down'));
    fireEvent.click(screen.getByText(messages.addBlockExplorerUrl.message));

    expect(
      await screen.findByText(messages.addBlockExplorerUrl.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('networks-page-form-back-button'));

    expect(screen.getByText(messages.editNetwork.message)).toBeInTheDocument();
    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Ethereum',
    );
    expect(screen.getByTestId('network-form-chain-id')).toHaveValue('1');
  });

  it('lets a single custom RPC URL be deleted', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=edit`,
      editedNetwork: { chainId: '0x12345', nickname: 'Custom network 1' },
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...customNetworkConfiguration,
      },
    });

    fireEvent.click(screen.getByTestId('test-add-rpc-drop-down'));
    const rpcOption = screen.getByTestId('network-form-rpc-option-0');
    const deleteRpc = rpcOption.parentElement?.querySelector(
      '[data-testid="delete-item-0"]',
    );
    expect(deleteRpc).not.toBeNull();
    fireEvent.click(deleteRpc as HTMLElement);

    expect(
      screen.queryByText('custom-rpc.example.com'),
    ).not.toBeInTheDocument();
  });

  it('tries the next Chainlist RPC when the first one cannot be fetched', async () => {
    mockJsonRpcRequest
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('0x12c');

    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    fireEvent.change(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      { target: { value: 'Multi RPC' } },
    );
    fireEvent.click(
      (await screen.findByText('Multi RPC Network')).closest(
        'button',
      ) as HTMLButtonElement,
    );

    expect(
      await screen.findByText('rpc-secondary.example.com'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('rpc-primary.example.com'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.failedToFetchChainId.message),
    ).not.toBeInTheDocument();
  });

  it('keeps a custom RPC when a Chainlist URL would have been replaced', async () => {
    let rpcRequests = 0;
    mockJsonRpcRequest.mockImplementation(() => {
      rpcRequests += 1;
      // The Chainlist prefill and the add-form check succeed. The fetch after
      // the custom URL is saved fails, and must not restore a Chainlist URL.
      if (rpcRequests <= 2) {
        return Promise.resolve('0x64');
      }
      return Promise.reject(new Error('down'));
    });

    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add`,
      remoteFeatureFlags: {
        extensionUxChainlist: true,
        extensionUxChainlistV2: true,
      },
    });

    fireEvent.click(screen.getByTestId('network-form-network-name'));
    fireEvent.click(
      (await screen.findByText('Gnosis')).closest(
        'button',
      ) as HTMLButtonElement,
    );

    expect(await screen.findByText('rpc.gnosischain.com')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('test-add-rpc-drop-down'));
    const rpcOption = screen.getByTestId('network-form-rpc-option-0');
    fireEvent.click(
      rpcOption.parentElement?.querySelector(
        '[data-testid="delete-item-0"]',
      ) as HTMLElement,
    );
    fireEvent.click(screen.getByText(messages.addRpcUrl.message));

    fireEvent.change(await screen.findByTestId('rpc-url-input-test'), {
      target: { value: 'https://custom.example.com' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('page-container-footer-next')).toBeEnabled(),
    );
    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(await screen.findByText('custom.example.com')).toBeInTheDocument();
    expect(screen.queryByText('rpc.gnosischain.com')).not.toBeInTheDocument();
  });

  it('lets the only failing RPC be deleted', async () => {
    mockJsonRpcRequest.mockRejectedValue(new Error('down'));

    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    fireEvent.click(
      (await screen.findByText('Gnosis')).closest(
        'button',
      ) as HTMLButtonElement,
    );

    expect(
      await screen.findByText(messages.failedToFetchChainId.message),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('test-add-rpc-drop-down'));
    const rpcOption = screen.getByTestId('network-form-rpc-option-0');
    const deleteRpc = rpcOption.parentElement?.querySelector(
      '[data-testid="delete-item-0"]',
    );
    expect(deleteRpc).not.toBeNull();
    fireEvent.click(deleteRpc as HTMLElement);

    expect(screen.queryByText('rpc.gnosischain.com')).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.failedToFetchChainId.message),
    ).not.toBeInTheDocument();
  });

  it('prefills Chainlist network name from the canonical network name when available', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    const cronosButton = (await screen.findByText('Cronos Mainnet')).closest(
      'button',
    );
    expect(cronosButton).toBeInTheDocument();

    fireEvent.click(cronosButton as HTMLButtonElement);

    expect(
      await screen.findByText(messages.addNetwork.message),
    ).toBeInTheDocument();
    expect(screen.getByTestId('network-form-network-name')).toHaveValue(
      'Cronos',
    );
    expect(screen.queryByTestId('network-form-name-suggestion')).toBeNull();
  });

  it('renders an empty state when the Chainlist search has no results', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    fireEvent.change(
      await screen.findByPlaceholderText(
        messages.searchNetworkNameOrChainId.message,
      ),
      { target: { value: 'ugtfvh' } },
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('networks-page-chainlist-no-results'),
      ).toBeInTheDocument();
    });
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
      remoteFeatureFlags: { extensionUxChainlist: true },
    });

    expect(await screen.findByText('Chainlist Network 98')).toBeInTheDocument();
    expect(screen.queryByText('Chainlist Network 99')).not.toBeInTheDocument();

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

    expect(await screen.findByText('Chainlist Network 99')).toBeInTheDocument();
  });

  it('shows an Added pill for already configured Chainlist networks', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=add-from-chainlist`,
      remoteFeatureFlags: { extensionUxChainlist: true },
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...gnosisNetworkConfiguration,
      },
    });

    expect(await screen.findByText('Gnosis Custom')).toBeInTheDocument();
    expect(screen.queryByText('Gnosis')).not.toBeInTheDocument();
    const gnosisButton = screen.getByText('Gnosis Custom').closest('button');
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

    fireEvent.change(screen.getByTestId('rpc-url-input-test'), {
      target: { value: 'https://new-rpc.example.com' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('page-container-footer-next')).toBeEnabled(),
    );
    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(
      await screen.findByText(messages.editNetwork.message),
    ).toBeInTheDocument();
  });

  it('tracks a Chainlist RPC added to the network being edited', async () => {
    renderNetworksPage({
      pathname: `${NETWORKS_ROUTE}?view=edit-rpc`,
      remoteFeatureFlags: { extensionUxChainlistV2: true },
      editedNetwork: { chainId: '0x12c', nickname: 'Multi RPC Network' },
      networkConfigurationsByChainId: {
        ...mockNetworkConfigurations,
        ...multiRpcNetworkConfiguration,
      },
    });

    fireEvent.focus(screen.getByTestId('rpc-url-input-test'));

    expect(screen.getByText('rpc-secondary.example.com')).toBeInTheDocument();
    expect(screen.getByText('rpc-tertiary.example.com')).toBeInTheDocument();
    expect(
      screen.queryByText('https://rpc-primary.example.com'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('https://rpc.gnosischain.com'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('rpc-secondary.example.com'));
    fireEvent.change(screen.getByTestId('rpc-name-input-test'), {
      target: { value: 'custom nickname' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('page-container-footer-next')).toBeEnabled(),
    );
    fireEvent.click(screen.getByTestId('page-container-footer-next'));

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Chainlist RPC Selected',
        /* eslint-disable @typescript-eslint/naming-convention */
        properties: expect.objectContaining({
          category: 'Network',
          chain_id: '0x12c',
          network_name: 'Multi RPC Network',
          rpc_domain: 'rpc-secondary.example.com',
        }),
        /* eslint-enable @typescript-eslint/naming-convention */
      }),
    );
  });
});
