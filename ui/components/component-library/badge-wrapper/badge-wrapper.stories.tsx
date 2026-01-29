import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import {
  BorderColor,
} from '../../../helpers/constants/design-system';

import {
  BadgeWrapperAnchorElementShape,
  BadgeWrapperPosition,
} from './badge-wrapper.types';

import { BadgeWrapper } from './badge-wrapper';
import { AvatarNetwork, AvatarNetworkSize } from '../avatar-network';
import { AvatarAccount } from '@metamask/design-system-react';

export default {
  tags: ['autodocs'],
  title: 'Components/ComponentLibrary/BadgeWrapper (deprecated)',
  component: BadgeWrapper,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    badge: {
      control: 'text',
    },
    position: {
      options: Object.values(BadgeWrapperPosition),
      control: 'select',
    },
    positionObj: {
      control: 'object',
    },
    anchorElementShape: {
      options: Object.values(BadgeWrapperAnchorElementShape),
      control: 'select',
    },
    className: {
      control: 'text',
    },
  },
} as ComponentMeta<typeof BadgeWrapper>;

const Template: ComponentStory<typeof BadgeWrapper> = (args) => (
  <BadgeWrapper
    badge={
      <AvatarNetwork
        size={AvatarNetworkSize.Xs}
        name="Avalanche"
        src="./images/avax-token.svg"
        borderColor={BorderColor.borderMuted}
      />
    }
    {...args}
  >
    {args.children ? (
      args.children
    ) : (
      <AvatarAccount address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1" />
    )}
  </BadgeWrapper>
);

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
