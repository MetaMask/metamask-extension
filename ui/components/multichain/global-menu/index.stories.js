import React from 'react';
import { GlobalMenu } from '.';

export default {
  title: 'Components/Multichain/GlobalMenu',
  component: GlobalMenu,
  argTypes: {
    closeMenu: {
      action: 'closeMenu',
    },
  },
  args: {
    closeMenu: () => console.log('Closing menu!'),
  },
};

export const DefaultStory = (args) => <GlobalMenu {...args} />;
DefaultStory.storyName = 'Default';
