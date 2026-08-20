import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CreatePasswordForm } from '.';

const meta: Meta<typeof CreatePasswordForm> = {
  title: 'Pages/CreatePasswordForm',
  component: CreatePasswordForm,
  args: {
    isSocialLoginFlow: false,
    loading: false,
    onSubmit: async () => undefined,
    onBack: () => undefined,
  },
  argTypes: {
    isSocialLoginFlow: { control: 'boolean' },
    loading: { control: 'boolean' },
    onSubmit: { action: 'onSubmit' },
    onBack: { action: 'onBack' },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px', height: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreatePasswordForm>;

export const Default: Story = {};
