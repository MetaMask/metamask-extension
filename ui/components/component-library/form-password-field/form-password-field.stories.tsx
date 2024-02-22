import { useArgs } from '@storybook/client-api';
import { Meta, StoryFn } from '@storybook/react';
import React from 'react';


import {
  FormPasswordField
} from '.';

export default {
  title: 'Components/ComponentLibrary/FormPasswordField',
  component: FormPasswordField,
  argTypes: {
    value: {
      control: {
        type: 'text',
      },
    },
    onChange: {
      action: 'changed',
    },
  },
  args: {
    placeholder: 'password',
    label: 'Password',
    id: 'form-password-field',
    helpText: 'Help password',
    value: '',
  },
} as Meta<typeof FormPasswordField>;

export const DefaultStory: StoryFn<typeof FormPasswordField> = (args) => {

  const [{ value = '' }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <FormPasswordField {...args} value={value} onChange={handleOnChange} />;
};
DefaultStory.storyName = 'Default';
