import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { ImportNftsModal } from '.';
import { CHAIN_IDS } from 'shared/constants/network';

const createStore = (chainId = CHAIN_IDS.MAINNET, useTokenDetection = true) => {
  return configureStore({
    ...testData,
    metamask: {
      ...testData.metamask,
      useTokenDetection,
      providerConfig: { chainId },
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
