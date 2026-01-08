import React from 'react';
import { PreferredAvatar } from './preferred-avatar';
import type { StoryObj } from '@storybook/react';

const ActionsData = {
  address: '0x7830c87C02e56AFf27FA8Ab1241711331FA86F43',
};

export default {
  title: 'Components/App/PreferredAvatar',
  component: PreferredAvatar,
  tags: ['autodocs'],
  args: {
    ...ActionsData,
  },
};

export const Default: StoryObj<typeof PreferredAvatar> = {
  args: {
    ...ActionsData,
  },
};
