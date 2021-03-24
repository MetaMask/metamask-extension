import EventEmitter from 'safe-event-emitter';
import { ObservableStore } from '@metamask/obs-store';
import log from 'loglevel';
import createId from '../../../../shared/modules/random-id';
import { TRANSACTION_STATUSES } from '../../../../shared/constants/transaction';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import { transactionMatchesNetwork } from '../../../../shared/modules/transaction.utils';
import {
  generateHistoryEntry,
  replayHistory,
  snapshotFromTxMeta,
} from './lib/tx-state-history-helpers';
import { getFinalStates, normalizeTxParams } from './lib/util';

/**
 * TransactionStatuses reimported from the shared transaction constants file
 * @typedef {import('../../../../shared/constants/transaction').TransactionStatuses} TransactionStatuses
 */

/**
 * TransactionStateManager is responsible for the state of a transaction and
 * storing the transaction. It also has some convenience methods for finding
 * subsets of transactions.
 * @param {Object} opts
 * @param {Object} [opts.initState={ transactions: [] }] - initial transactions list with the key transaction {Array}
 * @param {number} [opts.txHistoryLimit] - limit for how many finished
 *  transactions can hang around in state
 * @param {Function} opts.getNetwork - return network number
 * @class
 */
export default class TransactionStateManager extends EventEmitter {
  constructor({ initState, txHistoryLimit, getNetwork, getCurrentChainId }) {
    super();

    this.store = new ObservableStore({ transactions: [], ...initState });
    this.txHistoryLimit = txHistoryLimit;
    this.getNetwork = getNetwork;
    this.getCurrentChainId = getCurrentChainId;
  }

  /**
   * @param {Object} opts - the object to use when overwriting defaults
   * @returns {txMeta} the default txMeta object
   */
  generateTxMeta(opts) {
    const netId = this.getNetwork();
    const chainId = this.getCurrentChainId();
    if (netId === 'loading') {
      throw new Error('MetaMask is having trouble connecting to the network');
    }
    return {
      id: createId(),
      time: new Date().getTime(),
      status: TRANSACTION_STATUSES.UNAPPROVED,
      metamaskNetworkId: netId,
      chainId,
      loadingDefaults: true,
      ...opts,
    };
  }

  /**
   * Returns the full tx list for the current network
   *
   * The list is iterated backwards as new transactions are pushed onto it.
   *
   * @param {number} [limit] - a limit for the number of transactions to return
   * @returns {Object[]} The {@code txMeta}s, filtered to the current network
   */
  getTxList(limit) {
    const network = this.getNetwork();
    const chainId = this.getCurrentChainId();
    const fullTxList = this.getFullTxList();

    const nonces = new Set();
    const txs = [];
    for (let i = fullTxList.length - 1; i > -1; i--) {
      const txMeta = fullTxList[i];
      if (transactionMatchesNetwork(txMeta, chainId, network) === false) {
        continue;
      }

      if (limit !== undefined) {
        const { nonce } = txMeta.txParams;
        if (!nonces.has(nonce)) {
          if (nonces.size < limit) {
            nonces.add(nonce);
          } else {
            continue;
          }
        }
      }

      txs.unshift(txMeta);
    }
    return txs;
  }

  /**
   * @returns {Array} of all the txMetas in store
   */
  getFullTxList() {
    return this.store.getState().transactions;
  }

  /**
   * @returns {Array} the tx list with unapproved status
   */
  getUnapprovedTxList() {
    const txList = this.getTxsByMetaData(
      'status',
      TRANSACTION_STATUSES.UNAPPROVED,
    );
    return txList.reduce((result, tx) => {
      result[tx.id] = tx;
      return result;
    }, {});
  }

  /**
   * @param {string} [address] - hex prefixed address to sort the txMetas for [optional]
   * @returns {Array} the tx list with approved status if no address is provide
   *  returns all txMetas with approved statuses for the current network
   */
  getApprovedTransactions(address) {
    const opts = { status: TRANSACTION_STATUSES.APPROVED };
    if (address) {
      opts.from = address;
    }
    return this.getFilteredTxList(opts);
  }

