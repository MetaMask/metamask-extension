import React from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../store/store';
import SmartTransactionStatusPage from './smart-transaction-status-page';
import { Meta, StoryObj } from '@storybook/react';
import { SimulationData } from '@metamask/transaction-controller';
import { mockNetworkState } from '../../../../test/stub/networks';

// Mock data
const CHAIN_ID_MOCK = '0x1';

const simulationData: SimulationData = {
  nativeBalanceChange: {
    previousBalance: '0x0',
    newBalance: '0x0',
    difference: '0x12345678912345678',
    isDecrease: true,
  },
  tokenBalanceChanges: [],
};

const TX_MOCK = {
  id: 'txId',
  simulationData,
  chainId: CHAIN_ID_MOCK,
};

const storeMock = configureStore({
  metamask: {
    preferences: {
      useNativeCurrencyAsPrimaryCurrency: false,
    },
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
    transactions: [TX_MOCK],
    currentNetworkTxList: [TX_MOCK],
  },
});

const meta: Meta<typeof SmartTransactionStatusPage> = {
  title: 'Pages/SmartTransactions/SmartTransactionStatusPage',
  component: SmartTransactionStatusPage,
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
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

export const Success: Story = {
  args: {
    requestState: {
      smartTransaction: {
        status: 'success',
        creationTime: Date.now() - 60000, // 1 minute ago
        uuid: 'uuid-success',
        chainId: '0x1',
      },
      isDapp: false,
      txId: 'txId-success',
    },
    onCloseExtension: () => {},
    onViewActivity: () => {},
  },
};

export const Failed: Story = {
  args: {
    requestState: {
      smartTransaction: {
        status: 'unknown',
        creationTime: Date.now() - 180000, // 3 minutes ago
        uuid: 'uuid-failed',
        chainId: '0x1',
      },
      isDapp: false,
      txId: 'txId-failed',
    },
    onCloseExtension: () => {},
    onViewActivity: () => {},
  },
};
