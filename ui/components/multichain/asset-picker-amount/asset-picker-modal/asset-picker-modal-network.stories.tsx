import React, { useState } from 'react';
import { Provider } from 'react-redux';
import {
  RpcEndpointType,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetPickerModalNetwork } from './asset-picker-modal-network';
import { Meta, StoryFn } from '@storybook/react';
import { Button } from '../../../component-library';

const networks: NetworkConfiguration[] = [
  {
    chainId: CHAIN_IDS.MAINNET,
    nativeCurrency: 'ETH',
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: ['https://explorerurl'],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'test1',
        url: 'https://rpcurl',
        type: RpcEndpointType.Custom as const,
      },
    ],
    name: 'Ethereum',
  },
  {
    chainId: CHAIN_IDS.OPTIMISM,
    nativeCurrency: 'ETH',
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: ['https://explorerurl'],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'test2',
        url: 'https://rpcurl',
        type: RpcEndpointType.Custom as const,
      },
    ],
    name: 'OP',
  },
  {
    chainId: CHAIN_IDS.BSC,
    nativeCurrency: 'BNB',
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: ['https://explorerurl'],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'test3',
        url: 'https://rpcurl',
        type: RpcEndpointType.Custom as const,
      },
    ],
    name: 'BNB Smart Chain',
  },
];

function store() {
  return configureStore(mockState);
}

const AssetPickerModalNetworkWithButton: StoryFn<
  typeof AssetPickerModalNetwork
> = (args) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Provider store={store()}>
      <Button onClick={() => setIsOpen(true)}>Open Network Modal</Button>
      <AssetPickerModalNetwork
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </Provider>
  );
};

const meta: Meta<typeof AssetPickerModalNetwork> = {
  title: 'Components/Multichain/AssetPickerModalNetwork',
  component: AssetPickerModalNetwork,
  render: AssetPickerModalNetworkWithButton,
  args: {
    onNetworkChange: () => {},
    onBack: () => {},
  },
};

export default meta;
const Story = {
  args: {} as Partial<React.ComponentProps<typeof AssetPickerModalNetwork>>,
};
type StoryType = typeof Story & {
  args: Partial<React.ComponentProps<typeof AssetPickerModalNetwork>>;
};

export const Default: StoryType = {
  args: {
    networks,
  },
};

export const WithSelectedNetwork: StoryType = {
  args: {
    networks,
    network: networks[0],
  },
};

export const WithMultiSelect: StoryType = {
  args: {
    networks,
    isMultiselectEnabled: true,
    selectedChainIds: [CHAIN_IDS.MAINNET, CHAIN_IDS.OPTIMISM],
    onMultiselectSubmit: (chainIds) =>
      console.log('Selected chains:', chainIds),
  },
};

export const WithCustomHeader: StoryType = {
  args: {
    networks,
    header: 'Select Source Network',
  },
};
