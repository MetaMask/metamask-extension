import React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RpcEndpointType } from '@metamask/network-controller';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import { NETWORKS_ROUTE } from '../../helpers/constants/routes';
import { NetworksPage } from './networks-page';

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

  it('renders the sectioned networks view and keeps testnets visible while selected on a testnet', () => {
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
  });

  it('renders the add network flow from the query param', () => {
    renderNetworksPage({ pathname: `${NETWORKS_ROUTE}?view=add` });

    expect(screen.getByText(messages.addNetwork.message)).toBeInTheDocument();
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
