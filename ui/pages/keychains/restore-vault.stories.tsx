import type { Meta, StoryObj } from '@storybook/react';
import RestoreVaultPage from './restore-vault';

const meta: Meta<typeof RestoreVaultPage> = {
  title: 'Pages/Keychains/RestoreVaultPage',
  component: RestoreVaultPage,
  argTypes: {
    createNewVaultAndRestore: { action: 'createNewVaultAndRestore' },
    leaveImportSeedScreenState: { action: 'leaveImportSeedScreenState' },
    navigate: { control: 'function' },
    isLoading: { control: 'boolean' },
  },
  args: {
    createNewVaultAndRestore: () => {},
    leaveImportSeedScreenState: () => {},
    navigate: () => {},
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof RestoreVaultPage>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';
