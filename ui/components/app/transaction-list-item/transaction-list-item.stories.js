import React from 'react';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { Provider } from 'react-redux';
import { MOCK_TRANSACTION_BY_TYPE } from '../../../../.storybook/initial-states/transactions';
import configureStore from '../../../store/store';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { REDEEM_DELEGATIONS_SELECTOR } from '../../../../shared/lib/delegation/delegation';
import TransactionListItem from '.';

/**
 * @typedef {(import('../../selectors/transactions').TransactionGroup} TransactionGroup
 */

/**
 * @param {object} args
 * @returns {TransactionGroup}
 */
const getMockTransactionGroup = (args) => {
  const status = args['transactionGroup.primaryTransaction.status'];
  const submittedTime =
    args['transactionGroup.primaryTransaction.submittedTime'];
  const specificDataForTxParams =
    args['transactionGroup.primaryTransaction.txParams.data'];
  const basePrimaryTransaction = args['transactionGroup.primaryTransaction'];

  const tx = {
    ...basePrimaryTransaction, // Spread type, txParamsOriginal, and base txParams (like .from, .to, .value)
    status,
    submittedTime,
    txParams: {
      ...(basePrimaryTransaction.txParams || {}), // Start with txParams from basePrimaryTransaction
      data: specificDataForTxParams, // Override/set the data field
    },
  };

  return {
    hasCancelled: args['transactionGroup.hasCancelled'],
    hasRetried: args['transactionGroup.hasRetried'],
    nonce: '0x1',
    initialTransaction: tx,
    primaryTransaction: tx,
    transactions: [tx],
  };
};

/**
 * Transaction List Item Storybook Page
 *
 * Each page displays a different Transaction Type (TransactionType)
 * except TransactionType.cancel and TransactionType.retry as these two types
 * are never initialTransactions
 */
export default {
  title: 'Components/App/TransactionListItem',

  argTypes: {
    isEarliestNonce: { control: 'boolean' },
    'transactionGroup.hasCancelled': { control: 'boolean' },
    'transactionGroup.hasRetried': { control: 'boolean' },
    'transactionGroup.primaryTransaction.status': {
      options: Object.values(TransactionStatus)
        .filter((status) => {
          return status !== TransactionStatus.signed;
        })
        .sort(),
      control: { type: 'select' },
    },
    'transactionGroup.primaryTransaction.submittedTime': { control: 'number' },
    'transactionGroup.primaryTransaction': { control: 'object' },
    'transactionGroup.primaryTransaction.txParams': { control: 'object' },
    'transactionGroup.primaryTransaction.txParams.data': { control: 'text' },
  },
  args: {
    isEarliestNonce: true,
    'transactionGroup.hasCancelled': false,
    'transactionGroup.hasRetried': false,
    'transactionGroup.primaryTransaction.status': TransactionStatus.pending,
    'transactionGroup.primaryTransaction.submittedTime': 19999999999999,
    'transactionGroup.primaryTransaction.txParams.data':
      '0xa9059cbb000000000000000000000000b19ac54efa18cc3a14a5b821bfec73d284bf0c5e0000000000000000000000000000000000000000000000003782dace9d900000',
  },
};

const Template = (args) => {
  const transactionGroup = getMockTransactionGroup(args);
  return (
    <TransactionListItem
      transactionGroup={transactionGroup}
      isEarliestNonce={args.isEarliestNonce}
    />
  );
};

export const ContractInteraction = Template.bind({});
export const DeployContract = Template.bind({});
export const EthDecrypt = Template.bind({});
export const EthGetEncryptionPublicKey = Template.bind({});
export const Incoming = Template.bind({});
export const PersonalSign = Template.bind({});
export const Sign = Template.bind({});
export const SignTypeData = Template.bind({});
export const SimpleSend = Template.bind({});
export const Smart = Template.bind({});
export const Swap = Template.bind({});
export const BridgeSuccess = Template.bind({});
export const BridgePending = Template.bind({});
export const BridgeFailed = Template.bind({});
export const SwapApproval = Template.bind({});
export const TokenMethodApprove = Template.bind({});
export const TokenMethodSafeTransferFrom = Template.bind({});
export const TokenMethodTransfer = Template.bind({});
export const TokenMethodTransferFrom = Template.bind({});
export const RemoteModeTransaction = Template.bind({});

ContractInteraction.storyName = 'contractInteraction';
ContractInteraction.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.contractInteraction],
  },
};

DeployContract.storyName = 'contractDeployment';
DeployContract.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.deployContract],
  },
};

EthDecrypt.storyName = 'eth_decrypt';
EthDecrypt.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.ethDecrypt],
  },
};

EthGetEncryptionPublicKey.storyName = 'eth_getEncryptionPublicKey';
EthGetEncryptionPublicKey.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.ethGetEncryptionPublicKey],
  },
};

Incoming.storyName = 'incoming';
Incoming.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.incoming],
  },
};

PersonalSign.storyName = 'personal_sign';
PersonalSign.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.personalSign],
  },
};

Sign.storyName = 'sign';
Sign.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.sign],
  },
};

SignTypeData.storyName = 'eth_signTypedData';
SignTypeData.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.signTypedData],
  },
};

SimpleSend.storyName = 'simpleSend';
SimpleSend.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend],
  },
};

