import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  BorderColor,
} from '../../../helpers/constants/design-system';
import { AvatarNetworkSize } from './avatar-network.types';

import { AvatarNetwork } from './avatar-network';

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/AvatarNetwork (deprecated)',
  component: AvatarNetwork,
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
      options: Object.values(AvatarNetworkSize),
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
    name: 'Arbitrum One',
    src: './images/arbitrum.svg',
    size: AvatarNetworkSize.Md,
    showHalo: false,
  },
} as Meta<typeof AvatarNetwork>;

const Template: StoryFn<typeof AvatarNetwork> = (args) => {
  return <AvatarNetwork {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
