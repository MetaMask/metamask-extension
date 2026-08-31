import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { InlineEditableLabel } from './inline-editable-label';
import { InlineEditableLabelProps } from './inline-editable-label.types';

const InteractiveLabel = (args: InlineEditableLabelProps) => {
  const [value, setValue] = useState(args.value);

  return (
    <InlineEditableLabel
      {...args}
      value={value}
      onSave={async (newValue) => {
        setValue(newValue);
        await args.onSave?.(newValue);
      }}
    />
  );
};

const meta: Meta<typeof InlineEditableLabel> = {
  title: 'Components/MultichainAccounts/InlineEditableLabel',
  component: InlineEditableLabel,
  parameters: {
    docs: {
      description: {
        component:
          'Click-to-edit label used for renaming accounts and wallets inline.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Current label text',
    },
    onSave: {
      action: 'saved',
      description: 'Called with the trimmed new value when the user saves',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder shown while editing',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum input length',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables entering edit mode',
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the edit input',
    },
  },
  args: {
    value: 'Account 1',
    placeholder: 'Account name',
    maxLength: 50,
    ariaLabel: 'Edit account name',
    disabled: false,
    variant: TextVariant.BodyMd,
    color: TextColor.TextDefault,
    fontWeight: FontWeight.Medium,
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px', margin: '0 auto', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InlineEditableLabel>;

export const Default: Story = {
  render: (args) => <InteractiveLabel {...args} />,
};

export const Disabled: Story = {
  args: {
    value: 'Locked Account Name',
    disabled: true,
  },
};

export const LongName: Story = {
  render: (args) => <InteractiveLabel {...args} />,
  args: {
    value: 'This is a very long account name that may truncate',
  },
};
