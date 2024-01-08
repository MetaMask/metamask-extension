import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { DraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import mockState from '../../../../test/data/mock-state.json';
import { AssetPickerAmount } from './asset-picker-amount';

const storybook = {
  title: 'Components/Multichain/AssetPickerAmount',
  component: AssetPickerAmount,
};
export default storybook;

export const DefaultStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount />
  </div>
);
DefaultStory.storyName = 'Default';

export const TokenStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount />
  </div>
);
TokenStory.storyName = 'ERC20 Token';
TokenStory.decorators = [
  (story) => (
    <Provider
      store={store({
        amount: { value: '0xff' },
        asset: {
          type: AssetType.token,
          balance: '0xfff',
          details: {
            address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol: 'YFI',
          },
        },
      } as DraftTransaction)}
    >
      {story()}
    </Provider>
  ),
];

export const NFTStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount />
  </div>
);
NFTStory.storyName = 'ERC721 Token';
NFTStory.decorators = [
  (story) => (
    <Provider
      store={store({
        amount: { value: '0xff' },
        asset: {
          type: AssetType.NFT,
          balance: '0xfff',
          details: {
            address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol: 'BAYC',
            isERC721: true,
            tokenId: 1,
          },
        },
      })}
    >
      {story()}
    </Provider>
  ),
];

export const TokenStoryWithLargeNameAndValue = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount />
  </div>
);
TokenStoryWithLargeNameAndValue.storyName =
  'ERC20 Token with large name and value';
TokenStoryWithLargeNameAndValue.decorators = [
  (story) => (
    <Provider
      store={store({
        amount: { value: '0x1ED09BEAD87C0378D8E6400000000' },
        asset: {
          type: AssetType.native,
          balance: '0x1ED0',
          details: {
            address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            symbol: 'BAYC',
            isERC721: false,
          },
        },
      } as DraftTransaction)}
    >
      {story()}
    </Provider>
  ),
];

export const ErrorStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount />
  </div>
);
ErrorStory.storyName = 'Error';
ErrorStory.decorators = [
  (story) => (
    <Provider
      store={store({
        asset: { type: AssetType.native },
        amount: { error: 'insufficientFunds' },
      })}
    >
      {story()}
    </Provider>
  ),
];

function store(tx: DraftTransaction) {
  return configureStore({
    ...mockState,
    send: {
      currentTransactionUUID: 'uuid',
      draftTransactions: { uuid: tx },
    },
  });
}
