import React from 'react';
import Identicon from '../../components/ui/identicon/identicon.component';
import TokenDetailsScreen from '.';

export default {
  title: 'Pages/TokenDetails',
  id: __filename,
  argTypes: {
    address: { control: 'text' },
    onClose: { action: 'onClose' },
    onHideToken: { action: 'onHideToken' },
    value: { control: 'text' },
    icon: { control: 'object' },
    currentCurrency: { control: 'text' },
    decimals: { control: 'number' },
    network: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  return <TokenDetailsScreen {...args} />;
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
