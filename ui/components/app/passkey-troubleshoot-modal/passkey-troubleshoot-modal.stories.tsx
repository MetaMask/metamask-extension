import type { Meta, StoryObj } from '@storybook/react-webpack5';
import PasskeyTroubleshootModal from './passkey-troubleshoot-modal';

const meta: Meta<typeof PasskeyTroubleshootModal> = {
  title: 'Components/App/PasskeyTroubleshootModal',
  component: PasskeyTroubleshootModal,
  args: {
    mode: 'unlock',
    location: 'unlock_page',
    onClose: () => undefined,
    onOpenFullScreen: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof PasskeyTroubleshootModal>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
