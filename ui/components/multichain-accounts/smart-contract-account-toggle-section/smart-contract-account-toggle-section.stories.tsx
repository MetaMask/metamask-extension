import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SmartContractAccountToggleSection } from './smart-contract-account-toggle-section';

const meta: Meta<typeof SmartContractAccountToggleSection> = {
  title: 'Components/MultichainAccounts/SmartContractAccountToggleSection',
  component: SmartContractAccountToggleSection,
  argTypes: {
    address: {
      control: 'text',
      description: 'The account address to display smart contract toggles for.',
    },
    returnToPage: {
      control: 'text',
      description: 'Optional page path to return to after a transaction.',
    },
  },
  args: {
    address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
    returnToPage: undefined,
  },
};

export default meta;
type Story = StoryObj<typeof SmartContractAccountToggleSection>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';
