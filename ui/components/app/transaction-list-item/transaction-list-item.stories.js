import React from 'react';
import {
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from '../../../../shared/constants/transaction';
import { MOCK_TRANSACTION_BY_TYPE } from '../../../../.storybook/initial-states/transactions';
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
  const tx = {
    ...args['transactionGroup.primaryTransaction'],
    status,
    submittedTime: args['transactionGroup.primaryTransaction.submittedTime'],
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
 * Each page displays a different Transaction Type (TRANSACTION_TYPES)
 * except TRANSACTION_TYPES.CANCEL and TRANSACTION_TYPES.RETRY as these two types
 * are never initialTransactions
 */
export default {
  title: 'Components/App/TransactionListItem',

  argTypes: {
    isEarliestNonce: { control: 'boolean' },
    'transactionGroup.hasCancelled': { control: 'boolean' },
    'transactionGroup.hasRetried': { control: 'boolean' },
    'transactionGroup.primaryTransaction.status': {
      options: Object.values(TRANSACTION_STATUSES)
        .filter((status) => {
          return status !== TRANSACTION_STATUSES.SIGNED;
        })
        .sort(),
      control: { type: 'select' },
    },
    'transactionGroup.primaryTransaction.submittedTime': { control: 'number' },
    'transactionGroup.primaryTransaction': { control: 'object' },
  },
  args: {
    isEarliestNonce: true,
    'transactionGroup.hasCancelled': false,
    'transactionGroup.hasRetried': false,
    'transactionGroup.primaryTransaction.status': TRANSACTION_STATUSES.PENDING,
    'transactionGroup.primaryTransaction.submittedTime': 19999999999999,
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
export const SwapApproval = Template.bind({});
export const TokenMethodApprove = Template.bind({});
export const TokenMethodSafeTransferFrom = Template.bind({});
export const TokenMethodTransfer = Template.bind({});
export const TokenMethodTransferFrom = Template.bind({});

ContractInteraction.storyName = 'contractInteraction';
ContractInteraction.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.CONTRACT_INTERACTION],
  },
};

DeployContract.storyName = 'contractDeployment';
DeployContract.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.DEPLOY_CONTRACT],
  },
};

EthDecrypt.storyName = 'eth_decrypt';
EthDecrypt.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.ETH_DECRYPT],
  },
};

EthGetEncryptionPublicKey.storyName = 'eth_getEncryptionPublicKey';
EthGetEncryptionPublicKey.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[
      TRANSACTION_TYPES.ETH_GET_ENCRYPTION_PUBLIC_KEY
    ],
  },
};

Incoming.storyName = 'incoming';
Incoming.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.INCOMING],
  },
};

PersonalSign.storyName = 'personal_sign';
PersonalSign.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.PERSONAL_SIGN],
  },
};

Sign.storyName = 'eth_sign';
Sign.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SIGN],
  },
};

SignTypeData.storyName = 'eth_signTypedData';
SignTypeData.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SIGN_TYPED_DATA],
  },
};

SimpleSend.storyName = 'simpleSend';
SimpleSend.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SIMPLE_SEND],
  },
};

Smart.storyName = 'smart';
Smart.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SMART],
  },
};

Swap.storyName = 'swap';
Swap.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SWAP],
  },
};

SwapApproval.storyName = 'swapApproval';
SwapApproval.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SWAP_APPROVAL],
  },
};

TokenMethodApprove.storyName = 'approve';
TokenMethodApprove.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_APPROVE],
  },
};

TokenMethodSafeTransferFrom.storyName = 'safetransferfrom';
TokenMethodSafeTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[
      TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM
    ],
  },
};

TokenMethodTransfer.storyName = 'transfer';
TokenMethodTransfer.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER],
  },
};

TokenMethodTransferFrom.storyName = 'transferfrom';
TokenMethodTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM],
  },
};
