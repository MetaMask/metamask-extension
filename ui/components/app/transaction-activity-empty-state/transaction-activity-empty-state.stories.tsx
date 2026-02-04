import type { Meta, StoryObj } from '@storybook/react';
import { TransactionActivityEmptyState } from './transaction-activity-empty-state';

const meta: Meta<typeof TransactionActivityEmptyState> = {
  title: 'Components/App/TransactionActivityEmptyState',
  component: TransactionActivityEmptyState,
};

export default meta;
type Story = StoryObj<typeof TransactionActivityEmptyState>;

export const Default: Story = {};
