/* eslint-disable react/prop-types */
import React from 'react';
import { Provider } from 'react-redux';
import { ApprovalType } from '@metamask/controller-utils';

import configureStore from '../../store/store';

import mockState from '../../../.storybook/test-data';

import ConfirmAddSuggestedNFT from '.';

const pendingNftApprovals = {
  1: {
    id: '1',
    origin: 'https://www.opensea.io',
    time: 1,
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0xb7F7F6C52F2e2fdb1963Eab30438024864c313F6',
        name: 'Wrapped CryptoPunks',
        tokenId: '1848',
        standard: 'ERC721',
        image: 'https://images.wrappedpunks.com/images/punks/1848.png',
      },
    },
  },
  2: {
    id: '2',
    origin: 'https://www.nft-collector.io',
    time: 1,
    type: ApprovalType.WatchAsset,
    requestData: {
      asset: {
        address: '0xC8c77482e45F1F44dE1745F52C74426C631bDD51',
        name: 'Legends of the Dance Floor',
        tokenId: '1',
        standard: 'ERC721',
        image: 'https://www.miladymaker.net/milady/736.png',
      },
    },
  },
};

const store = configureStore({
  metamask: {
    ...mockState.metamask,
    pendingApprovals: {
      1: Object.values(pendingNftApprovals)[0],
    },
  },
});

export default {
  title: 'Pages/ConfirmAddSuggestedNFT',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = () => <ConfirmAddSuggestedNFT />;
DefaultStory.storyName = 'Default';

export const WithMultipleSuggestedNFTs = () => <ConfirmAddSuggestedNFT />;
const WithDuplicateAddressStore = configureStore({
  metamask: {
    ...mockState.metamask,
    pendingApprovals: pendingNftApprovals,
  },
});
WithMultipleSuggestedNFTs.decorators = [
  (story) => <Provider store={WithDuplicateAddressStore}>{story()}</Provider>,
];
