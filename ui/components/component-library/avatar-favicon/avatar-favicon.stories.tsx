import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { BorderColor } from '../../../helpers/constants/design-system';

import { AvatarFavicon } from './avatar-favicon';
import { AvatarFaviconSize } from './avatar-favicon.types';

export default {
  title: 'Components/ComponentLibrary/AvatarFavicon (deprecated)',
  component: AvatarFavicon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`AvatarFavicon` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-avatarfavicon--docs) instead. See the [Migration Guide](https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#from-extension-component-library) for extension migration guidance.',
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
