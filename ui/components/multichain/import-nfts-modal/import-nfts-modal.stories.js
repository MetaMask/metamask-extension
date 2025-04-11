import React from 'react';
import { Provider } from 'react-redux';

import { ImportNftsModal } from '.';
import testData from '../../../../.storybook/test-data';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import configureStore from '../../../store/store';

const createStore = (chainId = CHAIN_IDS.MAINNET, useTokenDetection = true) => {
  return configureStore({
    ...testData,
    metamask: {
      ...testData.metamask,
      useTokenDetection,
      ...mockNetworkState({ chainId }),
    },
  });
};

export default {
  title: 'Components/Multichain/ImportNftsModal',
  component: ImportNftsModal,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <ImportNftsModal {...args} />;
DefaultStory.decorators = [
  (Story) => (
    <Provider store={createStore()}>
      <Story />
    </Provider>
  ),
];

DefaultStory.storyName = 'Default';
