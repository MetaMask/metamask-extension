import React from 'react';
import { IconName } from '../../component-library';
import { SelectActionModalItem } from '.';

export default {
  title: 'Components/Multichain/SelectActionModalItem',
  component: SelectActionModalItem,
  argTypes: {
    showIcon: {
      control: 'boolean',
    },
    primaryText: {
      control: 'text',
    },
    actionIcon: {
      control: 'text',
    },
    secondaryText: {
      control: 'text',
    },
    onClick: {
      action: 'onClick',
    },
  },
  args: {
    showIcon: true,
    primaryText: 'Buy',
    secondaryText: 'Buy crypto with MetaMask',
    actionIcon: IconName.Add,
  },
};

export const DefaultStory = (args) => <SelectActionModalItem {...args} />;

DefaultStory.storyName = 'Default';
