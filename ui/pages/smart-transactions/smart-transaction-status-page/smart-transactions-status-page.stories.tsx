import React from 'react';
import SmartTransactionStatusPage from './smart-transaction-status-page';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SmartTransactionStatusPage> = {
  title: 'Pages/SmartTransactions/SmartTransactionStatusPage',
  component: SmartTransactionStatusPage,
};

export default meta;
type Story = StoryObj<typeof SmartTransactionStatusPage>;

export const Pending: Story = {
  args: {
    requestState: {
      smartTransaction: {
        status: 'pending',
        creationTime: Date.now(),
        uuid: 'uuid',
        chainId: '0x1',
      },
      isDapp: false,
      txId: 'txId',
    },
    onCloseExtension: () => {},
    onViewActivity: () => {},
  },
};
