import React from 'react';
import { Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import { Input } from './input';

export default {
  title: 'Components/ComponentLibrary/Input (deprecated)',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead. See the [Storybook Documentation](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-input--docs) for details.',
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
    value: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Placeholder...',
    value: '',
  },
} as Meta<typeof Input>;

const Template = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e) => {
    updateArgs({ value: e.target.value });
  };
  return <Input {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
