import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@metamask/design-system-react';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import EditableLabel from '.';

const meta = {
  title: 'Components/UI/EditableLabel',
  component: EditableLabel,
  argTypes: {
    onSubmit: {
      action: 'onSubmit',
    },
    defaultValue: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    accounts: {
      control: 'array',
    },
  },
  args: {
    onSubmit: () => Promise.resolve(),
    defaultValue: 'Account 3',
    accounts: [
      createMockInternalAccount({ name: 'Account 1' }),
      createMockInternalAccount({ name: 'Account 2' }),
    ],
  },
} satisfies Meta<typeof EditableLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultStory: Story = {
  name: 'Default',
  render: (args) => (
    <Box className="relative w-[335px]">
      <EditableLabel {...args} />
    </Box>
  ),
};
