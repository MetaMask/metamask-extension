import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import UnitInput from './unit-input.component';

const meta: Meta<typeof UnitInput> = {
  title: 'Components/UI/UnitInput',
  component: UnitInput,
  argTypes: {
    className: {
      control: 'text',
    },
    dataTestId: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    actionComponent: {
      control: 'text',
    },
    error: {
      control: 'boolean',
    },
    onChange: {
      action: 'changed',
    },
    onBlur: {
      action: 'blurred',
    },
    placeholder: {
      control: 'text',
    },
    suffix: {
      control: 'text',
    },
    hideSuffix: {
      control: 'boolean',
    },
    value: {
      control: 'text',
    },
    keyPressRegex: {
      control: 'text',
    },
    isDisabled: {
      control: 'boolean',
    },
    isFocusOnInput: {
      control: 'boolean',
    },
  },
  args: {
    className: '',
    dataTestId: 'unit-input',
    children: '',
    actionComponent: '',
    error: false,
    placeholder: '0',
    suffix: '',
    hideSuffix: false,
    value: '',
    keyPressRegex: /^\d*(\.|,)?\d*$/u,
    isDisabled: false,
    isFocusOnInput: false,
  },
};

export default meta;
type Story = StoryObj<typeof UnitInput>;

// Default story for the UnitInput component
export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

// Story for the UnitInput component with an error state
export const WithError: Story = {
  args: {
    error: true,
  },
};

// Story for the UnitInput component with a suffix
export const WithSuffix: Story = {
  args: {
    suffix: 'ETH',
  },
};

// Story for the UnitInput component in a disabled state
export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

// Story for the UnitInput component with focus on input
export const FocusOnInput: Story = {
  args: {
    isFocusOnInput: true,
  },
};

// Story for the UnitInput component with a custom action component
export const WithActionComponent: Story = {
  args: {
    actionComponent: <button>Action</button>,
  },
};

// Story for the UnitInput component with custom children
export const WithChildren: Story = {
  args: {
    children: <div>Custom Children</div>,
  },
};

// Story for the UnitInput component with a custom placeholder
export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Enter value',
  },
};

// Story for the UnitInput component with a custom keyPressRegex
export const WithCustomKeyPressRegex: Story = {
  args: {
    keyPressRegex: /^[a-zA-Z]*$/u,
  },
};
