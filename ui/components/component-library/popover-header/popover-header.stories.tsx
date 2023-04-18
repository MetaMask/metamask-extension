import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { BUTTON_SIZES, Button } from '..';
import { PopoverHeader } from './popover-header';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/PopoverHeader',
  component: PopoverHeader,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    onBack: { action: 'onBack' },
    onClose: { action: 'onClose' },
  },
  args: {
    children: 'PopoverHeader',
  },
} as ComponentMeta<typeof PopoverHeader>;

const Template: ComponentStory<typeof PopoverHeader> = (args) => {
  return <PopoverHeader {...args}>PopoverHeader</PopoverHeader>;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Children: ComponentStory<typeof PopoverHeader> = (args) => (
  <PopoverHeader {...args} />
);

Children.args = {
  children: 'PopoverHeader Title',
};

export const OnBack: ComponentStory<typeof PopoverHeader> = (args) => (
  <PopoverHeader {...args}>OnBack Demo</PopoverHeader>
);

export const OnClose: ComponentStory<typeof PopoverHeader> = (args) => (
  <PopoverHeader {...args}>OnClose Demo</PopoverHeader>
);

export const StartAccessory: ComponentStory<typeof PopoverHeader> = (args) => (
  <PopoverHeader
    startAccessory={<Button size={BUTTON_SIZES.SM}>Demo</Button>}
    {...args}
  >
    StartAccessory
  </PopoverHeader>
);

export const EndAccessory: ComponentStory<typeof PopoverHeader> = (args) => (
  <PopoverHeader
    endAccessory={<Button size={BUTTON_SIZES.SM}>Demo</Button>}
    {...args}
  >
    EndAccessory
  </PopoverHeader>
);
