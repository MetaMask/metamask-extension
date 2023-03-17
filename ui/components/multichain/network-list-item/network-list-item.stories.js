import React from 'react';
import { NetworkListItem } from '.';

export default {
  title: 'Components/Multichain/NetworkListItem',
  component: NetworkListItem,
  argTypes: {
    name: {
      control: 'text',
    },
    selected: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
    },
    onDeleteClick: {
      action: 'onClick',
    },
    iconSrc: {
      action: 'text',
    },
  },
  args: {
    name: 'Ethereum',
    iconSrc: '',
    selected: false,
    onClick: () => console.log('Network click!'),
  },
};

export const DefaultStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem {...args} />
  </div>
);

export const IconStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem
      {...args}
      iconSrc="./images/matic-token.png"
      name="Polygon"
    />
  </div>
);

export const SelectedStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem {...args} selected />
  </div>
);

export const ChaosStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem
      {...args}
      name="This is a super long network name that should be ellipsized"
      selected
    />
  </div>
);
