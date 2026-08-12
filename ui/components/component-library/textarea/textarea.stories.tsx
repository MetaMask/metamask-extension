import React, { ChangeEvent } from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { useArgs } from '@storybook/client-api';

import { Textarea } from './textarea';

export default {
  title: 'Components/ComponentLibrary/Textarea (deprecated)',
  component: Textarea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the Textarea component from @metamask/design-system-react instead.',
      },
    },
  },
  argTypes: {
    autoFocus: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
    cols: {
      control: 'number',
    },
    defaultValue: {
      control: 'text',
    },
    isDisabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
    id: {
      control: 'text',
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
    rows: {
      control: 'number',
    },
    value: {
      control: 'text',
    },
  },
  args: {
    placeholder: 'Placeholder...',
  },
} as Meta<typeof Textarea>;

const Template: StoryFn<typeof Textarea> = (args) => {
  const [{ value }, updateArgs] = useArgs();
  const handleOnChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateArgs({ value: e.target.value });
  };
  return <Textarea {...args} value={value} onChange={handleOnChange} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
