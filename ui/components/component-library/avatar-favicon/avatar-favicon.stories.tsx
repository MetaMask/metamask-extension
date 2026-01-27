import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import {
  BorderColor,
} from '../../../helpers/constants/design-system';

import { AvatarFavicon } from './avatar-favicon';
import { AvatarFaviconSize } from './avatar-favicon.types';

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/AvatarFavicon (deprecated)',
  component: AvatarFavicon,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarFaviconSize),
    },
    src: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
  },
  args: {
    src: 'https://uniswap.org/favicon.ico',
    size: AvatarFaviconSize.Md,
    name: 'Uniswap',
  },
} as Meta<typeof AvatarFavicon>;

const Template: StoryFn<typeof AvatarFavicon> = (args) => {
  return <AvatarFavicon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
