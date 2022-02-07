import React from 'react';
import Password from '.';

export default {
  title: 'Components/UI/Password',
  id: __filename,
  component: Password,
  argTypes: {
    clearClipboardOnPaste: { control: 'boolean' },
    placeholder: { control: 'text' },
    onChange: { action: 'onChange' },
    showPassword: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: {
    value: '',
  },
};

const Template = (args) => <Password {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
