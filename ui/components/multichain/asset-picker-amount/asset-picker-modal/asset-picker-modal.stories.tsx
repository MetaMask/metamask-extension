import React from 'react';
import { Provider } from 'react-redux';
import { Asset } from '../../../../ducks/send';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { AssetType } from '../../../../../shared/constants/transaction';
import { AssetPickerModal } from './asset-picker-modal';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ERC20Asset } from './types';

const storybook = {
  title: 'Components/Multichain/AssetPickerModal',
  component: AssetPickerModal,
};

const props = {
  isOpen: true,
  onClose: () => ({}),
  asset: {
    address: '0xAddress',
    symbol: 'TOKEN',
    image: 'image.png',
    type: AssetType.token,
  } as ERC20Asset,
};
export const DefaultStory = () => {
  const t = useI18nContext();
  return (
    <AssetPickerModal
      header={t('sendSelectSendAsset')}
      onAssetChange={() => ({})}
      {...props}
    />
  );
};

DefaultStory.storyName = 'Default';

export const TokenStory = () => {
  const t = useI18nContext();
  return (
    <AssetPickerModal
      header={t('sendSelectSendAsset')}
      onAssetChange={() => ({})}
      {...props}
    />
  );
};

TokenStory.storyName = 'Modal With Balance';

function store() {
  return configureStore(mockState);
}

TokenStory.decorators = [
  (story) => <Provider store={store()}>{story()}</Provider>,
];

export default storybook;
