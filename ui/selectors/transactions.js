import { ApprovalType } from '@metamask/controller-utils';
import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller/dist/types';
import {
  PRIORITY_STATUS_HASH,
  PENDING_STATUS_HASH,
} from '../helpers/constants/transactions';
import txHelper from '../helpers/utils/tx-helper';
import { SmartTransactionStatus } from '../../shared/constants/transaction';
import { hexToDecimal } from '../../shared/modules/conversion.utils';
import { getProviderConfig } from '../ducks/metamask/metamask';
import { getCurrentChainId } from './selectors';
import { getSelectedInternalAccount } from './accounts';
import { hasPendingApprovals, getApprovalRequestsByType } from './approvals';
import {
  createDeepEqualSelector,
  filterAndShapeUnapprovedTransactions,
} from './util';

const INVALID_INITIAL_TRANSACTION_TYPES = [
  TransactionType.cancel,
  TransactionType.retry,
];

// The statuses listed below are allowed in the Activity list for Smart Swaps.
// SUCCESS and REVERTED statuses are excluded because smart transactions with
// those statuses are already in the regular transaction list.
// TODO: When Swaps and non-Swaps transactions are treated the same,
// we will only allow the PENDING smart transaction status in the Activity list.
const allowedSwapsSmartTransactionStatusesForActivityList = [
  SmartTransactionStatuses.PENDING,
  SmartTransactionStatuses.UNKNOWN,
  SmartTransactionStatuses.RESOLVED,
  SmartTransactionStatuses.CANCELLED,
];

export const getTransactions = createDeepEqualSelector(
  (state) => {
    const { transactions } = state.metamask ?? {};

    if (!transactions?.length) {
      return [];
    }

    return [...transactions].sort((a, b) => a.time - b.time); // Ascending
  },
  (transactions) => transactions,
);

export const getCurrentNetworkTransactions = createDeepEqualSelector(
  (state) => {
    const transactions = getTransactions(state);

    if (!transactions.length) {
      return [];
    }

    const { chainId } = getProviderConfig(state);

    return transactions.filter(
      (transaction) => transaction.chainId === chainId,
    );
  },
  (transactions) => transactions,
);

export const getUnapprovedTransactions = createDeepEqualSelector(
  (state) => {
    const currentNetworkTransactions = getCurrentNetworkTransactions(state);
    return filterAndShapeUnapprovedTransactions(currentNetworkTransactions);
  },
  (transactions) => transactions,
);

// Unlike `getUnapprovedTransactions` and `getCurrentNetworkTransactions`
// returns the total number of unapproved transactions on all networks
export const getAllUnapprovedTransactions = createDeepEqualSelector(
  (state) => {
    const { transactions } = state.metamask || [];
    if (!transactions?.length) {
      return [];
    }

    const sortedTransactions = [...transactions].sort(
      (a, b) => a.time - b.time,
    );

    return filterAndShapeUnapprovedTransactions(sortedTransactions);
  },
  (transactions) => transactions,
);

export const getApprovedAndSignedTransactions = createDeepEqualSelector(
  (state) => {
    // Fetch transactions across all networks to address a nonce management limitation.
    // This issue arises when a pending transaction exists on one network, and the user initiates another transaction on a different network.
    const transactions = getTransactions(state);

    return transactions.filter((transaction) =>
      [TransactionStatus.approved, TransactionStatus.signed].includes(
        transaction.status,
      ),
    );
  },
  (transactions) => transactions,
);

export const incomingTxListSelector = createDeepEqualSelector(
  (state) => {
    const { incomingTransactionsPreferences } = state.metamask;
    if (!incomingTransactionsPreferences) {
      return [];
    }

    const currentNetworkTransactions = getCurrentNetworkTransactions(state);
    const { address: selectedAddress } = getSelectedInternalAccount(state);

    return currentNetworkTransactions.filter(
      (tx) =>
        tx.type === TransactionType.incoming &&
        tx.txParams.to === selectedAddress,
    );
  },
  (transactions) => transactions,
);

export const unapprovedPersonalMsgsSelector = (state) =>
  state.metamask.unapprovedPersonalMsgs;
export const unapprovedDecryptMsgsSelector = (state) =>
  state.metamask.unapprovedDecryptMsgs;
export const unapprovedEncryptionPublicKeyMsgsSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgs;
export const unapprovedTypedMessagesSelector = (state) =>
  state.metamask.unapprovedTypedMessages;

