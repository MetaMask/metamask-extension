import React from 'react';
import { Provider } from 'react-redux';
import { keccak } from 'ethereumjs-util';
import { cloneDeep } from 'lodash';
import { GasFeeContextProvider } from '../../../../contexts/gasFee';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../test/stub/networks';
import TransactionAlerts from '.';

const CHAIN_ID_MOCK = CHAIN_IDS.MAINNET;

const mockSelectedInternalAccount =
  getSelectedInternalAccountFromMockState(testData);

const customTransaction = ({
  estimateUsed,
  hasSimulationError,
  i = 0,
  ...props
} = {}) => {
  const tx = {
    simulationFails: Boolean(hasSimulationError),
    userFeeLevel: estimateUsed ? 'low' : 'medium',
    blockNumber: `${10902987 + i}`,
    id: 4678200543090545 + i,
    chainId: CHAIN_ID_MOCK,
    status: 'confirmed',
    time: 1600654021000,
    txParams: {
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
      gas: '0x5208',
      gasPrice: '0x147d357000',
      nonce: '0xf',
      to: mockSelectedInternalAccount.address,
      value: '0x63eb89da4ed00000',
      ...props?.txParams,
    },
    // '0x50be62ab1cabd03ff104c602c11fdef7a50f3d73c55006d5583ba97950ab1144',
    transactionCategory: 'incoming',
    ...props,
  };
  // just simulate hash if not provided
  if (!props?.hash) {
    tx.hash = `0x${keccak(Buffer.from(JSON.stringify(tx))).toString('hex')}`;
  }
  return tx;
};

// simulate gas fee state
const customStore = ({ supportsEIP1559, pendingCount = 0 } = {}) => {
  const data = cloneDeep({
    ...testData,
    metamask: {
      ...testData?.metamask,
      // supportsEIP1559
      ...mockNetworkState({
        chainId: CHAIN_ID_MOCK,
        metadata: {
          EIPS: {
            1559: Boolean(supportsEIP1559),
          },
        },
      }),
      // pendingTransactions
      featureFlags: {
        ...testData?.metamask?.featureFlags,
      },
      transactions: [
        ...testData.metamask.transactions,
        ...Array.from({ length: pendingCount }).map((_, i) =>
          customTransaction({ i, status: 'submitted' }),
        ),
      ],
    },
  });
  return configureStore(data);
};

export default {
  title: 'Confirmations/Components/TransactionAlerts',
  argTypes: {
    userAcknowledgedGasMissing: {
      control: 'boolean',
    },
  },
  args: {
    userAcknowledgedGasMissing: false,
    txData: {
      chainId: CHAIN_ID_MOCK,
      txParams: {
        value: '0x1',
      },
    },
  },
};

// show everything
export const DefaultStory = (args) => (
  <Provider
    store={customStore({
      isNetworkBusy: true,
      supportsEIP1559: true,
      pendingCount: 1,
    })}
  >
    <GasFeeContextProvider
      transaction={customTransaction({
        hasSimulationError: true,
        estimateUsed: true,
      })}
    >
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
DefaultStory.storyName = 'Default';
DefaultStory.args = {
  ...DefaultStory.args,
  txData: {
    chainId: CHAIN_ID_MOCK,
    txParams: {
      value: '0x0',
    },
    type: 'simpleSend',
  },
};

export const SimulationError = (args) => (
  <Provider store={customStore({ supportsEIP1559: true })}>
    <GasFeeContextProvider
      transaction={customTransaction({ hasSimulationError: true })}
    >
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
SimulationError.storyName = 'SimulationError';

export const SinglePendingTransaction = (args) => (
  <Provider store={customStore({ supportsEIP1559: true, pendingCount: 1 })}>
    <GasFeeContextProvider transaction={customTransaction()}>
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
SinglePendingTransaction.storyName = 'SinglePendingTransaction';

export const MultiplePendingTransactions = (args) => (
  <Provider store={customStore({ supportsEIP1559: true, pendingCount: 2 })}>
    <GasFeeContextProvider transaction={customTransaction()}>
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
MultiplePendingTransactions.storyName = 'MultiplePendingTransactions';

export const LowPriority = (args) => (
  <Provider store={customStore()}>
    <GasFeeContextProvider
      transaction={customTransaction({ estimateUsed: true })}
    >
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
LowPriority.storyName = 'LowPriority';

export const SendingZeroAmount = (args) => (
  <Provider store={customStore()}>
    <GasFeeContextProvider transaction={customTransaction()}>
      <TransactionAlerts {...args} />
    </GasFeeContextProvider>
  </Provider>
);
SendingZeroAmount.storyName = 'SendingZeroAmount';
SendingZeroAmount.args = {
  txData: {
    chainId: CHAIN_ID_MOCK,
    txParams: {
      value: '0x0',
    },
    type: 'simpleSend',
  },
};
