import React from 'react';
import { GlobalMenu } from '.';

export default {
  title: 'Components/Multichain/GlobalMenu',
  component: GlobalMenu,
  argTypes: {
    closeMenu: {
      action: 'closeMenu',
    },
    anchorElement: {
      control: 'func',
    },
  },
  args: {
    closeMenu: () => undefined,
    anchorElement: null,
  },
};

export const DefaultStory = (args) => <GlobalMenu {...args} />;
DefaultStory.storyName = 'Default';