export const smartTransactionsListSelector = (state) => {
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  return state.metamask.smartTransactionsState?.smartTransactions?.[
    getCurrentChainId(state)
  ]
    ?.filter((smartTransaction) => {
      if (
        smartTransaction.txParams?.from !== selectedAddress ||
        smartTransaction.confirmed
      ) {
        return false;
      }
      // If a swap or non-swap smart transaction is pending, we want to show it in the Activity list.
      if (smartTransaction.status === SmartTransactionStatuses.PENDING) {
        return true;
      }
      // In the future we should have the same behavior for Swaps and non-Swaps transactions.
      // For that we need to submit Smart Swaps via the TransactionController as we do for
      // non-Swaps Smart Transactions.
      return (
        (smartTransaction.type === TransactionType.swap ||
          smartTransaction.type === TransactionType.swapApproval) &&
        allowedSwapsSmartTransactionStatusesForActivityList.includes(
          smartTransaction.status,
        )
      );
    })
    .map((stx) => ({
      ...stx,
      isSmartTransaction: true,
      status: stx.status?.startsWith('cancelled')
        ? SmartTransactionStatus.cancelled
        : stx.status,
    }));
};

export const selectedAddressTxListSelector = createSelector(
  getSelectedInternalAccount,
  getCurrentNetworkTransactions,
  smartTransactionsListSelector,
  (selectedInternalAccount, transactions = [], smTransactions = []) => {
    return transactions
      .filter(
        ({ txParams }) => txParams.from === selectedInternalAccount.address,
      )
      .filter(({ type }) => type !== TransactionType.incoming)
      .concat(smTransactions);
  },
);

export const unapprovedMessagesSelector = createSelector(
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  getCurrentChainId,
  (
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    chainId,
  ) =>
    txHelper(
      {},
      unapprovedPersonalMsgs,
      unapprovedDecryptMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
      chainId,
    ) || [],
);

export const transactionSubSelector = createSelector(
  unapprovedMessagesSelector,
  incomingTxListSelector,
  (unapprovedMessages = [], incomingTxList = []) => {
    return unapprovedMessages.concat(incomingTxList);
  },
);

export const transactionsSelector = createSelector(
  transactionSubSelector,
  selectedAddressTxListSelector,
  (subSelectorTxList = [], selectedAddressTxList = []) => {
    const txsToRender = selectedAddressTxList.concat(subSelectorTxList);

    return [...txsToRender].sort((a, b) => b.time - a.time);
  },
);

/**
 * @name insertOrderedNonce
 * @private
 * @description Inserts (mutates) a nonce into an array of ordered nonces, sorted in ascending
 * order.
 * @param {string[]} nonces - Array of nonce strings in hex
 * @param {string} nonceToInsert - Nonce string in hex to be inserted into the array of nonces.
 */
const insertOrderedNonce = (nonces, nonceToInsert) => {
  let insertIndex = nonces.length;

  for (let i = 0; i < nonces.length; i++) {
    const nonce = nonces[i];

    if (Number(hexToDecimal(nonce)) > Number(hexToDecimal(nonceToInsert))) {
      insertIndex = i;
      break;
    }
  }

  nonces.splice(insertIndex, 0, nonceToInsert);
};

/**
 * @name insertTransactionByTime
 * @private
 * @description Inserts (mutates) a transaction object into an array of ordered transactions, sorted
 * in ascending order by time.
 * @param {object[]} transactions - Array of transaction objects.
 * @param {object} transaction - Transaction object to be inserted into the array of transactions.
 */
const insertTransactionByTime = (transactions, transaction) => {
  const { time } = transaction;

  let insertIndex = transactions.length;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];

    if (tx.time > time) {
      insertIndex = i;
      break;
    }
  }

  transactions.splice(insertIndex, 0, transaction);
};

/**
 * Contains transactions and properties associated with those transactions of the same nonce.
 *
 * @typedef {object} transactionGroup
 * @property {string} nonce - The nonce that the transactions within this transactionGroup share.
 * @property {object[]} transactions - An array of transaction (txMeta) objects.
 * @property {object} initialTransaction - The transaction (txMeta) with the lowest "time".
 * @property {object} primaryTransaction - Either the latest transaction or the confirmed
 * transaction.
 * @property {boolean} hasRetried - True if a transaction in the group was a retry transaction.
 * @property {boolean} hasCancelled - True if a transaction in the group was a cancel transaction.
 */

