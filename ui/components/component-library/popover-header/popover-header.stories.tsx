import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

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

export default {
  title: 'Components/ComponentLibrary/PopoverHeader',
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
} as ComponentMeta<typeof PopoverHeader>;

const Template: ComponentStory<typeof PopoverHeader> = (args) => {
  return <PopoverHeader {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: ComponentStory<typeof PopoverHeader> = (args) => (
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
);

export const OnBack = Template.bind({});
OnBack.args = {
  children: 'OnBack demo',
};

export const OnClose = Template.bind({});
OnClose.args = {
  children: 'OnClose demo',
};

export const StartAccessory = Template.bind({});
StartAccessory.args = {
  children: 'StartAccessory demo',
  startAccessory: <Button size={ButtonSize.Sm}>Demo</Button>,
};

export const EndAccessory = Template.bind({});
EndAccessory.args = {
  children: 'EndAccessory demo',
  endAccessory: <Button size={ButtonSize.Sm}>Demo</Button>,
};
