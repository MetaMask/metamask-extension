import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPicker } from './asset-picker';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TabName } from '../asset-picker-modal/asset-picker-modal-tabs';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/network';
import { ERC20Asset } from '../asset-picker-modal/types';

const storybook = {
  title: 'Components/Multichain/AssetPicker',
  component: AssetPicker,
};

const props = {
  asset: {
    symbol: 'ETH',
    address: '0xaddress1',
    image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
    type: AssetType.token,
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
      }}
      sendingAsset={{
        image: 'token image',
        symbol: 'ETH',
      }}
    />
  );
};

function store() {
  const defaultMockState = { ...mockState };
  defaultMockState.metamask = {
    ...defaultMockState.metamask,
    providerConfig: {
      ...defaultMockState.metamask.providerConfig,
      chainId: '0x1',
      ticker: 'ETH',
      nickname: 'Ethereum Mainnet',
    },
  };
  return configureStore(defaultMockState);
}

SendDestStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

SendDestStory.storyName = 'With Sending Asset';

export const NetworksStory = ({ isOpen }: { isOpen: boolean }) => {
  const t = useI18nContext();
  return (
    <AssetPicker
      header={'Bridge from'}
      onAssetChange={() => ({})}
      {...props}
      asset={{
        symbol: 'ETH',
        image: CHAIN_ID_TOKEN_IMAGE_MAP['0x1'],
        type: AssetType.native,
      }}
      networkProps={{
        network: {
          chainId: '0x1',
          nickname: 'Mainnet',
          rpcUrl: 'https://mainnet.infura.io/v3/',
          type: 'rpc',
          ticker: 'ETH',
        },
        networks: [
          {
            chainId: '0x1',
            nickname: 'Mainnet',
            rpcUrl: 'https://mainnet.infura.io/v3/',
            type: 'rpc',
            ticker: 'ETH',
          },
          {
            chainId: '0x10',
            nickname: 'Optimism',
            rpcUrl: 'https://optimism.infura.io/v3/',
            type: 'rpc',
            ticker: 'ETH',
          },
        ],
        onNetworkChange: () => ({}),
      }}
      visibleTabs={[TabName.TOKENS]}
    />
  );
};

NetworksStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

NetworksStory.storyName = 'With Network Picker';

export default storybook;
