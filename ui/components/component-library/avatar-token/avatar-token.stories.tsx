import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { BorderColor } from '../../../helpers/constants/design-system';
import { AvatarToken } from './avatar-token';
import { AvatarTokenSize } from './avatar-token.types';

export default {
  title: 'Components/ComponentLibrary/AvatarToken (deprecated)',
  component: AvatarToken,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AvatarTokenSize),
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
    },
    name: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    name: 'eth',
    src: './images/eth_logo.svg',
    size: AvatarTokenSize.Md,
    showHalo: false,
  },
} as Meta<typeof AvatarToken>;

const Template: StoryFn<typeof AvatarToken> = (args) => {
  return <AvatarToken {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
