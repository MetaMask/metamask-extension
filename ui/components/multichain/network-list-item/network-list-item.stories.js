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
      action: 'onDeleteClick',
    },
    iconSrc: {
      action: 'text',
    },
  },
  args: {
    name: 'Ethereum',
    iconSrc: '',
    selected: false,
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
    <NetworkListItem {...args} />
  </div>
);
IconStory.args = { iconSrc: './images/matic-token.svg', name: 'Polygon' };

export const SelectedStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem {...args} />
  </div>
);
SelectedStory.args = { selected: true };

export const ChaosStory = (args) => (
  <div
    style={{ width: '328px', border: '1px solid var(--color-border-muted)' }}
  >
    <NetworkListItem {...args} />
  </div>
);
ChaosStory.args = {
  name: 'This is a super long network name that should be ellipsized',
  selected: true,
};