/**
 * @name insertTransactionGroupByTime
 * @private
 * @description Inserts (mutates) a transactionGroup object into an array of ordered
 * transactionGroups, sorted in ascending order by nonce.
 * @param {transactionGroup[]} transactionGroups - Array of transactionGroup objects.
 * @param {transactionGroup} transactionGroup - transactionGroup object to be inserted into the
 * array of transactionGroups.
 */
const insertTransactionGroupByTime = (transactionGroups, transactionGroup) => {
  const { primaryTransaction: { time: groupToInsertTime } = {} } =
    transactionGroup;

  let insertIndex = transactionGroups.length;

  for (let i = 0; i < transactionGroups.length; i++) {
    const txGroup = transactionGroups[i];
    const { primaryTransaction: { time } = {} } = txGroup;

    if (time > groupToInsertTime) {
      insertIndex = i;
      break;
    }
  }

  transactionGroups.splice(insertIndex, 0, transactionGroup);
};

/**
 * @name mergeNonNonceTransactionGroups
 * @private
 * @description Inserts (mutates) transactionGroups that are not to be ordered by nonce into an array
 * of nonce-ordered transactionGroups by time.
 * @param {transactionGroup[]} orderedTransactionGroups - Array of transactionGroups ordered by
 * nonce.
 * @param {transactionGroup[]} nonNonceTransactionGroups - Array of transactionGroups not intended to be ordered by nonce,
 * but intended to be ordered by timestamp
 */
const mergeNonNonceTransactionGroups = (
  orderedTransactionGroups,
  nonNonceTransactionGroups,
) => {
  nonNonceTransactionGroups.forEach((transactionGroup) => {
    insertTransactionGroupByTime(orderedTransactionGroups, transactionGroup);
  });
};

