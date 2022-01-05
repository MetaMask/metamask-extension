import React from 'react';
import Identicon from '../identicon/identicon.component';
import TokenDetails from '.';

export default {
  title: 'Components/UI/TokenDetails',
  id: __filename,
  argTypes: {
    address: { control: 'text' },
    onClose: { action: 'Close token details page' },
    onHideToken: { action: 'Hide token' },
    value: { control: 'text' },
    icon: { control: 'object' },
    currentCurrency: { control: 'text' },
    decimals: { control: 'number' },
    network: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  return <TokenDetails {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  value: '200',
  icon: (
    <Identicon
      diameter={32}
      address="0x6b175474e89094c44da98b954eedeac495271d0f"
    />
  ),
  currentCurrency: '$200.09 USD',
  decimals: 18,
  network: 'Ethereum Mainnet',
};
