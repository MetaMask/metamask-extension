import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { NetworkConfiguration, RpcEndpointType } from '@metamask/network-controller';
import { BNB_DISPLAY_NAME, LINEA_MAINNET_DISPLAY_NAME, LINEA_SEPOLIA_DISPLAY_NAME, MAINNET_DISPLAY_NAME, NETWORK_TYPES, SEPOLIA_DISPLAY_NAME } from '../../../../../../shared/constants/network';
import AssetListControlBarNetworksModal from '.';

const MOCK_NETWORKS = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
];

const render = (networks: NetworkConfiguration[]) => {
  const state = {};
  const store = configureStore(state);
  return renderWithProvider(
    <AssetListControlBarNetworksModal networks={networks} onClose={() => undefined} />,
    store,
  );
};

describe('AssetListControlBarNetworksModal', () => {
  it('renders AssetListControlBarNetworksModal component properly', async () => {
    const { container } = render(MOCK_NETWORKS);
    expect(container).toMatchSnapshot();
  });
});
