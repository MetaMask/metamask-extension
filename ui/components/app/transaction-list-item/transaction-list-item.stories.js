/* eslint-disable react/prop-types */
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
 * @param {Object} args
 * @returns {TransactionGroup}
 */
const getMockTransactionGroup = (args) => {
  const status = args['transactionGroup.primaryTransaction.status'];
  const primaryTransaction = {
    ...args['transactionGroup.primaryTransaction'],
    status,
  };

  let initialTransaction;
  let transactions;
  let hasCancelled = false;

  if (
    primaryTransaction.type === TRANSACTION_TYPES.CANCEL ||
    primaryTransaction.type === TRANSACTION_TYPES.RETRY
  ) {
    initialTransaction =
      MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SIMPLE_SEND];
    hasCancelled = true;
    transactions = [initialTransaction, primaryTransaction];
  }

  return {
    hasCancelled,
    hasRetried: false,
    nonce: '0x1',
    initialTransaction: initialTransaction || primaryTransaction,
    primaryTransaction,
    transactions: transactions || [primaryTransaction],
  };
};

export default {
  title: 'Components/App/TransactionListItem',
  id: __filename,
  argTypes: {
    'transactionGroup.primaryTransaction.status': {
      options: Object.values(TRANSACTION_STATUSES).slice(
        TRANSACTION_STATUSES.SIGNED,
      ),
      control: { type: 'select' },
    },
    'transactionGroup.primaryTransaction': { control: 'object' },
  },
  args: {
    'transactionGroup.primaryTransaction.status': TRANSACTION_STATUSES.PENDING,
  },
};

const Template = (args) => {
  const transactionGroup = getMockTransactionGroup(args);
  return <TransactionListItem transactionGroup={transactionGroup} />;
};

export const Cancel = Template.bind({});
export const ContractInteraction = Template.bind({});
export const DeployContract = Template.bind({});
export const EthDecrypt = Template.bind({});
export const EthGetEncryptionPublicKey = Template.bind({});
export const Incoming = Template.bind({});
export const PersonalSign = Template.bind({});
export const Retry = Template.bind({});
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

Cancel.storyName = 'cancel';
Cancel.argTypes = {
  'transactionGroup.primaryTransaction.status': { control: { disable: true } },
};
Cancel.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.CANCEL],
  },
  'transactionGroup.primaryTransaction.status': TRANSACTION_STATUSES.CONFIRMED,
};

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

Retry.storyName = 'retry';
Retry.argTypes = {
  'transactionGroup.primaryTransaction.status': { control: { disable: true } },
};
Retry.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.RETRY],
  },
  'transactionGroup.primaryTransaction.status': TRANSACTION_STATUSES.PENDING,
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
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.SWAP_APPROVAL],
  },
};

SwapApproval.storyName = 'swapApproval';
SwapApproval.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_APPROVE],
  },
};

TokenMethodApprove.storyName = 'approve';
TokenMethodApprove.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[
      TRANSACTION_TYPES.TOKEN_METHOD_SAFE_TRANSFER_FROM
    ],
  },
};

TokenMethodSafeTransferFrom.storyName = 'safetransferfrom';
TokenMethodSafeTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER],
  },
};

TokenMethodTransfer.storyName = 'transfer';
TokenMethodTransfer.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM],
  },
};

TokenMethodTransferFrom.storyName = 'transferfrom';
TokenMethodTransferFrom.args = {
  'transactionGroup.primaryTransaction': {
    ...MOCK_TRANSACTION_BY_TYPE[TRANSACTION_TYPES.TOKEN_METHOD_TRANSFER_FROM],
  },
};
