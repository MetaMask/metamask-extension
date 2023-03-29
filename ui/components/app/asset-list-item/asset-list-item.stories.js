import React from 'react';
import AssetListItem from '.';

export default {
  title: 'Components/App/AssetListItem',
  argTypes: {
    className: {
      control: 'text',
    },
    iconClassName: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
    tokenAddress: {
      control: 'text',
    },
    tokenSymbol: {
      control: 'text',
    },
    tokenDecimals: {
      control: 'number',
    },
    tokenImage: {
      control: 'text',
    },
    warning: {
      control: 'text',
    },
    primary: {
      control: 'text',
    },
    secondary: {
      control: 'text',
    },
    identiconBorder: {
      control: 'boolean',
    },
    isERC721: {
      control: 'boolean',
    },
  },
  args: {
    tokenAddress: '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
    tokenSymbol: 'ETH',
    tokenImage: './images/eth_logo.svg',
    identiconBorder: true,
  },
};

export const DefaultStory = (args) => <AssetListItem {...args} />;

DefaultStory.storyName = 'Default';
