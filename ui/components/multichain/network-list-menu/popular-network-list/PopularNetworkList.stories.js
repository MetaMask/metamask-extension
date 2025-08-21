import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../../.storybook/test-data';
import configureStore from '../../../../store/store';
import {
  CHAIN_IDS,
  CURRENCY_SYMBOLS,
  OPTIMISM_DISPLAY_NAME,
  OPTIMISM_TOKEN_IMAGE_URL,
  ZK_SYNC_ERA_DISPLAY_NAME,
  ZK_SYNC_ERA_TOKEN_IMAGE_URL,
} from '../../../../../shared/constants/network';
import PopularNetworkList from './popular-network-list';

const customNetworkStore = configureStore({
  ...testData,
  metamask: {
    ...testData.metamask,
    preferences: {
      showTestNetworks: true,
    },
    orderedNetworkList: [],
    networkConfigurations: {
      ...testData.metamask.networkConfigurations,
      ...{
        'test-networkConfigurationId-1': {
          chainId: CHAIN_IDS.OPTIMISM,
          nickname: OPTIMISM_DISPLAY_NAME,
          rpcUrl: `https://optimism-mainnet.infura.io/v3`,
          ticker: CURRENCY_SYMBOLS.ETH,
          rpcPrefs: {
            blockExplorerUrl: 'https://optimistic.etherscan.io/',
            imageUrl: OPTIMISM_TOKEN_IMAGE_URL,
          },
        },
        'test-networkConfigurationId-2': {
          chainId: CHAIN_IDS.ZKSYNC_ERA,
          nickname: ZK_SYNC_ERA_DISPLAY_NAME,
          rpcUrl: `https://mainnet.era.zksync.io`,
          ticker: CURRENCY_SYMBOLS.ETH,
          rpcPrefs: {
            blockExplorerUrl: 'https://explorer.zksync.io/',
            imageUrl: ZK_SYNC_ERA_TOKEN_IMAGE_URL,
          },
        },
      },
    },
  },
});

export default {
  title:
    'Components/Multichain/NetworkListMenu/PopularNetworkList/Popularnetworklist',
  component: PopularNetworkList,
};

export const Default = (args) => (
  <Provider store={customNetworkStore}>
    <PopularNetworkList {...args} />
  </Provider>
);

Default.args = {
  searchAddNetworkResults: [
    {
      nickname: OPTIMISM_DISPLAY_NAME,
      rpcPrefs: {
        imageUrl: OPTIMISM_TOKEN_IMAGE_URL,
      },
    },
    {
      nickname: ZK_SYNC_ERA_DISPLAY_NAME,
      rpcPrefs: {
        imageUrl: ZK_SYNC_ERA_TOKEN_IMAGE_URL,
      },
    },
  ],
};

Default.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