Smart.storyName = 'smart';
Smart.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.smart],
  },
};

Swap.storyName = 'swap';
Swap.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.swap],
  },
};

const configureBridgeStore = (status) =>
  configureStore(
    createBridgeMockStore({
      metamaskStateOverrides: {
        txHistory: {
          4243712234858467: {
            account: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            quote: {
              srcChainId: 1,
              srcAsset: {
                address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                decimals: 18,
                symbol: 'ETH',
              },
              destChainId: 10,
              destAsset: {},
            },
            status: {
              srcChain: {
                chainId: 1,
                txHash:
                  '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
              },
              destChain:
                status === 'FAILED'
                  ? undefined
                  : {
                      chainId: 59144,
                    },
              status,
            },
            txMetaId: 4243712234858467,
          },
        },
      },
    }),
  );

BridgeSuccess.storyName = 'bridgeSuccess';
BridgeSuccess.decorators = [
  (Story) => (
    <Provider store={configureBridgeStore('COMPLETE')}>
      <Story />
    </Provider>
  ),
];
BridgeSuccess.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.bridge],
  },
};

BridgePending.storyName = 'bridgePending';
BridgePending.decorators = [
  (Story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          metamaskStateOverrides: {
            txHistory: {
              4243712234858467: {
                account: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                quote: {
                  srcChainId: 1,
                  srcAsset: {
                    address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                    decimals: 18,
                    symbol: 'ETH',
                  },
                  destChainId: 10,
                  destAsset: {},
                },
                status: {
                  srcChain: {
                    txHash:
                      '0xbcb195f393f4468945b4045cd41bcdbc2f19ad75ae92a32cf153a3004e42009a',
                  },
                  destChain: {},
                  status: 'PENDING',
                },
                txMetaId: 4243712234858467,
              },
            },
          },
        }),
      )}
    >
      <Story />
    </Provider>
  ),
];
BridgePending.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.bridge],
  },
};

BridgeFailed.storyName = 'bridgeFailed';
BridgeFailed.decorators = [
  (Story) => (
    <Provider store={configureBridgeStore('FAILED')}>
      <Story />
    </Provider>
  ),
];
BridgeFailed.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.bridge],
  },
};

SwapApproval.storyName = 'swapApproval';
SwapApproval.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.swapApproval],
  },
};

TokenMethodApprove.storyName = 'approve';
TokenMethodApprove.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.tokenMethodApprove],
  },
};

TokenMethodSafeTransferFrom.storyName = 'safetransferfrom';
TokenMethodSafeTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.tokenMethodSafeTransferFrom],
  },
};

TokenMethodTransfer.storyName = 'transfer';
TokenMethodTransfer.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.tokenMethodTransfer],
  },
};

TokenMethodTransferFrom.storyName = 'transferfrom';
TokenMethodTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.tokenMethodTransferFrom],
  },
};

RemoteModeTransaction.storyName = 'remoteModeTransaction';
RemoteModeTransaction.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend], // Base properties from simpleSend
    type: TransactionType.simpleSend, // Explicitly set type
    txParams: {
      // Final txParams
      ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend].txParams, // Spread default simpleSend params first
      from: '0x1111111111111111111111111111111111111111', // Valid 'from' address (e.g., Gator address)
      to: '0x3333333333333333333333333333333333333333', // Explicitly set valid 'to' address
      // 'data' will be overridden by the specific argType below
    },
    txParamsOriginal: {
      ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend].txParams, // Spread default simpleSend params first
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4', // Valid original 'from' address (simulating selectedAccount.address)
      to: '0x3333333333333333333333333333333333333333', // Consistent valid 'to' address
    },
  },
  'transactionGroup.primaryTransaction.txParams.data': `${REDEEM_DELEGATIONS_SELECTOR}0000000000000000000000000000000000000000000000000000000000000000`,
  'transactionGroup.primaryTransaction.status': TransactionStatus.pending,
  'transactionGroup.hasCancelled': false,
  'transactionGroup.hasRetried': false,
  isEarliestNonce: true,
};

// New story for Remote Mode Gas Transaction
export const RemoteModeGasTransaction = Template.bind({});

RemoteModeGasTransaction.storyName = 'remoteModeGasTransaction';
RemoteModeGasTransaction.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend], // Base properties from simpleSend
    type: TransactionType.simpleSend, // Explicitly set type
    // txParamsOriginal.from is NOT the selected account
    // txParams.from IS the selected account
    // This simulates a scenario where the selected account is paying for gas for a tx originally from another account.
    txParams: {
      ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend].txParams,
      from: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4', // Simulates selectedInternalAccount.address
      to: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      // Ensure no 'data' field that would trigger 'isRedeemDelegationsCall'
      // data: undefined (or will be inherited as undefined from MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend].txParams)
    },
    txParamsOriginal: {
      ...MOCK_TRANSACTION_BY_TYPE[TransactionType.simpleSend].txParams,
      from: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', // Original sender, different from selected account
      to: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
      // data: undefined
    },
  },
  // No need to override 'transactionGroup.primaryTransaction.txParams.data' for this story,
  // as we don't want it to be a redeem delegations call.
  // Default args from export default will apply for status, hasCancelled, hasRetried, isEarliestNonce
};
