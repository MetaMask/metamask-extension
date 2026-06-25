import React from 'react';
import { useArgs } from '@storybook/client-api';
import type { Meta } from '@storybook/react';

import { TextFieldSize, TextFieldType } from '../text-field';

import { TextFieldSearch } from './text-field-search';

const meta: Meta<typeof TextFieldSearch> = {
  title: 'Components/ComponentLibrary/TextFieldSearch (deprecated)',
  component: TextFieldSearch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the `TextFieldSearch` component from `@metamask/design-system-react` instead.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
    },
    onChange: {
      action: 'onChange',
    },
    clearButtonOnClick: {
      action: 'clearButtonOnClick',
    },
    clearButtonProps: {
      control: 'object',
    },
    autoComplete: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    autoFocus: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    className: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    disabled: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    error: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    id: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    inputProps: {
      control: 'object',
      table: { category: 'text field base props' },
    },
    startAccessory: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    maxLength: {
      control: 'number',
      table: { category: 'text field base props' },
    },
    name: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    onBlur: {
      action: 'onBlur',
      table: { category: 'text field base props' },
    },
    onClick: {
      action: 'onClick',
      table: { category: 'text field base props' },
    },
    onFocus: {
      action: 'onFocus',
      table: { category: 'text field base props' },
    },
    onKeyDown: {
      action: 'onKeyDown',
      table: { category: 'text field base props' },
    },
    onKeyUp: {
      action: 'onKeyUp',
      table: { category: 'text field base props' },
    },
    placeholder: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    readOnly: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    required: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
    endAccessory: {
      control: 'text',
      table: { category: 'text field base props' },
    },
    size: {
      control: 'select',
      options: Object.values(TextFieldSize),
      table: { category: 'text field base props' },
    },
    type: {
      control: 'select',
      options: Object.values(TextFieldType),
      table: { category: 'text field base props' },
    },
    truncate: {
      control: 'boolean',
      table: { category: 'text field base props' },
    },
  },
  args: {
    placeholder: 'Search',
    value: '',
  },
};

export default meta;

const Template = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  const handleOnClear = () => {
    updateArgs({ value: '' });
  };
  return (
    <TextFieldSearch
      {...args}
      value={value}
      onChange={handleOnChange}
      clearButtonOnClick={handleOnClear}
    />
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
