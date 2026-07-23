import type { Meta, StoryObj } from '@storybook/react';
import { MarketClosedModal } from './market-closed-modal';

const meta: Meta<typeof MarketClosedModal> = {
  title: 'Components/App/Assets/MarketClosedModal',
  component: MarketClosedModal,
  args: {
    isOpen: true,
    onClose: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof MarketClosedModal>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';
