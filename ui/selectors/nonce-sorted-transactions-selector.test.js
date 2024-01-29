import { head, last } from 'lodash';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../shared/constants/network';
import { nonceSortedTransactionsSelector } from './transactions';

const RECIPIENTS = {
  ONE: '0xRecipient1',
  TWO: '0xRecipient2',
};

const SENDERS = {
  ONE: '0xSender1',
  TWO: '0xSender2',
};

const INCOMING_TX = {
  id: '0-incoming',
  type: TransactionType.incoming,
  txParams: {
    value: '0x0',
    from: RECIPIENTS.ONE,
    to: SENDERS.ONE,
  },
  chainId: CHAIN_IDS.MAINNET,
};

const SIGNING_REQUEST = {
  type: TransactionType.sign,
  id: '0-signing',
  status: TransactionStatus.unapproved,
  chainId: CHAIN_IDS.MAINNET,
};

const SIMPLE_SEND_TX = {
  id: '0-simple',
  txParams: {
    from: SENDERS.ONE,
    to: RECIPIENTS.ONE,
  },
  type: TransactionType.simpleSend,
  chainId: CHAIN_IDS.MAINNET,
};

const TOKEN_SEND_TX = {
  id: '0-transfer',
  txParams: {
    from: SENDERS.ONE,
    to: RECIPIENTS.TWO,
    value: '0x0',
    data: '0xdata',
  },
  type: TransactionType.tokenMethodTransfer,
  chainId: CHAIN_IDS.MAINNET,
};

const RETRY_TX = {
  ...SIMPLE_SEND_TX,
  id: '0-retry',
  type: TransactionType.retry,
  chainId: CHAIN_IDS.MAINNET,
};

const CANCEL_TX = {
  id: '0-cancel',
  txParams: {
    value: '0x0',
    from: SENDERS.ONE,
    to: SENDERS.ONE,
  },
  type: TransactionType.cancel,
  chainId: CHAIN_IDS.MAINNET,
};

const getStateTree = ({
  txList = [],
  incomingTxList = [],
  unapprovedMsgs = [],
} = {}) => ({
  metamask: {
    providerConfig: {
      nickname: 'mainnet',
      chainId: CHAIN_IDS.MAINNET,
    },
    unapprovedMsgs,
    selectedAddress: SENDERS.ONE,
    internalAccounts: {
      accounts: {
        'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
          address: SENDERS.ONE,
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: 'Test Account',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: [...Object.values(EthMethod)],
          type: EthAccountType.Eoa,
        },
      },
      selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    },
    featureFlags: {},
    transactions: [...incomingTxList, ...txList],
    incomingTransactionsPreferences: {},
  },
});

const duplicateTx = (base, overrides) => {
  const {
    nonce = '0x0',
    time = 0,
    status = TransactionStatus.confirmed,
    txReceipt,
  } = overrides ?? {};
  return {
    ...base,
    txParams: {
      ...base.txParams,
      nonce,
    },
    txReceipt,
    time,
    status,
  };
};

describe('nonceSortedTransactionsSelector', () => {
  it('should properly group a simple send that is superseded by a retry', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.dropped }),
      duplicateTx(RETRY_TX, { time: 1 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: true,
        hasCancelled: false,
      },
    ]);
  });

  it('should properly group a failed off-chain simple send that is superseded by a retry', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.failed }),
      duplicateTx(RETRY_TX, { time: 1 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: true,
        hasCancelled: false,
      },
    ]);
  });

  it('should properly group a simple send that is superseded by a cancel', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.dropped }),
      duplicateTx(CANCEL_TX, { time: 1 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: false,
        hasCancelled: true,
      },
    ]);
  });

  it('should properly group a simple send and retry that is superseded by a cancel', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.dropped }),
      duplicateTx(RETRY_TX, { time: 1, status: TransactionStatus.dropped }),
      duplicateTx(CANCEL_TX, { time: 2 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: true,
        hasCancelled: true,
      },
    ]);
  });

  it('should group transactions created by an advance user attempting to manually supersede own txs', () => {
    // We do not want this behavior longterm. This test just keeps us from
    // changing expectations from today. It will also allow us to invert this
    // test case when we move and change grouping logic.
    const txList = [
      duplicateTx(TOKEN_SEND_TX, { status: TransactionStatus.dropped }),
      duplicateTx(SIMPLE_SEND_TX, { time: 1 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });

  it('should NOT group sent and incoming tx with same nonce', () => {
    const txList = [duplicateTx(SIMPLE_SEND_TX)];
    const incomingTxList = [duplicateTx(INCOMING_TX, { time: 1 })];

    const state = getStateTree({ txList, incomingTxList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: head(txList),
        hasRetried: false,
        hasCancelled: false,
      },
      {
        nonce: '0x0',
        transactions: incomingTxList,
        initialTransaction: head(incomingTxList),
        primaryTransaction: head(incomingTxList),
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });

  it('should display a signing request', () => {
    const state = getStateTree({ unapprovedMsgs: [SIGNING_REQUEST] });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: undefined,
        transactions: [SIGNING_REQUEST],
        initialTransaction: SIGNING_REQUEST,
        primaryTransaction: SIGNING_REQUEST,
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });

  it('should not set a failed off-chain transaction as primary, allowing additional retries', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.submitted }),
      duplicateTx(RETRY_TX, { status: TransactionStatus.failed, time: 1 }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: head(txList),
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });

  it('should not set a failed off-chain transaction as primary or initial, regardless of tx order', () => {
    // Scenario:
    // 1. You submit transaction A.
    // 2. Transaction A fails off-chain (the network rejects it).
    // 3. You submit transaction B.
    // 4. Transaction A no longer has any visual representation in the UI.
    //    This is desired because we have no way currently to tell the intent
    //    of the transactions.
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.failed }),
      duplicateTx(SIMPLE_SEND_TX, {
        status: TransactionStatus.submitted,
        time: 1,
      }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: last(txList),
        primaryTransaction: last(txList),
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });

  it('should set a failed on-chain transaction as primary', () => {
    const txList = [
      duplicateTx(SIMPLE_SEND_TX, { status: TransactionStatus.submitted }),
      duplicateTx(RETRY_TX, {
        status: TransactionStatus.failed,
        txReceipt: { status: '0x0' },
        time: 1,
      }),
    ];

    const state = getStateTree({ txList });

    const result = nonceSortedTransactionsSelector(state);

    expect(result).toStrictEqual([
      {
        nonce: '0x0',
        transactions: txList,
        initialTransaction: head(txList),
        primaryTransaction: last(txList),
        hasRetried: false,
        hasCancelled: false,
      },
    ]);
  });
});
