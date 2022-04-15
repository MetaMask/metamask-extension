import {
  cloneDeep,
  concat,
  groupBy,
  isPlainObject,
  keyBy,
  mapValues,
  pickBy,
  sortBy,
} from 'lodash';

const version = 70;

const CANCEL = 'cancel';
const RETRY = 'retry';

const isCancelOrRetry = (tx) => tx.type === CANCEL || tx.type === RETRY;

const isNotCancelOrRetry = (tx) => tx.type !== CANCEL && tx.type !== RETRY;

/**
 * In migration 53 the "category" and "type" properties of the transaction
 * object were consolidated to "type". This has resulted in a number of edge
 * cases that the UI cannot handle without temporal knowledge of transactions
 * and heavy logic to understand the user's intent with any set of
 * transactions. In the future we will attempt to group transactions by intent
 * but until then any attempt to do so from the UI perspective is inherently
 * brittle and subject to further corner cases. To temporarily remedy some of
 * the issues, this migration and bundled code change moves the cancel and
 * retry types to special properties on the TransactionMeta object. The benefit
 * of doing this is that we can retain the original transaction type, and if a
 * retry or cancel transaction is somehow orphaned from the other transaction
 * that proceeded it we can still display something to the user.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const transactions = state?.TransactionController?.transactions;
  if (isPlainObject(transactions)) {
    // First, group transactions by nonce and chain. This gets us fairly close
    // to the UI logic for the nonceSorted selector that creates Transaction
    // Groups.
    const nonceNetworkGroupedObject = groupBy(
      Object.values(transactions),
      (tx) => {
        return `${tx.txParams?.nonce}-${tx.chainId ?? tx.metamaskNetworkId}`;
      },
    );

    // Remove any groups that contain ONLY retries or cancels. This removes
    // orphaned retries/cancels that can no longer rely upon the original tx
    // for additional context/details.
    const withoutOrphans = pickBy(nonceNetworkGroupedObject, (group) => {
      return group.some(isNotCancelOrRetry);
    });

    // Update all groups that have a retry or cancel such that all retry or
    // cancel transactions are assigned the type of the first transaction that
    // is not a retry or cancel.
    const retypedTxs = mapValues(withoutOrphans, (group) => {
      if (group.some(isCancelOrRetry) === false) {
        return group;
      }
      const firstNonCancelOrRetry = sortBy(group, 'time').find(
        isNotCancelOrRetry,
      );
      return group.map((tx) => ({
        ...tx,
        isCancel: tx.type === CANCEL,
        isRetry: tx.type === RETRY,
        type: isCancelOrRetry(tx) ? firstNonCancelOrRetry.type : tx.type,
      }));
    });

    // Update state
    state.TransactionController.transactions = keyBy(
      concat(...Object.values(retypedTxs)),
      (tx) => tx.id,
    );
  }
  return state;
}
