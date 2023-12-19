import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import {
  BNB_TOKEN_IMAGE_URL,
  BSC_DISPLAY_NAME,
  CHAIN_IDS,
  OPTIMISM_DISPLAY_NAME,
  OPTIMISM_TOKEN_IMAGE_URL,
} from '../../../../shared/constants/network';
import { NetworkListMenu } from '.';

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
        'test-networkConfigurationId-3': {
          rpcUrl: 'https://testrpc.com',
          chainId: CHAIN_IDS.OPTIMISM,
          nickname: OPTIMISM_DISPLAY_NAME,
          rpcPrefs: { imageUrl: OPTIMISM_TOKEN_IMAGE_URL },
        },
        'test-networkConfigurationId-4': {
          rpcUrl: 'https://testrpc.com',
          chainId: CHAIN_IDS.BSC,
          nickname: BSC_DISPLAY_NAME,
          rpcPrefs: { imageUrl: BNB_TOKEN_IMAGE_URL },
        },
      },
    },
  },
});

export default {
  title: 'Components/Multichain/NetworkListMenu',
  component: NetworkListMenu,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <NetworkListMenu {...args} />;
DefaultStory.decorators = [
  (Story) => (
    <Provider store={customNetworkStore}>
      <Story />
    </Provider>
  ),
];
