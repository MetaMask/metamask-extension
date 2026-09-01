import type { Meta, StoryObj } from '@storybook/react';
import { BalanceEmptyState } from './balance-empty-state';

const meta: Meta<typeof BalanceEmptyState> = {
  title: 'Components/App/BalanceEmptyState',
  component: BalanceEmptyState,
};

export default meta;
type Story = StoryObj<typeof BalanceEmptyState>;

export const Default: Story = {};
