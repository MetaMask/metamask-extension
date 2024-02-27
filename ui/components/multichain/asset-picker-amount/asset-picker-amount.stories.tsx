import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import { DraftTransaction } from '../../../ducks/send';
import { AssetType } from '../../../../shared/constants/transaction';
import mockState from '../../../../test/data/mock-state.json';
import { AssetPickerAmount } from './asset-picker-amount';
import { INSUFFICIENT_FUNDS_ERROR_KEY } from '../../../helpers/constants/error-keys';

const noop = () => {};

const storybook = {
  title: 'Components/Multichain/AssetPickerAmount',
  component: AssetPickerAmount,
};
export default storybook;

export const DefaultStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={noop}
      onAssetChange={noop}
      amount={{ value: '100' }}
      asset={{ type: AssetType.native, balance: '100' }}
    />
  </div>
);
DefaultStory.storyName = 'Default';

export const TokenStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={noop}
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.token,
        balance: '0xfff',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'YFI',
        },
      }}
    />{' '}
  </div>
);
TokenStory.storyName = 'ERC20 Token';
TokenStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

export const NFTStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={noop}
      onAssetChange={noop}
      amount={{ value: '0xff' }}
      asset={{
        type: AssetType.NFT,
        balance: '0xfff',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'BAYC',
          isERC721: true,
          tokenId: 1,
        },
      }}
    />{' '}
  </div>
);
NFTStory.storyName = 'ERC721 Token';

export const TokenStoryWithLargeNameAndValue = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={noop}
      onAssetChange={noop}
      amount={{ value: '0x1ED09BEAD87C0378D8E6400000000' }}
      asset={{
        type: AssetType.token,
        balance: '0x1ED0',
        details: {
          address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          symbol: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
          isERC721: false,
        },
      }}
    />
  </div>
);
TokenStoryWithLargeNameAndValue.storyName =
  'ERC20 Token with large name and value';
TokenStoryWithLargeNameAndValue.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

export const ErrorStory = () => (
  <div style={{ width: '400px' }}>
    <AssetPickerAmount
      onAmountChange={noop}
      onAssetChange={noop}
      amount={{ error: INSUFFICIENT_FUNDS_ERROR_KEY, value: '100' }}
      asset={{ type: AssetType.native, balance: '0' }}
    />{' '}
  </div>
);
ErrorStory.storyName = 'Error';
ErrorStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

function store() {
  return configureStore({
    ...mockState,
    send: {
      currentTransactionUUID: 'uuid',
    },
  });
}
