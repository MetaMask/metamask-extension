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

describe('NetworksPage', () => {
  const renderNetworksPage = (pathname = NETWORKS_ROUTE) => {
    const store = configureStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networkConfigurationsByChainId: mockNetworkConfigurations,
        selectedNetworkClientId: 'mainnet',
        providerConfig: {
          chainId: '0x1',
          rpcUrl: 'https://mainnet.infura.io/v3/123',
          type: 'rpc',
          ticker: 'ETH',
        },
        enabledNetworkMap: {
          eip155: {
            '0x1': true,
          },
        },
      },
    });

    return renderWithProvider(<NetworksPage />, store, pathname);
  };

  it('renders the sectioned networks view on the root route', () => {
    renderNetworksPage();

    expect(
      screen.getByText(messages.enabledNetworks.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.addACustomNetwork.message),
    ).toBeInTheDocument();
  });

  it('renders the add network flow from the query param', () => {
    renderNetworksPage(`${NETWORKS_ROUTE}?view=add`);

    expect(screen.getByText(messages.addNetwork.message)).toBeInTheDocument();
  });

  it('renders the custom rpc page with footer actions and adds the rpc', async () => {
    renderNetworksPage(`${NETWORKS_ROUTE}?view=edit-rpc`);

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
