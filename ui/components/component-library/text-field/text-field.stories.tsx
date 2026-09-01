import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import { TextFieldSize, TextFieldType } from './text-field.types';
import { TextField } from './text-field';

export default {
  title: 'Components/ComponentLibrary/TextField (deprecated)',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use `TextField` from `@metamask/design-system-react` instead.',
      },
    },
  },
  argTypes: {
    autoComplete: {
      control: 'boolean',
    },
    autoFocus: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    defaultValue: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    id: {
      control: 'text',
    },
    inputProps: {
      control: 'object',
    },
    startAccessory: {
      control: 'text',
    },
    maxLength: {
      control: 'number',
    },
    name: {
      control: 'text',
    },
    onBlur: {
      action: 'onBlur',
    },
    onChange: {
      action: 'onChange',
    },
    onClick: {
      action: 'onClick',
    },
    onFocus: {
      action: 'onFocus',
    },
    placeholder: {
      control: 'text',
    },
    readOnly: {
      control: 'boolean',
    },
    required: {
      control: 'boolean',
    },
    endAccessory: {
      control: 'text',
    },
    size: {
      control: 'select',
      options: Object.values(TextFieldSize),
    },
    type: {
      control: 'select',
      options: Object.values(TextFieldType),
    },
    value: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Placeholder...',
  },
} as Meta<typeof TextField>;

const Template: StoryFn<typeof TextField> = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <TextField {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
DefaultStory.args = { value: '' };
