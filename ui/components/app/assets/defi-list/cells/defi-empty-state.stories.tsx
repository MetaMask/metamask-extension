import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DeFiEmptyStateMessage } from './defi-empty-state';

const meta: Meta<typeof DeFiEmptyStateMessage> = {
  title: 'Components/App/Assets/DeFi/DeFiEmptyStateMessage',
  component: DeFiEmptyStateMessage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
