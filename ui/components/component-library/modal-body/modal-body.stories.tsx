import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  BackgroundColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { Text } from '..';
import README from './README.mdx';
import { ModalBody } from './modal-body';

const meta: Meta<typeof ModalBody> = {
  title: 'Components/ComponentLibrary/ModalBody',
  component: ModalBody,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
  args: {
    className: '',
    children: 'Modal Body',
  },
};

export default meta;
type Story = StoryObj<typeof ModalBody>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

export const Children: Story = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Nullam id dolor id nibh ultricies vehicula ut id elit. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla.',
  },
  render: (args) => (
    <div style={{ height: 100, width: 300 }}>
      <ModalBody {...args} />
    </div>
  ),
};

export const Padding: Story = {
  args: {
    paddingLeft: 0,
    paddingRight: 0,
    gap: 4,
    display: Display.Flex,
    flexDirection: FlexDirection.Column,
  },
  render: (args) => (
    <div style={{ height: 200, width: 300 }}>
      <ModalBody {...args}>
        <Text paddingLeft={4} paddingRight={4}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae
          elit libero, a pharetra augue. Nullam id
        </Text>
        <Text
          backgroundColor={BackgroundColor.primaryMuted}
          paddingLeft={4}
          paddingRight={4}
        >
          Element touches edge of ModalBody
        </Text>
        <Text paddingLeft={4} paddingRight={4}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae
          elit libero, a pharetra augue. Nullam id
        </Text>
      </ModalBody>
    </div>
  ),
};
