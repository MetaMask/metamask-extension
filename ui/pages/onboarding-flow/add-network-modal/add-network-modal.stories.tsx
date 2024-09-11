import type { Meta, StoryObj } from '@storybook/react';
import AddNetworkModal from './index';

const meta: Meta<typeof AddNetworkModal> = {
  title: 'Pages/OnboardingFlow/AddNetworkModal',
  component: AddNetworkModal,
  argTypes: {
    showHeader: { control: 'boolean' },
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
    addNewNetwork: true,
    onEditNetwork: undefined,
    networkToEdit: undefined,
    prevActionMode: undefined,
    networkFormInformation: {},
    setNetworkFormInformation: () => null,
    onRpcUrlAdd: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AddNetworkModal>;

export const Default: Story = {
  args: {},
};

export const ShowHeader: Story = {
  args: {
    showHeader: true,
  },
};
