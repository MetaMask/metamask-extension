import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import README from './README.mdx';
import { PopoverHeader } from '.';

export default {
  title: 'Components/ComponentLibrary/PopoverHeader',
  component: PopoverHeader,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {
    children: 'PopoverHeader',
  },
} as ComponentMeta<typeof PopoverHeader>;

const Template: ComponentStory<typeof PopoverHeader> = (args) => {
  return (
    <PopoverHeader
      onBack={() => console.log('back')}
      onClose={() => console.log('close')}
      backButtonProps={{ 'data-testid': 'back' }}
      {...args}
    >
      PopoverHeader
    </PopoverHeader>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
