import React from 'react';
import { Provider } from 'react-redux';
import { Asset } from '../../../../ducks/send';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPickerModal } from './asset-picker-modal';

const storybook = {
  title: 'Components/Multichain/AssetPickerModal',
  component: AssetPickerModal,
};

const props = {
  isOpen: true,
  onClose: () => ({}),
  asset: {
    balance: null,
    details: null,
    error: null,
    type: AssetType.token,
  } as unknown as Asset,
};
export const DefaultStory = () => <AssetPickerModal {...props} />;

DefaultStory.storyName = 'Default';

export const TokenStory = () => <AssetPickerModal {...props} />;

TokenStory.storyName = 'Modal With Balance';

function store() {
  return configureStore(mockState);
}

TokenStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

export default storybook;
