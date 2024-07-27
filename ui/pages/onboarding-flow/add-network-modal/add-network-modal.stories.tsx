import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import AddNetworkModal from './index';

const meta: Meta<typeof AddNetworkModal> = {
  title: 'Components/OnboardingFlow/AddNetworkModal',
  component: AddNetworkModal,
  argTypes: {
    showHeader: { control: 'boolean' },
    isNewNetworkFlow: { control: 'boolean' },
    addNewNetwork: { control: 'boolean' },
    onEditNetwork: { action: 'onEditNetwork' },
    networkToEdit: { control: 'object' },
    onRpcUrlAdd: { action: 'onRpcUrlAdd' },
    prevActionMode: { control: 'text' },
    networkFormInformation: { control: 'object' },
    setNetworkFormInformation: { action: 'setNetworkFormInformation' },
  },
  args: {
    showHeader: false,
    isNewNetworkFlow: false,
    addNewNetwork: true,
    onEditNetwork: () => {},
    networkToEdit: null,
    onRpcUrlAdd: () => {},
    prevActionMode: null,
    networkFormInformation: {},
    setNetworkFormInformation: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AddNetworkModal>;

export const DefaultStory: Story = {
  args: {
    showHeader: false,
    isNewNetworkFlow: false,
    addNewNetwork: true,
    onEditNetwork: () => {},
    networkToEdit: null,
    onRpcUrlAdd: () => {},
    prevActionMode: null,
    networkFormInformation: {},
    setNetworkFormInformation: () => {},
  },
};
