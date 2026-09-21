import type { Meta, StoryObj } from '@storybook/react-webpack5';
import PasskeyMigrationModal from './passkey-migration-modal';

const meta: Meta<typeof PasskeyMigrationModal> = {
  title: 'Components/App/PasskeyMigrationModal',
  component: PasskeyMigrationModal,
  args: {
    onReplacePasskey: () => undefined,
    onRemindMeLater: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof PasskeyMigrationModal>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
