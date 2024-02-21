import React from 'react';
import { ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES } from './asset-list-conversion-button';
import { AssetListConversionButton } from '.';

export default {
  title: 'Components/Multichain/AssetListConversionButton',
  component: AssetListConversionButton,
  argTypes: {
    variant: {
      control: 'text',
    },
  },
  args: {
    variant: 'buy',
    onClick: () => undefined,
  },
};

export const DefaultStory = (args) => <AssetListConversionButton {...args} />;
DefaultStory.storyName = 'Default';

export const ReceiveStory = (args) => (
  <AssetListConversionButton
    {...args}
    variant={ASSET_LIST_CONVERSION_BUTTON_VARIANT_TYPES.RECEIVE}
  />
);
ReceiveStory.storyName = 'Receive';
