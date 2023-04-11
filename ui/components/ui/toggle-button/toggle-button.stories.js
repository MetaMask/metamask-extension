import React from 'react';
import { useArgs } from '@storybook/client-api';
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
  const [{ value }, updateArgs] = useArgs();
  const handleOnToggle = () => {
    updateArgs({ value: !value });
  };
  return <ToggleButton {...args} value={value} onToggle={handleOnToggle} />;
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  value: false,
  offLabel: 'off',
  onLabel: 'on',
  disabled: false,
};
