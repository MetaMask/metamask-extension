import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  TextVariant,
  TextAlign,
  DISPLAY,
  FLEX_DIRECTION,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';

import { PopoverHeader } from './popover-header';
import README from './README.mdx';
import { AvatarAccount } from '../avatar-account';
import { Button, ButtonSize } from '../button';

const meta: Meta<typeof PopoverHeader> = {
  component: PopoverHeader,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
    onBack: { action: 'onBack' },
    onClose: { action: 'onClose' },
  },
  args: {
    children: 'PopoverHeader',
  },
};

export default meta;
type Story = StoryObj<typeof PopoverHeader>;

export const DefaultStory: Story = {
  name: 'Default',
  render: (args) => {
    return <PopoverHeader {...args} />;
  },
};

export const Children: Story = {
  render: (args) => (
    <>
      <PopoverHeader {...args} marginBottom={4}>
        Children as string
      </PopoverHeader>
      <PopoverHeader
        {...args}
        childrenWrapperProps={{
          display: DISPLAY.FLEX,
          flexDirection: FLEX_DIRECTION.COLUMN,
          alignItems: AlignItems.center,
          justifyContent: JustifyContent.center,
        }}
      >
        <AvatarAccount address="0x1234" />
        <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
          Custom header using multiple components
        </Text>
      </PopoverHeader>
    </>
  ),
};

export const OnBack: Story = {
  args: {
    children: 'OnBack demo',
  },
};

export const OnClose: Story = {
  args: {
    children: 'OnClose demo',
  },
};

export const StartAccessory: Story = {
  args: {
    children: 'StartAccessory demo',
    startAccessory: <Button size={ButtonSize.Sm}>Demo</Button>,
  },
};

export const EndAccessory: Story = {
  args: {
    children: 'EndAccessory demo',
    endAccessory: <Button size={ButtonSize.Sm}>Demo</Button>,
  },
};
