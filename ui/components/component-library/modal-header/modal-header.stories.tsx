import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import {
  TextVariant,
  TextAlign,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { AvatarAccount, ButtonSize, Button, Text } from '..';

import { ModalHeader } from './modal-header';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/ModalHeader',
  component: ModalHeader,
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
    children: 'ModalHeader',
  },
} as Meta<typeof ModalHeader>;

const Template: StoryFn<typeof ModalHeader> = (args) => {
  return <ModalHeader {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: StoryFn<typeof ModalHeader> = (args) => (
  <>
    <ModalHeader {...args} marginBottom={4}>
      Children as string
    </ModalHeader>
    <ModalHeader
      {...args}
      childrenWrapperProps={{
        display: Display.Flex,
        flexDirection: FlexDirection.Column,
        alignItems: AlignItems.center,
        justifyContent: JustifyContent.center,
      }}
    >
      <AvatarAccount address="0x1234" />
      <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
        Custom header using multiple components
      </Text>
    </ModalHeader>
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