  /**
   * @param {string} [address] - hex prefixed address to sort the txMetas for [optional]
   * @returns {Array} the tx list submitted status if no address is provide
   *  returns all txMetas with submitted statuses for the current network
   */
  getPendingTransactions(address) {
    const opts = { status: TRANSACTION_STATUSES.SUBMITTED };
    if (address) {
      opts.from = address;
    }
    return this.getFilteredTxList(opts);
  }

  /**
    @param {string} [address] - hex prefixed address to sort the txMetas for [optional]
    @returns {Array} the tx list whose status is confirmed if no address is provide
    returns all txMetas who's status is confirmed for the current network
  */
  getConfirmedTransactions(address) {
    const opts = { status: TRANSACTION_STATUSES.CONFIRMED };
    if (address) {
      opts.from = address;
    }
    return this.getFilteredTxList(opts);
  }

  /**
   * Adds the txMeta to the list of transactions in the store.
   * if the list is over txHistoryLimit it will remove a transaction that
   * is in its final state.
   * it will also add the key `history` to the txMeta with the snap shot of
   * the original object
   * @param {Object} txMeta
   * @returns {Object} the txMeta
   */
  addTx(txMeta) {
    // normalize and validate txParams if present
    if (txMeta.txParams) {
      txMeta.txParams = this.normalizeAndValidateTxParams(txMeta.txParams);
    }

    this.once(`${txMeta.id}:signed`, () => {
      this.removeAllListeners(`${txMeta.id}:rejected`);
    });
    this.once(`${txMeta.id}:rejected`, () => {
      this.removeAllListeners(`${txMeta.id}:signed`);
    });
    // initialize history
    txMeta.history = [];
    // capture initial snapshot of txMeta for history
    const snapshot = snapshotFromTxMeta(txMeta);
    txMeta.history.push(snapshot);

    const transactions = this.getFullTxList();
    const txCount = transactions.length;
    const { txHistoryLimit } = this;

    // checks if the length of the tx history is
    // longer then desired persistence limit
    // and then if it is removes only confirmed
    // or rejected tx's.
    // not tx's that are pending or unapproved
    if (txCount > txHistoryLimit - 1) {
      const index = transactions.findIndex((metaTx) => {
        return getFinalStates().includes(metaTx.status);
      });
      if (index !== -1) {
        transactions.splice(index, 1);
      }
    }
    const newTxIndex = transactions.findIndex(
      (currentTxMeta) => currentTxMeta.time > txMeta.time,
    );

    newTxIndex === -1
      ? transactions.push(txMeta)
      : transactions.splice(newTxIndex, 0, txMeta);
    this._saveTxList(transactions);
    return txMeta;
  }

  /**
   * @param {number} txId
   * @returns {Object} the txMeta who matches the given id if none found
   * for the network returns undefined
   */
  getTx(txId) {
    const txMeta = this.getTxsByMetaData('id', txId)[0];
    return txMeta;
  }

  /**
   * updates the txMeta in the list and adds a history entry
   * @param {Object} txMeta - the txMeta to update
   * @param {string} [note] - a note about the update for history
   */
  updateTx(txMeta, note) {
    // normalize and validate txParams if present
    if (txMeta.txParams) {
      txMeta.txParams = this.normalizeAndValidateTxParams(txMeta.txParams);
    }

    // create txMeta snapshot for history
    const currentState = snapshotFromTxMeta(txMeta);
    // recover previous tx state obj
    const previousState = replayHistory(txMeta.history);
    // generate history entry and add to history
    const entry = generateHistoryEntry(previousState, currentState, note);
    if (entry.length) {
      txMeta.history.push(entry);
    }

    // commit txMeta to state
    const txId = txMeta.id;
    const txList = this.getFullTxList();
    const index = txList.findIndex((txData) => txData.id === txId);
    txList[index] = txMeta;
    this._saveTxList(txList);
  }

