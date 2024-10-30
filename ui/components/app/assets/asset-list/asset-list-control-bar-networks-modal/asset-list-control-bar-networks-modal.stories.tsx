import React from 'react';
import AssetListControlBarNetworksModal from '.';
import { BNB_DISPLAY_NAME, LINEA_MAINNET_DISPLAY_NAME, LINEA_SEPOLIA_DISPLAY_NAME, MAINNET_DISPLAY_NAME, NETWORK_TYPES, SEPOLIA_DISPLAY_NAME } from '../../../../../../shared/constants/network';
import { RpcEndpointType } from '@metamask/network-controller';

export default {
  title: 'Components/App/AssetListControlBarNetworksModal',
  argTypes: {
    onClickAsset: {
      control: 'onClickAsset',
    },
  },
  args: {
    onClose: () => console.log('onClose fired'),
    networks: [
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
    ],
  },
};

export const DefaultStory = (args) => <AssetListControlBarNetworksModal {...args} />;

DefaultStory.storyName = 'Default';