/**
 * @name nonceSortedTransactionsSelector
 * @description Returns an array of transactionGroups sorted by nonce in ascending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) => {
    const unapprovedTransactionGroups = [];
    const incomingTransactionGroups = [];
    const orderedNonces = [];
    const nonceToTransactionsMap = {};

    transactions.forEach((transaction) => {
      const {
        txParams: { nonce } = {},
        status,
        type,
        time: txTime,
        txReceipt,
      } = transaction;

      // Don't group transactions by nonce if:
      // 1. Tx nonce is undefined
      // 2. Tx is incoming (deposit)
      // 3. Tx is custodial (mmi specific)
      let shouldNotBeGrouped =
        typeof nonce === 'undefined' || type === TransactionType.incoming;

      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      shouldNotBeGrouped = shouldNotBeGrouped || Boolean(transaction.custodyId);
      ///: END:ONLY_INCLUDE_IF

      if (shouldNotBeGrouped) {
        const transactionGroup = {
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried: false,
          hasCancelled: false,
          nonce,
        };

        if (type === TransactionType.incoming) {
          incomingTransactionGroups.push(transactionGroup);
        } else {
          insertTransactionGroupByTime(
            unapprovedTransactionGroups,
            transactionGroup,
          );
        }
      } else if (nonce in nonceToTransactionsMap) {
        const nonceProps = nonceToTransactionsMap[nonce];
        insertTransactionByTime(nonceProps.transactions, transaction);

        const {
          primaryTransaction: { time: primaryTxTime = 0 } = {},
          initialTransaction: { time: initialTxTime = 0 } = {},
        } = nonceProps;

        // Current Transaction Logic Cases
        // --------------------------------------------------------------------
        // Current transaction: The transaction we are examining in this loop.
        // Each iteration should be in time order, but that is not guaranteed.
        // --------------------------------------------------------------------
        const currentTransaction = {
          // A on chain failure means the current transaction was submitted and
          // considered for inclusion in a block but something prevented it
          // from being included, such as slippage on gas prices and conversion
          // when doing a swap. These transactions will have a '0x0' value in
          // the txReceipt.status field.
          isOnChainFailure: txReceipt?.status === '0x0',
          // Another type of failure is a "off chain" or "network" failure,
          // where the error occurs on the JSON RPC call to the network client
          // (Like Infura). These transactions are never broadcast for
          // inclusion and the nonce associated with them is not consumed. When
          // this occurs  the next transaction will have the same nonce as the
          // current, failed transaction. A failed on chain transaction will
          // not have the FAILED status although it should (future TODO: add a
          // new FAILED_ON_CHAIN) status. I use the word "Ephemeral" here
          // because a failed transaction that does not get broadcast is not
          // known outside of the user's local MetaMask and the nonce
          // associated will be applied to the next.
          isEphemeral:
            status === TransactionStatus.failed && txReceipt?.status !== '0x0',
          // We never want to use a speed up (retry) or cancel as the initial
          // transaction in a group, regardless of time order. This is because
          // useTransactionDisplayData cannot parse a retry or cancel because
          // it lacks information on whether its a simple send, token transfer,
          // etc.
          isRetryOrCancel: INVALID_INITIAL_TRANSACTION_TYPES.includes(type),
          // Primary transactions usually are the latest transaction by time,
          // but not always. This value shows whether this transaction occurred
          // after the current primary.
          occurredAfterPrimary: txTime > primaryTxTime,
          // Priority Statuses are those that are ones either already confirmed
          // on chain, submitted to the network, or waiting for user approval.
          // These statuses typically indicate a transaction that needs to have
          // its status reflected in the UI.
          hasPriorityStatus: status in PRIORITY_STATUS_HASH,
          // A confirmed transaction is the most valid transaction status to
          // display because no other transaction of the same nonce can have a
          // more valid status.
          isConfirmed: status === TransactionStatus.confirmed,
          // Initial transactions usually are the earliest transaction by time,
          // but not always. THis value shows whether this transaction occurred
          // before the current initial.
          occurredBeforeInitial: txTime < initialTxTime,
          // We only allow users to retry the transaction in certain scenarios
          // to help shield from expensive operations and other unwanted side
          // effects. This value is used to determine if the entire transaction
          // group should be marked as having had a retry.
          isValidRetry:
            type === TransactionType.retry &&
            (status in PRIORITY_STATUS_HASH ||
              status === TransactionStatus.dropped),
          // We only allow users to cancel the transaction in certain scenarios
          // to help shield from expensive operations and other unwanted side
          // effects. This value is used to determine if the entire transaction
          // group should be marked as having had a cancel.
          isValidCancel:
            type === TransactionType.cancel &&
            (status in PRIORITY_STATUS_HASH ||
              status === TransactionStatus.dropped),
        };

        // We should never assign a retry or cancel transaction as the initial,
        // likewise an ephemeral transaction should not be initial.
        currentTransaction.eligibleForInitial =
          !currentTransaction.isRetryOrCancel &&
          !currentTransaction.isEphemeral;

        // If a transaction failed on chain or was confirmed then it should
        // always be the primary because no other transaction is more valid.
        currentTransaction.shouldBePrimary =
          currentTransaction.isConfirmed || currentTransaction.isOnChainFailure;

        // Primary Transaction Logic Cases
        // --------------------------------------------------------------------
        // Primary transaction: The transaction for any given nonce which has
        // the most valid status on the network.
        // Example:
        // 1. Submit transaction A
        // 2. Speed up Transaction A.
        // 3. This creates a new Transaction (B) with higher gas params.
        // 4. Transaction A and Transaction B are both submitted.
        // 5. We expect Transaction B to be the most valid transaction to use
        //    for the status of the transaction group because it has higher
        //    gas params and should be included first.
        // The following logic variables are used for edge cases that protect
        // against UI bugs when this breaks down.
        const previousPrimaryTransaction = {
          // As we loop through the transactions in state we may temporarily
          // assign a primaryTransaction that is an "Ephemeral" transaction,
          // which is one that failed before being broadcast for inclusion in a
          // block. When this happens, and we have another transaction to
          // consider in a nonce group, we should use the new transaction.
          isEphemeral:
            nonceProps.primaryTransaction.status === TransactionStatus.failed &&
            nonceProps.primaryTransaction?.txReceipt?.status !== '0x0',
        };

        // Initial Transaction Logic Cases
        // --------------------------------------------------------------------
        // Initial Transaction: The transaction that most likely represents the
        // user's intent when creating/approving the transaction. In most cases
        // this is the first transaction of a nonce group, by time, but this
        // breaks down in the case of users with the advanced setting enabled
        // to set their own nonces manually. In that case a user may submit two
        // completely different transactions of the same nonce and they will be
        // bundled together by this selector as the same activity entry.
        const previousInitialTransaction = {
          // As we loop through the transactions in state we may temporarily
          // assign a initialTransaction that is an "Ephemeral" transaction,
          // which is one that failed before being broadcast for inclusion in a
          // block. When this happens, and we have another transaction to
          // consider in a nonce group, we should use the new transaction.
          isEphemeral:
            nonceProps.initialTransaction.status === TransactionStatus.failed &&
            nonceProps.initialTransaction.txReceipt?.status !== '0x0',
        };

        // Check the above logic cases and assign a new primaryTransaction if
        // appropriate
        if (
          currentTransaction.shouldBePrimary ||
          previousPrimaryTransaction.isEphemeral ||
          (currentTransaction.occurredAfterPrimary &&
            currentTransaction.hasPriorityStatus)
        ) {
          nonceProps.primaryTransaction = transaction;
        }

        // Check the above logic cases and assign a new initialTransaction if
        // appropriate
        if (
          (currentTransaction.occurredBeforeInitial &&
            currentTransaction.eligibleForInitial) ||
          (previousInitialTransaction.isEphemeral &&
            currentTransaction.eligibleForInitial)
        ) {
          nonceProps.initialTransaction = transaction;
        }

        if (currentTransaction.isValidRetry) {
          nonceProps.hasRetried = true;
        }

        if (currentTransaction.isValidCancel) {
          nonceProps.hasCancelled = true;
        }
      } else {
        nonceToTransactionsMap[nonce] = {
          nonce,
          transactions: [transaction],
          initialTransaction: transaction,
          primaryTransaction: transaction,
          hasRetried:
            transaction.type === TransactionType.retry &&
            (transaction.status in PRIORITY_STATUS_HASH ||
              transaction.status === TransactionStatus.dropped),
          hasCancelled:
            transaction.type === TransactionType.cancel &&
            (transaction.status in PRIORITY_STATUS_HASH ||
              transaction.status === TransactionStatus.dropped),
        };

        insertOrderedNonce(orderedNonces, nonce);
      }
    });

    const orderedTransactionGroups = orderedNonces.map(
      (nonce) => nonceToTransactionsMap[nonce],
    );
    mergeNonNonceTransactionGroups(
      orderedTransactionGroups,
      incomingTransactionGroups,
    );
    return unapprovedTransactionGroups
      .concat(orderedTransactionGroups)
      .map((txGroup) => {
        // In the case that we have a cancel or retry as initial transaction
        // and there is a valid transaction in the group, we should reassign
        // the other valid transaction as initial. In this case validity of the
        // transaction is expanded to include off-chain failures because it is
        // valid to retry those with higher gas prices.
        if (
          INVALID_INITIAL_TRANSACTION_TYPES.includes(
            txGroup.initialTransaction?.type,
          )
        ) {
          const nonRetryOrCancel = txGroup.transactions.find(
            (tx) => !INVALID_INITIAL_TRANSACTION_TYPES.includes(tx.type),
          );
          if (nonRetryOrCancel) {
            return {
              ...txGroup,
              initialTransaction: nonRetryOrCancel,
            };
          }
        }
        return txGroup;
      });
  },
);

/**
 * @name nonceSortedPendingTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are still pending sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedPendingTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) =>
    transactions.filter(
      ({ primaryTransaction }) =>
        primaryTransaction.status in PENDING_STATUS_HASH,
    ),
);

/**
 * @name nonceSortedCompletedTransactionsSelector
 * @description Returns an array of transactionGroups where transactions are confirmed sorted by
 * nonce in descending order.
 * @returns {transactionGroup[]}
 */
