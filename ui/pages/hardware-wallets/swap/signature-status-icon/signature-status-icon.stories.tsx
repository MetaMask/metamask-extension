import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import SignatureStatusIcon from '.';
import { SignatureStepStatus } from '../types';

const meta: Meta<typeof SignatureStatusIcon> = {
  title: 'Pages/HardwareWallets/Swap/SignatureStatusIcon',
  component: SignatureStatusIcon,
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(SignatureStepStatus),
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignatureStatusIcon>;

export const Pending: Story = {
  args: {
    status: SignatureStepStatus.Pending,
    stepNumber: 1,
  },
};

export const Active: Story = {
  args: {
    status: SignatureStepStatus.Active,
    stepNumber: 1,
  },
};

export const Complete: Story = {
  args: {
    status: SignatureStepStatus.Complete,
    stepNumber: 1,
  },
};

export const Rejected: Story = {
  args: {
    status: SignatureStepStatus.Rejected,
    stepNumber: 1,
  },
};