  /**
   * merges txParams obj onto txMeta.txParams use extend to ensure
   * that all fields are filled
   * @param {number} txId - the id of the txMeta
   * @param {Object} txParams - the updated txParams
   */
  updateTxParams(txId, txParams) {
    const txMeta = this.getTx(txId);
    txMeta.txParams = { ...txMeta.txParams, ...txParams };
    this.updateTx(txMeta, `txStateManager#updateTxParams`);
  }

  /**
   * normalize and validate txParams members
   * @param {Object} txParams - txParams
   */
  normalizeAndValidateTxParams(txParams) {
    if (typeof txParams.data === 'undefined') {
      delete txParams.data;
    }
    // eslint-disable-next-line no-param-reassign
    txParams = normalizeTxParams(txParams, false);
    this.validateTxParams(txParams);
    return txParams;
  }

  /**
   * validates txParams members by type
   * @param {Object} txParams - txParams to validate
   */
  validateTxParams(txParams) {
    Object.keys(txParams).forEach((key) => {
      const value = txParams[key];
      // validate types
      switch (key) {
        case 'chainId':
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw new Error(
              `${key} in txParams is not a Number or hex string. got: (${value})`,
            );
          }
          break;
        default:
          if (typeof value !== 'string') {
            throw new Error(
              `${key} in txParams is not a string. got: (${value})`,
            );
          }
          break;
      }
    });
  }

  /**
  @param {Object} opts -  an object of fields to search for eg:<br>
  let <code>thingsToLookFor = {<br>
    to: '0x0..',<br>
    from: '0x0..',<br>
    status: 'signed', \\ (status) => status !== 'rejected' give me all txs who's status is not rejected<br>
    err: undefined,<br>
  }<br></code>
  optionally the values of the keys can be functions for situations like where
  you want all but one status.
  @param {Array} [initialList=this.getTxList()]
  @returns {Array} array of txMeta with all
  options matching
  */
  /*
  ****************HINT****************
  | `err: undefined` is like looking |
  | for a tx with no err             |
  | so you can also search txs that  |
  | dont have something as well by   |
  | setting the value as undefined   |
  ************************************

  this is for things like filtering a the tx list
  for only tx's from 1 account
  or for filtering for all txs from one account
  and that have been 'confirmed'
  */
  getFilteredTxList(opts, initialList) {
    let filteredTxList = initialList;
    Object.keys(opts).forEach((key) => {
      filteredTxList = this.getTxsByMetaData(key, opts[key], filteredTxList);
    });
    return filteredTxList;
  }

  /**
   * @param {string} key - the key to check
   * @param {any} value - the value your looking for can also be a function that returns a bool
   * @param {Array} [txList=this.getTxList()] - the list to search. default is the txList
   *  from txStateManager#getTxList
   * @returns {Array} a list of txMetas who matches the search params
   */
  getTxsByMetaData(key, value, txList = this.getTxList()) {
    const filter = typeof value === 'function' ? value : (v) => v === value;

    return txList.filter((txMeta) => {
      if (key in txMeta.txParams) {
        return filter(txMeta.txParams[key]);
      }
      return filter(txMeta[key]);
    });
  }

  // get::set status

  /**
   * @param {number} txId - the txMeta Id
   * @returns {string} the status of the tx.
   */
  getTxStatus(txId) {
    const txMeta = this.getTx(txId);
    return txMeta.status;
  }

  /**
   * Update the status of the tx to 'rejected'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusRejected(txId) {
    this._setTxStatus(txId, 'rejected');
    this._removeTx(txId);
  }

  /**
   * Update the status of the tx to 'unapproved'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusUnapproved(txId) {
    this._setTxStatus(txId, TRANSACTION_STATUSES.UNAPPROVED);
  }

  /**
   * Update the status of the tx to 'approved'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusApproved(txId) {
    this._setTxStatus(txId, TRANSACTION_STATUSES.APPROVED);
  }

  /**
   * Update the status of the tx to 'signed'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusSigned(txId) {
    this._setTxStatus(txId, TRANSACTION_STATUSES.SIGNED);
  }

  /**
   * Update the status of the tx to 'submitted' and add a time stamp
   * for when it was called
   * @param {number} txId - the txMeta Id
   */
  setTxStatusSubmitted(txId) {
    const txMeta = this.getTx(txId);
    txMeta.submittedTime = new Date().getTime();
    this.updateTx(txMeta, 'txStateManager - add submitted time stamp');
    this._setTxStatus(txId, TRANSACTION_STATUSES.SUBMITTED);
  }

  /**
   * Update the status of the tx to 'confirmed'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusConfirmed(txId) {
    this._setTxStatus(txId, TRANSACTION_STATUSES.CONFIRMED);
  }

  /**
   * Update the status of the tx to 'dropped'.
   * @param {number} txId - the txMeta Id
   */
  setTxStatusDropped(txId) {
    this._setTxStatus(txId, TRANSACTION_STATUSES.DROPPED);
  }

  /**
   * Updates the status of the tx to 'failed' and put the error on the txMeta
   * @param {number} txId - the txMeta Id
   * @param {erroObject} err - error object
   */
  setTxStatusFailed(txId, err) {
    const error = err || new Error('Internal metamask failure');

    const txMeta = this.getTx(txId);
    txMeta.err = {
      message: error.toString(),
      rpc: error.value,
      stack: error.stack,
    };
    this.updateTx(txMeta, 'transactions:tx-state-manager#fail - add error');
    this._setTxStatus(txId, TRANSACTION_STATUSES.FAILED);
  }

  /**
   * Removes transaction from the given address for the current network
   * from the txList
   * @param {string} address - hex string of the from address on the txParams
   *  to remove
   */
  wipeTransactions(address) {
    // network only tx
    const txs = this.getFullTxList();
    const network = this.getNetwork();
    const chainId = this.getCurrentChainId();

    // Filter out the ones from the current account and network
    const otherAccountTxs = txs.filter(
      (txMeta) =>
        !(
          txMeta.txParams.from === address &&
          transactionMatchesNetwork(txMeta, chainId, network)
        ),
    );

    // Update state
    this._saveTxList(otherAccountTxs);
  }

  //
  //           PRIVATE METHODS
  //

  /**
   * @param {number} txId - the txMeta Id
   * @param {TransactionStatuses[keyof TransactionStatuses]} status - the status to set on the txMeta
   * @emits tx:status-update - passes txId and status
   * @emits ${txMeta.id}:finished - if it is a finished state. Passes the txMeta
   * @emits 'updateBadge'
   */
  _setTxStatus(txId, status) {
    const txMeta = this.getTx(txId);

    if (!txMeta) {
      return;
    }

    txMeta.status = status;
    try {
      this.updateTx(txMeta, `txStateManager: setting status to ${status}`);
      this.emit(`${txMeta.id}:${status}`, txId);
      this.emit(`tx:status-update`, txId, status);
      if (
        [
          TRANSACTION_STATUSES.SUBMITTED,
          TRANSACTION_STATUSES.REJECTED,
          TRANSACTION_STATUSES.FAILED,
        ].includes(status)
      ) {
        this.emit(`${txMeta.id}:finished`, txMeta);
      }
      this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE);
    } catch (error) {
      log.error(error);
    }
  }

  /**
   * Saves the new/updated txList. Intended only for internal use
   * @param {Array} transactions - the list of transactions to save
   */
  _saveTxList(transactions) {
    this.store.updateState({ transactions });
  }

  _removeTx(txId) {
    const transactionList = this.getFullTxList();
    this._saveTxList(transactionList.filter((txMeta) => txMeta.id !== txId));
  }

  /**
   * Filters out the unapproved transactions
   */
  clearUnapprovedTxs() {
    const transactions = this.getFullTxList();
    const nonUnapprovedTxs = transactions.filter(
      (tx) => tx.status !== TRANSACTION_STATUSES.UNAPPROVED,
    );
    this._saveTxList(nonUnapprovedTxs);
  }
}
