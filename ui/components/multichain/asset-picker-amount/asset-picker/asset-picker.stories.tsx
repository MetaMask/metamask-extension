import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPicker } from './asset-picker';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TabName } from '../asset-picker-modal/asset-picker-modal-tabs';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_IDS,
} from '../../../../../shared/constants/network';
import { ERC20Asset } from '../asset-picker-modal/types';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { RpcEndpointType } from '@metamask/network-controller';

const storybook = {
  title: 'Components/Multichain/AssetPickerAmount/AssetPicker',
  component: AssetPicker,
};

const props = {
  asset: {
    symbol: 'ETH',
    address: '0xaddress1',
    image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
    type: AssetType.token,
    chainId: '0x1',
  } as ERC20Asset,
};
export const DefaultStory = () => {
  const t = useI18nContext();
  return (
    <AssetPicker
      header={t('sendSelectReceiveAsset')}
      onAssetChange={() => ({})}
      {...props}
    />
  );
};

DefaultStory.storyName = 'Default';

export const DisabledStory = () => {
  const t = useI18nContext();
  return (
    <AssetPicker
      header={t('sendSelectReceiveAsset')}
      onAssetChange={() => ({})}
      {...props}
      isDisabled
    />
  );
};

DisabledStory.storyName = 'Disabled';

export const SendDestStory = () => {
  const t = useI18nContext();
  return (
    <AssetPicker
      header={t('sendSelectReceiveAsset')}
      onAssetChange={() => ({})}
      {...props}
      asset={{
        symbol: 'ETH',
        image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
        type: AssetType.native,
        chainId: '0x1',
      }}
      sendingAsset={{
        image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
        symbol: 'ETH',
      }}
    />
  );
};

function store() {
  const defaultMockState = { ...mockState };
  defaultMockState.metamask = {
    ...defaultMockState.metamask,
    ...(mockNetworkState(
      { chainId: CHAIN_IDS.MAINNET },
      { chainId: CHAIN_IDS.LINEA_MAINNET },
      { chainId: CHAIN_IDS.GOERLI },
    ) as any),
  };
  return configureStore(defaultMockState);
}

SendDestStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

SendDestStory.storyName = 'With Sending Asset';

const networkProps = {
  network: {
    chainId: '0x1',
    name: 'Mainnet',
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    rpcEndpoints: [
      {
        networkClientId: 'test1',
        url: 'https://mainnet.infura.io/v3/',
        type: RpcEndpointType.Custom,
      },
    ],
    nativeCurrency: 'ETH',
  },
  networks: [
    {
      chainId: '0x1',
      name: 'Mainnet Name That Is Very Long',
      blockExplorerUrls: [],
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'test1',
          url: 'https://mainnet.infura.io/v3/',
          type: RpcEndpointType.Custom,
        },
      ],
      nativeCurrency: 'ETH',
    },
    {
      chainId: '0x10',
      name: 'Optimism',
      blockExplorerUrls: [],
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'test2',
          url: 'https://optimism.infura.io/v3/',
          type: RpcEndpointType.Custom,
        },
      ],
      nativeCurrency: 'ETH',
    },
    {
      chainId: CHAIN_IDS.LINEA_MAINNET,
      name: 'Linea Mainnet Test Name',
      blockExplorerUrls: [],
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          networkClientId: 'test3',
          url: 'https://linea.infura.io/v3/',
          type: RpcEndpointType.Custom,
        },
      ],
      nativeCurrency: 'ETH',
    },
  ],
  shouldDisableNetwork: (networkConfig) =>
    networkConfig.chainId === CHAIN_IDS.LINEA_MAINNET,
  onNetworkChange: () => ({}),
};
export const NetworksStory = () => {
  return (
    <AssetPicker
      header={'Bridge from'}
      onAssetChange={() => ({})}
      {...props}
      asset={{
        symbol: 'ETH',
        image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
        type: AssetType.native,
        chainId: '0x1',
      }}
      networkProps={networkProps as never}
      visibleTabs={[TabName.TOKENS]}
    />
  );
};

NetworksStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

NetworksStory.storyName = 'With Network Picker';

export const MultichainNetworksStory = () => {
  return (
    <AssetPicker
      header={'Bridge from'}
      onAssetChange={() => ({})}
      {...props}
      asset={{
        symbol: 'ETH',
        image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
        type: AssetType.native,
        chainId: '0x1',
      }}
      isMultiselectEnabled={true}
      networkProps={networkProps as never}
      visibleTabs={[TabName.TOKENS]}
    />
  );
};

MultichainNetworksStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

MultichainNetworksStory.storyName = 'With Multichain Network Picker';

export default storybook;
