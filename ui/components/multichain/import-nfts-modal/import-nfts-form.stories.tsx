import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { mockNetworkState } from '../../../../test/stub/networks';
import { ImportNftsPage } from '../../../pages/import-nfts';

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

const meta: Meta<typeof ImportNftsPage> = {
  title: 'Components/Multichain/ImportNftsPage',
  component: ImportNftsPage,
  decorators: [
    (Story) => (
      <Provider store={createStore()}>
        <Story />
      </Provider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ImportNftsPage>;

export const Default: Story = {};