export const nonceSortedCompletedTransactionsSelector = createSelector(
  nonceSortedTransactionsSelector,
  (transactions = []) =>
    transactions
      .filter(
        ({ primaryTransaction }) =>
          !(primaryTransaction.status in PENDING_STATUS_HASH),
      )
      .reverse(),
);

export const submittedPendingTransactionsSelector = createSelector(
  transactionsSelector,
  (transactions = []) =>
    transactions.filter(
      (transaction) => transaction.status === TransactionStatus.submitted,
    ),
);

const TRANSACTION_APPROVAL_TYPES = [
  ApprovalType.EthDecrypt,
  ApprovalType.EthGetEncryptionPublicKey,
  ApprovalType.EthSignTypedData,
  ApprovalType.PersonalSign,
];

export function hasTransactionPendingApprovals(state) {
  const unapprovedTxRequests = getApprovalRequestsByType(
    state,
    ApprovalType.Transaction,
  );
  return (
    unapprovedTxRequests.length > 0 ||
    hasPendingApprovals(state, TRANSACTION_APPROVAL_TYPES)
  );
}

export function selectTransactionMetadata(state, transactionId) {
  return state.metamask.transactions.find(
    (transaction) => transaction.id === transactionId,
  );
}

export const selectTransactionSender = createSelector(
  (state, transactionId) => selectTransactionMetadata(state, transactionId),
  (transaction) => transaction?.txParams?.from,
);
