import React from 'react';
import { MultichainTokenListItem } from './multichain-token-list-item';

export default {
  title: 'Components/Multichain/MultichainTokenListItem',
  component: MultichainTokenListItem,
  argTypes: {
    tokenSymbol: {
      control: 'text',
    },
    tokenImage: {
      control: 'text',
    },
    primary: {
      control: 'text',
    },
    secondary: {
      control: 'text',
    },
    title: {
      control: 'text',
    },
  },
  args: {
    secondary: '$9.80 USD',
    primary: '0.006',
    tokenImage: './images/eth_logo.svg',
    tokenSymbol: 'ETH',
    title: 'Ethereum'
  },
};
const Template = (args) => {
  return <MultichainTokenListItem {...args} />;
};

export const DefaultStory = Template.bind({});

export const ChaosStory = (args) => (
  <div
    style={{ width: '336px', border: '1px solid var(--color-border-muted)' }}
  >
    <MultichainTokenListItem {...args} />
  </div>
);
ChaosStory.storyName = 'ChaosStory';

ChaosStory.args = {
  title: 'long Long Nameeeee',
  secondary: '$94556756776.80 USD',
  primary: '34449765768526.00',
};
