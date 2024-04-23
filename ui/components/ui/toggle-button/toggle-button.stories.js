import React from 'react';
import README from './README.mdx';
import ToggleButton from './toggle-button.component';

export default {
  title: 'Components/UI/ToggleButton',
  component: ToggleButton,

  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    value: { control: 'boolean' },
    onToggle: { action: 'onToggle' },
    offLabel: { control: 'text' },
    onLabel: { control: 'text' },
    disabled: { control: 'boolean' },
  },
};

export const DefaultStory = (args) => {
  return <ToggleButton {...args} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  value: false,
  offLabel: 'off',
  onLabel: 'on',
  disabled: false,
};
