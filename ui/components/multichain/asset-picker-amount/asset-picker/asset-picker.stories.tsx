import React from 'react';
import { Provider } from 'react-redux';
import { Asset } from '../../../../ducks/send';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPicker } from './asset-picker';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const storybook = {
  title: 'Components/Multichain/AssetPicker',
  component: AssetPicker,
};

const props = {
  asset: {
    balance: null,
    details: null,
    error: null,
    type: AssetType.token,
  } as unknown as Asset,
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
        balance: '200',
        details: { address: '0x1', symbol: 'ETH' },
        error: '',
        type: AssetType.native,
      }}
      sendingAsset={{
        balance: '200',
        details: { address: '0x1', symbol: 'ETH' },
        error: '',
        type: AssetType.native,
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
      header={t('bridgeFrom')}
      onAssetChange={() => ({})}
      {...props}
      asset={{
        balance: '200',
        details: { address: '0x1', symbol: 'ETH' },
        error: '',
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
      visibleTabs={['tokens']}
    />
  );
};

NetworksStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

NetworksStory.storyName = 'With Network Picker';

export default storybook;
