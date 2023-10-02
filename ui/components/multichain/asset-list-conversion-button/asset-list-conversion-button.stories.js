import React from 'react';
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
    onClose: () => undefined,
  },
};

export const DefaultStory = (args) => <AssetListConversionButton {...args} />;
DefaultStory.storyName = 'Default';

export const ReceiveStory = (args) => (
  <AssetListConversionButton {...args} variant="receive" />
);
ReceiveStory.storyName = 'Receive';
