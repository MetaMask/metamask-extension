import EventEmitter from 'safe-event-emitter';
import { ObservableStore } from '@metamask/obs-store';
import { bufferToHex, keccak, toBuffer, isHexString } from 'ethereumjs-util';
import EthQuery from 'ethjs-query';
import { ethErrors } from 'eth-rpc-errors';
import Common from '@ethereumjs/common';
import { TransactionFactory } from '@ethereumjs/tx';
import NonceTracker from 'nonce-tracker';
import log from 'loglevel';
import BigNumber from 'bignumber.js';
import { merge, pickBy } from 'lodash';
import cleanErrorStack from '../../lib/cleanErrorStack';
import {
  hexToBn,
  BnMultiplyByFraction,
  addHexPrefix,
  getChainType,
} from '../../lib/util';
import {
  TransactionStatus,
  TransactionType,
  TokenStandard,
  TransactionEnvelopeType,
  TransactionMetaMetricsEvent,
  TransactionApprovalAmountType,
} from '../../../../shared/constants/transaction';
import { METAMASK_CONTROLLER_EVENTS } from '../../metamask-controller';
import {
  GAS_LIMITS,
  GAS_ESTIMATE_TYPES,
  GAS_RECOMMENDATIONS,
  CUSTOM_GAS_ESTIMATE,
  PRIORITY_LEVELS,
} from '../../../../shared/constants/gas';
import {
  bnToHex,
  decGWEIToHexWEI,
  hexWEIToDecETH,
  hexWEIToDecGWEI,
} from '../../../../shared/modules/conversion.utils';
import { isSwapsDefaultTokenAddress } from '../../../../shared/modules/swaps.utils';
import { EVENT } from '../../../../shared/constants/metametrics';
import {
  HARDFORKS,
  CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import {
  determineTransactionAssetType,
  determineTransactionContractCode,
  determineTransactionType,
  isEIP1559Transaction,
} from '../../../../shared/modules/transaction.utils';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import {
  calcGasTotal,
  getSwapsTokensReceivedFromTxMeta,
  TRANSACTION_ENVELOPE_TYPE_NAMES,
} from '../../../../shared/lib/transactions-controller-utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import TransactionStateManager from './tx-state-manager';
import TxGasUtil from './tx-gas-utils';
import PendingTransactionTracker from './pending-tx-tracker';
import * as txUtils from './lib/util';

const MAX_MEMSTORE_TX_LIST_SIZE = 100; // Number of transactions (by unique nonces) to keep in memory
const UPDATE_POST_TX_BALANCE_TIMEOUT = 5000;

const SWAP_TRANSACTION_TYPES = [
  TransactionType.swap,
  TransactionType.swapApproval,
];

// Only certain types of transactions should be allowed to be specified when
// adding a new unapproved transaction.
const VALID_UNAPPROVED_TRANSACTION_TYPES = [
  ...SWAP_TRANSACTION_TYPES,
  TransactionType.simpleSend,
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.contractInteraction,
];

/**
 * @typedef {import('../../../../shared/constants/transaction').TransactionMeta} TransactionMeta
 */

const METRICS_STATUS_FAILED = 'failed on-chain';

/**
 * @typedef {object} CustomGasSettings
 * @property {string} [gas] - The gas limit to use for the transaction
 * @property {string} [gasPrice] - The gasPrice to use for a legacy transaction
 * @property {string} [maxFeePerGas] - The maximum amount to pay per gas on a
 *  EIP-1559 transaction
 * @property {string} [maxPriorityFeePerGas] - The maximum amount of paid fee
 *  to be distributed to miner in an EIP-1559 transaction
 */

/**
 * Transaction Controller is an aggregate of sub-controllers and trackers
 * composing them in a way to be exposed to the metamask controller
 *
 * - `txStateManager
 * responsible for the state of a transaction and
 * storing the transaction
 * - pendingTxTracker
 * watching blocks for transactions to be include
 * and emitting confirmed events
 * - txGasUtil
 * gas calculations and safety buffering
 * - nonceTracker
 * calculating nonces
 *
 * @param {object} opts
 * @param {object} opts.initState - initial transaction list default is an empty array
 * @param {Function} opts.getNetworkState - Get the current network state.
 * @param {Function} opts.onNetworkStateChange - Subscribe to network state change events.
 * @param {object} opts.blockTracker - An instance of eth-blocktracker
 * @param {object} opts.provider - A network provider.
 * @param {Function} opts.signTransaction - function the signs an @ethereumjs/tx
 * @param {object} opts.getPermittedAccounts - get accounts that an origin has permissions for
 * @param {Function} opts.signTransaction - ethTx signer that returns a rawTx
 * @param {number} [opts.txHistoryLimit] - number *optional* for limiting how many transactions are in state
 * @param {object} opts.preferencesStore
 */

export default class TransactionController extends EventEmitter {
  constructor(opts) {
    super();
    this.getNetworkState = opts.getNetworkState;
    this._getCurrentChainId = opts.getCurrentChainId;
    this.getProviderConfig = opts.getProviderConfig;
    this._getCurrentNetworkEIP1559Compatibility =
      opts.getCurrentNetworkEIP1559Compatibility;
    this._getCurrentAccountEIP1559Compatibility =
      opts.getCurrentAccountEIP1559Compatibility;
    this.preferencesStore = opts.preferencesStore || new ObservableStore({});
    this.provider = opts.provider;
    this.getPermittedAccounts = opts.getPermittedAccounts;
    this.blockTracker = opts.blockTracker;
    this.signEthTx = opts.signTransaction;
    this.inProcessOfSigning = new Set();
    this._trackMetaMetricsEvent = opts.trackMetaMetricsEvent;
    this._getParticipateInMetrics = opts.getParticipateInMetrics;
    this._getEIP1559GasFeeEstimates = opts.getEIP1559GasFeeEstimates;
    this.createEventFragment = opts.createEventFragment;
    this.updateEventFragment = opts.updateEventFragment;
    this.finalizeEventFragment = opts.finalizeEventFragment;
    this.getEventFragmentById = opts.getEventFragmentById;
    this.getDeviceModel = opts.getDeviceModel;
    this.getAccountType = opts.getAccountType;
    this.getTokenStandardAndDetails = opts.getTokenStandardAndDetails;

    this.memStore = new ObservableStore({});

    this.resetState = () => {
      this._updateMemstore();
    };

    this.query = new EthQuery(this.provider);

    this.txGasUtil = new TxGasUtil(this.provider);
    this._mapMethods();
    this.txStateManager = new TransactionStateManager({
      initState: opts.initState,
      txHistoryLimit: opts.txHistoryLimit,
      getNetworkState: this.getNetworkState,
      getCurrentChainId: opts.getCurrentChainId,
    });

    this.store = this.txStateManager.store;
    this.nonceTracker = new NonceTracker({
      provider: this.provider,
      blockTracker: this.blockTracker,
      getPendingTransactions: (...args) => {
        const pendingTransactions = this.txStateManager.getPendingTransactions(
          ...args,
        );
        const externalPendingTransactions = opts.getExternalPendingTransactions(
          ...args,
        );
        return [...pendingTransactions, ...externalPendingTransactions];
      },
      getConfirmedTransactions:
        this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    });

    this.pendingTxTracker = new PendingTransactionTracker({
      provider: this.provider,
      nonceTracker: this.nonceTracker,
      publishTransaction: (rawTx) => this.query.sendRawTransaction(rawTx),
      getPendingTransactions: () => {
        const pending = this.txStateManager.getPendingTransactions();
        const approved = this.txStateManager.getApprovedTransactions();
        return [...pending, ...approved];
      },
      approveTransaction: this.approveTransaction.bind(this),
      getCompletedTransactions:
        this.txStateManager.getConfirmedTransactions.bind(this.txStateManager),
    });

    this.txStateManager.store.subscribe(() =>
      this.emit(METAMASK_CONTROLLER_EVENTS.UPDATE_BADGE),
    );
    this._setupListeners();
    // memstore is computed from a few different stores
    this._updateMemstore();
    this.txStateManager.store.subscribe(() => this._updateMemstore());
    opts.onNetworkStateChange(() => {
      this._onBootCleanUp();
      this._updateMemstore();
    });

    // request state update to finalize initialization
    this._updatePendingTxsAfterFirstBlock();
    this._onBootCleanUp();
  }

  /**
   * Gets the current chainId in the network store as a number, returning 0 if
   * the chainId parses to NaN.
   *
   * @returns {number} The numerical chainId.
   */
  getChainId() {
    const networkState = this.getNetworkState();
    const chainId = this._getCurrentChainId();
    const integerChainId = parseInt(chainId, 16);
    if (networkState === 'loading' || Number.isNaN(integerChainId)) {
      return 0;
    }
    return integerChainId;
  }

  async getEIP1559Compatibility(fromAddress) {
    const currentNetworkIsCompatible =
      await this._getCurrentNetworkEIP1559Compatibility();
    const fromAccountIsCompatible =
      await this._getCurrentAccountEIP1559Compatibility(fromAddress);
    return currentNetworkIsCompatible && fromAccountIsCompatible;
  }

  /**
   * `@ethereumjs/tx` uses `@ethereumjs/common` as a configuration tool for
   * specifying which chain, network, hardfork and EIPs to support for
   * a transaction. By referencing this configuration, and analyzing the fields
   * specified in txParams, `@ethereumjs/tx` is able to determine which EIP-2718
   * transaction type to use.
   *
   * @param fromAddress
   * @returns {Common} common configuration object
   */
  async getCommonConfiguration(fromAddress) {
    const { type, nickname: name } = this.getProviderConfig();
    const supportsEIP1559 = await this.getEIP1559Compatibility(fromAddress);

    // This logic below will have to be updated each time a hardfork happens
    // that carries with it a new Transaction type. It is inconsequential for
    // hardforks that do not include new types.
    const hardfork = supportsEIP1559 ? HARDFORKS.LONDON : HARDFORKS.BERLIN;

    // type will be one of our default network names or 'rpc'. the default
    // network names are sufficient configuration, simply pass the name as the
    // chain argument in the constructor.
    if (type !== NETWORK_TYPES.RPC && type !== NETWORK_TYPES.SEPOLIA) {
      return new Common({
        chain: type,
        hardfork,
      });
    }

    // For 'rpc' we need to use the same basic configuration as mainnet,
    // since we only support EVM compatible chains, and then override the
    // name, chainId and networkId properties. This is done using the
    // `forCustomChain` static method on the Common class.
    const chainId = parseInt(this._getCurrentChainId(), 16);
    const networkId = this.getNetworkState();

    const customChainParams = {
      name,
      chainId,
      // It is improbable for a transaction to be signed while the network
      // is loading for two reasons.
      // 1. Pending, unconfirmed transactions are wiped on network change
      // 2. The UI is unusable (loading indicator) when network is loading.
      // setting the networkId to 0 is for type safety and to explicity lead
      // the transaction to failing if a user is able to get to this branch
      // on a custom network that requires valid network id. I have not ran
      // into this limitation on any network I have attempted, even when
      // hardcoding networkId to 'loading'.
      networkId: networkId === 'loading' ? 0 : parseInt(networkId, 10),
    };

    return Common.forCustomChain(
      NETWORK_TYPES.MAINNET,
      customChainParams,
      hardfork,
    );
  }

  /**
   * Adds a tx to the txlist
   *
   * @param txMeta
   * @fires ${txMeta.id}:unapproved
   */
  addTransaction(txMeta) {
    this.txStateManager.addTransaction(txMeta);
    this.emit(`${txMeta.id}:unapproved`, txMeta);
    this._trackTransactionMetricsEvent(
      txMeta,
      TransactionMetaMetricsEvent.added,
      txMeta.actionId,
    );
  }

  /**
   * Wipes the transactions for a given account
   *
   * @param {string} address - hex string of the from address for txs being removed
   */
  wipeTransactions(address) {
    this.txStateManager.wipeTransactions(address);
  }

  /**
   * Add a new unapproved transaction to the pipeline
   *
   * @returns {Promise<string>} the hash of the transaction after being submitted to the network
   * @param {object} txParams - txParams for the transaction
   * @param {object} opts - with the key origin to put the origin on the txMeta
   */
  async newUnapprovedTransaction(txParams, opts = {}) {
    log.debug(
      `MetaMaskController newUnapprovedTransaction ${JSON.stringify(txParams)}`,
    );

    const initialTxMeta = await this.addUnapprovedTransaction(
      txParams,
      opts.origin,
      undefined,
      undefined,
      opts.id,
    );

    // listen for tx completion (success, fail)
    return new Promise((resolve, reject) => {
      this.txStateManager.once(
        `${initialTxMeta.id}:finished`,
        (finishedTxMeta) => {
          switch (finishedTxMeta.status) {
            case TransactionStatus.submitted:
              return resolve(finishedTxMeta.hash);
            case TransactionStatus.rejected:
              return reject(
                cleanErrorStack(
                  ethErrors.provider.userRejectedRequest(
                    'MetaMask Tx Signature: User denied transaction signature.',
                  ),
                ),
              );
            case TransactionStatus.failed:
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(finishedTxMeta.err.message),
                ),
              );
            default:
              return reject(
                cleanErrorStack(
                  ethErrors.rpc.internal(
                    `MetaMask Tx Signature: Unknown problem: ${JSON.stringify(
                      finishedTxMeta.txParams,
                    )}`,
                  ),
                ),
              );
          }
        },
      );
    });
  }

  // ====================================================================================================================================================

  /**
   * @param {number} txId
   * @returns {TransactionMeta} the txMeta who matches the given id if none found
   * for the network returns undefined
   */
  _getTransaction(txId) {
    const { transactions } = this.store.getState();
    return transactions[txId];
  }

  /**
   * @param {number} txId
   * @returns {boolean}
   */
  _isUnapprovedTransaction(txId) {
    return (
      this.txStateManager.getTransaction(txId).status ===
      TransactionStatus.unapproved
    );
  }

  /**
   * @param {number} txId
   * @param {string} fnName
   */
  _throwErrorIfNotUnapprovedTx(txId, fnName) {
    if (!this._isUnapprovedTransaction(txId)) {
      throw new Error(
        `TransactionsController: Can only call ${fnName} on an unapproved transaction.
         Current tx status: ${this.txStateManager.getTransaction(txId).status}`,
      );
    }
  }

  _updateTransaction(txId, proposedUpdate, note) {
    const txMeta = this.txStateManager.getTransaction(txId);
    const updated = merge(txMeta, proposedUpdate);
    this.txStateManager.updateTransaction(updated, note);
  }

  /**
   * updates the params that are editible in the send edit flow
   *
   * @param {string} txId - transaction id
   * @param {object} previousGasParams - holds the parameter to update
   * @param {string} previousGasParams.maxFeePerGas
   * @param {string} previousGasParams.maxPriorityFeePerGas
   * @param {string} previousGasParams.gasLimit
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updatePreviousGasParams(
    txId,
    { maxFeePerGas, maxPriorityFeePerGas, gasLimit },
  ) {
    const previousGasParams = {
      previousGas: {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
      },
    };

    // only update what is defined
    previousGasParams.previousGas = pickBy(previousGasParams.previousGas);
    const note = `Update Previous Gas for ${txId}`;
    this._updateTransaction(txId, previousGasParams, note);
    return this._getTransaction(txId);
  }

  /**
   *
   * @param {string} txId - transaction id
   * @param {object} editableParams - holds the eip1559 fees parameters
   * @param {object} editableParams.data
   * @param {string} editableParams.from
   * @param {string} editableParams.to
   * @param {string} editableParams.value
   * @param {string} editableParams.gas
   * @param {string} editableParams.gasPrice
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  async updateEditableParams(txId, { data, from, to, value, gas, gasPrice }) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateEditableParams');

    const editableParams = {
      txParams: {
        data,
        from,
        to,
        value,
        gas,
        gasPrice,
      },
    };

    // only update what is defined
    editableParams.txParams = pickBy(
      editableParams.txParams,
      (prop) => prop !== undefined,
    );

    // update transaction type in case it has changes
    const transactionBeforeEdit = this._getTransaction(txId);
    const { type } = await determineTransactionType(
      {
        ...transactionBeforeEdit.txParams,
        ...editableParams.txParams,
      },
      this.query,
    );
    editableParams.type = type;

    const note = `Update Editable Params for ${txId}`;

    this._updateTransaction(txId, editableParams, note);
    return this._getTransaction(txId);
  }

  /**
   * updates the gas fees of the transaction with id if the transaction state is unapproved
   *
   * @param {string} txId - transaction id
   * @param {object} txGasFees - holds the gas fees parameters
   * @param {string} txGasFees.gasLimit
   * @param {string} txGasFees.gasPrice
   * @param {string} txGasFees.maxPriorityFeePerGas
   * @param {string} txGasFees.maxFeePerGas
   * @param {string} txGasFees.estimateUsed
   * @param {string} txGasFees.estimateSuggested
   * @param {string} txGasFees.defaultGasEstimates
   * @param {string} txGasFees.gas
   * @param {string} txGasFees.originalGasEstimate
   * @param {string} txGasFees.userEditedGasLimit
   * @param {string} txGasFees.userFeeLevel
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateTransactionGasFees(
    txId,
    {
      gas,
      gasLimit,
      gasPrice,
      maxPriorityFeePerGas,
      maxFeePerGas,
      estimateUsed,
      estimateSuggested,
      defaultGasEstimates,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel,
    },
  ) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateTransactionGasFees');

    let txGasFees = {
      txParams: {
        gas,
        gasLimit,
        gasPrice,
        maxPriorityFeePerGas,
        maxFeePerGas,
      },
      estimateUsed,
      estimateSuggested,
      defaultGasEstimates,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel,
    };

    // only update what is defined
    txGasFees.txParams = pickBy(txGasFees.txParams);
    txGasFees = pickBy(txGasFees);
    const note = `Update Transaction Gas Fees for ${txId}`;
    this._updateTransaction(txId, txGasFees, note);
    return this._getTransaction(txId);
  }

  /**
   * updates the estimate base fees of the transaction with id if the transaction state is unapproved
   *
   * @param {string} txId - transaction id
   * @param {object} txEstimateBaseFees - holds the estimate base fees parameters
   * @param {string} txEstimateBaseFees.estimatedBaseFee
   * @param {string} txEstimateBaseFees.decEstimatedBaseFee
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateTransactionEstimatedBaseFee(
    txId,
    { estimatedBaseFee, decEstimatedBaseFee },
  ) {
    this._throwErrorIfNotUnapprovedTx(
      txId,
      'updateTransactionEstimatedBaseFee',
    );

    let txEstimateBaseFees = { estimatedBaseFee, decEstimatedBaseFee };
    // only update what is defined
    txEstimateBaseFees = pickBy(txEstimateBaseFees);

    const note = `Update Transaction Estimated Base Fees for ${txId}`;
    this._updateTransaction(txId, txEstimateBaseFees, note);
    return this._getTransaction(txId);
  }

  /**
   * updates a swap approval transaction with provided metadata and source token symbol
   *  if the transaction state is unapproved.
   *
   * @param {string} txId
   * @param {object} swapApprovalTransaction - holds the metadata and token symbol
   * @param {string} swapApprovalTransaction.type
   * @param {string} swapApprovalTransaction.sourceTokenSymbol
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateSwapApprovalTransaction(txId, { type, sourceTokenSymbol }) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateSwapApprovalTransaction');

    let swapApprovalTransaction = { type, sourceTokenSymbol };
    // only update what is defined
    swapApprovalTransaction = pickBy(swapApprovalTransaction);

    const note = `Update Swap Approval Transaction for ${txId}`;
    this._updateTransaction(txId, swapApprovalTransaction, note);
    return this._getTransaction(txId);
  }

  /**
   * updates a swap transaction with provided metadata and source token symbol
   *  if the transaction state is unapproved.
   *
   * @param {string} txId
   * @param {object} swapTransaction - holds the metadata
   * @param {string} swapTransaction.sourceTokenSymbol
   * @param {string} swapTransaction.destinationTokenSymbol
   * @param {string} swapTransaction.type
   * @param {string} swapTransaction.destinationTokenDecimals
   * @param {string} swapTransaction.destinationTokenAddress
   * @param {string} swapTransaction.swapMetaData
   * @param {string} swapTransaction.swapTokenValue
   * @param {string} swapTransaction.estimatedBaseFee
   * @param {string} swapTransaction.approvalTxId
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateSwapTransaction(
    txId,
    {
      sourceTokenSymbol,
      destinationTokenSymbol,
      type,
      destinationTokenDecimals,
      destinationTokenAddress,
      swapMetaData,
      swapTokenValue,
      estimatedBaseFee,
      approvalTxId,
    },
  ) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateSwapTransaction');

    let swapTransaction = {
      sourceTokenSymbol,
      destinationTokenSymbol,
      type,
      destinationTokenDecimals,
      destinationTokenAddress,
      swapMetaData,
      swapTokenValue,
      estimatedBaseFee,
      approvalTxId,
    };

    // only update what is defined
    swapTransaction = pickBy(swapTransaction);

    const note = `Update Swap Transaction for ${txId}`;
    this._updateTransaction(txId, swapTransaction, note);
    return this._getTransaction(txId);
  }

  /**
   * updates a transaction's user settings only if the transaction state is unapproved
   *
   * @param {string} txId
   * @param {object} userSettings - holds the metadata
   * @param {string} userSettings.userEditedGasLimit
   * @param {string} userSettings.userFeeLevel
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateTransactionUserSettings(txId, { userEditedGasLimit, userFeeLevel }) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateTransactionUserSettings');

    let userSettings = { userEditedGasLimit, userFeeLevel };
    // only update what is defined
    userSettings = pickBy(userSettings);

    const note = `Update User Settings for ${txId}`;
    this._updateTransaction(txId, userSettings, note);
    return this._getTransaction(txId);
  }

  /**
   * append new sendFlowHistory to the transaction with id if the transaction
   * state is unapproved. Returns the updated transaction.
   *
   * @param {string} txId - transaction id
   * @param {number} currentSendFlowHistoryLength - sendFlowHistory entries currently
   * @param {Array<{ entry: string, timestamp: number }>} sendFlowHistory -
   *  history to add to the sendFlowHistory property of txMeta.
   * @returns {TransactionMeta} the txMeta of the updated transaction
   */
  updateTransactionSendFlowHistory(
    txId,
    currentSendFlowHistoryLength,
    sendFlowHistory,
  ) {
    this._throwErrorIfNotUnapprovedTx(txId, 'updateTransactionSendFlowHistory');
    const txMeta = this._getTransaction(txId);

    if (
      currentSendFlowHistoryLength === (txMeta?.sendFlowHistory?.length || 0)
    ) {
      // only update what is defined
      const note = `Update sendFlowHistory for ${txId}`;

      this.txStateManager.updateTransaction(
        {
          ...txMeta,
          sendFlowHistory: [
            ...(txMeta?.sendFlowHistory ?? []),
            ...sendFlowHistory,
          ],
        },
        note,
      );
    }
    return this._getTransaction(txId);
  }

  async addTransactionGasDefaults(txMeta) {
    const contractCode = await determineTransactionContractCode(
      txMeta.txParams,
      this.query,
    );

    let updateTxMeta = txMeta;
    try {
      updateTxMeta = await this.addTxGasDefaults(txMeta, contractCode);
    } catch (error) {
      log.warn(error);
      updateTxMeta = this.txStateManager.getTransaction(txMeta.id);
      updateTxMeta.loadingDefaults = false;
      this.txStateManager.updateTransaction(
        txMeta,
        'Failed to calculate gas defaults.',
      );
      throw error;
    }

    updateTxMeta.loadingDefaults = false;

    // The history note used here 'Added new unapproved transaction.' is confusing update call only updated the gas defaults.
    // We need to improve `this.addTransaction` to accept history note and change note here.
    this.txStateManager.updateTransaction(
      updateTxMeta,
      'Added new unapproved transaction.',
    );

    return updateTxMeta;
  }

  // ====================================================================================================================================================

  /**
   * Validates and generates a txMeta with defaults and puts it in txStateManager
   * store.
   *
   * actionId is used to uniquely identify a request to create a transaction.
   * Only 1 transaction will be created for multiple requests with same actionId.
   * actionId is fix used for making this action idempotent to deal with scenario when
   * action is invoked multiple times with same parameters in MV3 due to service worker re-activation.
   *
   * @param txParams
   * @param origin
   * @param transactionType
   * @param sendFlowHistory
   * @param actionId
   * @returns {txMeta}
   */
  async addUnapprovedTransaction(
    txParams,
    origin,
    transactionType,
    sendFlowHistory = [],
    actionId,
  ) {
    if (
      transactionType !== undefined &&
      !VALID_UNAPPROVED_TRANSACTION_TYPES.includes(transactionType)
    ) {
      throw new Error(
        `TransactionController - invalid transactionType value: ${transactionType}`,
      );
    }

    // If a transaction is found with the same actionId, do not create a new speed-up transaction.
    if (actionId) {
      let existingTxMeta =
        this.txStateManager.getTransactionWithActionId(actionId);
      if (existingTxMeta) {
        this.emit('newUnapprovedTx', existingTxMeta);
        existingTxMeta = await this.addTransactionGasDefaults(existingTxMeta);
        return existingTxMeta;
      }
    }

    // validate
    const normalizedTxParams = txUtils.normalizeTxParams(txParams);
    const eip1559Compatibility = await this.getEIP1559Compatibility();

    txUtils.validateTxParams(normalizedTxParams, eip1559Compatibility);

    /**
     * `generateTxMeta` adds the default txMeta properties to the passed object.
     * These include the tx's `id`. As we use the id for determining order of
     * txes in the tx-state-manager, it is necessary to call the asynchronous
     * method `determineTransactionType` after `generateTxMeta`.
     */
    let txMeta = this.txStateManager.generateTxMeta({
      txParams: normalizedTxParams,
      origin,
      sendFlowHistory,
    });

    // Add actionId to txMeta to check if same actionId is seen again
    // IF request to create transaction with same actionId is submitted again, new transaction will not be added for it.
    if (actionId) {
      txMeta.actionId = actionId;
    }

    if (origin === ORIGIN_METAMASK) {
      // Assert the from address is the selected address
      if (normalizedTxParams.from !== this.getSelectedAddress()) {
        throw ethErrors.rpc.internal({
          message: `Internally initiated transaction is using invalid account.`,
          data: {
            origin,
            fromAddress: normalizedTxParams.from,
            selectedAddress: this.getSelectedAddress(),
          },
        });
      }
    } else {
      // Assert that the origin has permissions to initiate transactions from
      // the specified address
      const permittedAddresses = await this.getPermittedAccounts(origin);
      if (!permittedAddresses.includes(normalizedTxParams.from)) {
        throw ethErrors.provider.unauthorized({ data: { origin } });
      }
    }

    const { type } = await determineTransactionType(
      normalizedTxParams,
      this.query,
    );
    txMeta.type = transactionType || type;

    // ensure value
    txMeta.txParams.value = txMeta.txParams.value
      ? addHexPrefix(txMeta.txParams.value)
      : '0x0';

    this.addTransaction(txMeta);
    this.emit('newUnapprovedTx', txMeta);

    txMeta = await this.addTransactionGasDefaults(txMeta);

    return txMeta;
  }

  /**
   * Adds the tx gas defaults: gas && gasPrice
   *
   * @param {object} txMeta - the txMeta object
   * @param getCodeResponse
   * @returns {Promise<object>} resolves with txMeta
   */
  async addTxGasDefaults(txMeta, getCodeResponse) {
    const eip1559Compatibility =
      txMeta.txParams.type !== TransactionEnvelopeType.legacy &&
      (await this.getEIP1559Compatibility());
    const {
      gasPrice: defaultGasPrice,
      maxFeePerGas: defaultMaxFeePerGas,
      maxPriorityFeePerGas: defaultMaxPriorityFeePerGas,
    } = await this._getDefaultGasFees(txMeta, eip1559Compatibility);
    const { gasLimit: defaultGasLimit, simulationFails } =
      await this._getDefaultGasLimit(txMeta, getCodeResponse);

    // eslint-disable-next-line no-param-reassign
    txMeta = this.txStateManager.getTransaction(txMeta.id);
    if (simulationFails) {
      txMeta.simulationFails = simulationFails;
    }

    if (eip1559Compatibility) {
      const advancedGasFeeDefaultValues = this.getAdvancedGasFee();
      if (
        Boolean(advancedGasFeeDefaultValues) &&
        !SWAP_TRANSACTION_TYPES.includes(txMeta.type)
      ) {
        txMeta.userFeeLevel = CUSTOM_GAS_ESTIMATE;
        txMeta.txParams.maxFeePerGas = decGWEIToHexWEI(
          advancedGasFeeDefaultValues.maxBaseFee,
        );
        txMeta.txParams.maxPriorityFeePerGas = decGWEIToHexWEI(
          advancedGasFeeDefaultValues.priorityFee,
        );
      } else if (
        txMeta.txParams.gasPrice &&
        !txMeta.txParams.maxFeePerGas &&
        !txMeta.txParams.maxPriorityFeePerGas
      ) {
        // If the dapp has suggested a gas price, but no maxFeePerGas or maxPriorityFeePerGas
        //  then we set maxFeePerGas and maxPriorityFeePerGas to the suggested gasPrice.
        txMeta.txParams.maxFeePerGas = txMeta.txParams.gasPrice;
        txMeta.txParams.maxPriorityFeePerGas = txMeta.txParams.gasPrice;
        if (txMeta.origin === ORIGIN_METAMASK) {
          txMeta.userFeeLevel = CUSTOM_GAS_ESTIMATE;
        } else {
          txMeta.userFeeLevel = PRIORITY_LEVELS.DAPP_SUGGESTED;
        }
      } else {
        if (
          (defaultMaxFeePerGas &&
            defaultMaxPriorityFeePerGas &&
            !txMeta.txParams.maxFeePerGas &&
            !txMeta.txParams.maxPriorityFeePerGas) ||
          txMeta.origin === ORIGIN_METAMASK
        ) {
          txMeta.userFeeLevel = GAS_RECOMMENDATIONS.MEDIUM;
        } else {
          txMeta.userFeeLevel = PRIORITY_LEVELS.DAPP_SUGGESTED;
        }

        if (defaultMaxFeePerGas && !txMeta.txParams.maxFeePerGas) {
          // If the dapp has not set the gasPrice or the maxFeePerGas, then we set maxFeePerGas
          // with the one returned by the gasFeeController, if that is available.
          txMeta.txParams.maxFeePerGas = defaultMaxFeePerGas;
        }

        if (
          defaultMaxPriorityFeePerGas &&
          !txMeta.txParams.maxPriorityFeePerGas
        ) {
          // If the dapp has not set the gasPrice or the maxPriorityFeePerGas, then we set maxPriorityFeePerGas
          // with the one returned by the gasFeeController, if that is available.
          txMeta.txParams.maxPriorityFeePerGas = defaultMaxPriorityFeePerGas;
        }

        if (defaultGasPrice && !txMeta.txParams.maxFeePerGas) {
          // If the dapp has not set the gasPrice or the maxFeePerGas, and no maxFeePerGas is available
          // from the gasFeeController, then we set maxFeePerGas to the defaultGasPrice, assuming it is
          // available.
          txMeta.txParams.maxFeePerGas = defaultGasPrice;
        }

        if (
          txMeta.txParams.maxFeePerGas &&
          !txMeta.txParams.maxPriorityFeePerGas
        ) {
          // If the dapp has not set the gasPrice or the maxPriorityFeePerGas, and no maxPriorityFeePerGas is
          // available from the gasFeeController, then we set maxPriorityFeePerGas to
          // txMeta.txParams.maxFeePerGas, which will either be the gasPrice from the controller, the maxFeePerGas
          // set by the dapp, or the maxFeePerGas from the controller.
          txMeta.txParams.maxPriorityFeePerGas = txMeta.txParams.maxFeePerGas;
        }
      }

      // We remove the gasPrice param entirely when on an eip1559 compatible network

      delete txMeta.txParams.gasPrice;
    } else {
      // We ensure that maxFeePerGas and maxPriorityFeePerGas are not in the transaction params
      // when not on a EIP1559 compatible network

      delete txMeta.txParams.maxPriorityFeePerGas;
      delete txMeta.txParams.maxFeePerGas;
    }

    // If we have gotten to this point, and none of gasPrice, maxPriorityFeePerGas or maxFeePerGas are
    // set on txParams, it means that either we are on a non-EIP1559 network and the dapp didn't suggest
    // a gas price, or we are on an EIP1559 network, and none of gasPrice, maxPriorityFeePerGas or maxFeePerGas
    // were available from either the dapp or the network.
    if (
      defaultGasPrice &&
      !txMeta.txParams.gasPrice &&
      !txMeta.txParams.maxPriorityFeePerGas &&
      !txMeta.txParams.maxFeePerGas
    ) {
      txMeta.txParams.gasPrice = defaultGasPrice;
    }

    if (defaultGasLimit && !txMeta.txParams.gas) {
      txMeta.txParams.gas = defaultGasLimit;
      txMeta.originalGasEstimate = defaultGasLimit;
    }
    txMeta.defaultGasEstimates = {
      estimateType: txMeta.userFeeLevel,
      gas: txMeta.txParams.gas,
      gasPrice: txMeta.txParams.gasPrice,
      maxFeePerGas: txMeta.txParams.maxFeePerGas,
      maxPriorityFeePerGas: txMeta.txParams.maxPriorityFeePerGas,
    };
    return txMeta;
  }

  /**
   * Gets default gas fees, or returns `undefined` if gas fees are already set
   *
   * @param {object} txMeta - The txMeta object
   * @param eip1559Compatibility
   * @returns {Promise<string|undefined>} The default gas price
   */
  async _getDefaultGasFees(txMeta, eip1559Compatibility) {
    if (
      (!eip1559Compatibility && txMeta.txParams.gasPrice) ||
      (eip1559Compatibility &&
        txMeta.txParams.maxFeePerGas &&
        txMeta.txParams.maxPriorityFeePerGas)
    ) {
      return {};
    }

    try {
      const { gasFeeEstimates, gasEstimateType } =
        await this._getEIP1559GasFeeEstimates();
      if (
        eip1559Compatibility &&
        gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET
      ) {
        const {
          medium: { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } = {},
        } = gasFeeEstimates;

        if (suggestedMaxPriorityFeePerGas && suggestedMaxFeePerGas) {
          return {
            maxFeePerGas: decGWEIToHexWEI(suggestedMaxFeePerGas),
            maxPriorityFeePerGas: decGWEIToHexWEI(
              suggestedMaxPriorityFeePerGas,
            ),
          };
        }
      } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
        // The LEGACY type includes low, medium and high estimates of
        // gas price values.
        return {
          gasPrice: decGWEIToHexWEI(gasFeeEstimates.medium),
        };
      } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
        // The ETH_GASPRICE type just includes a single gas price property,
        // which we can assume was retrieved from eth_gasPrice
        return {
          gasPrice: decGWEIToHexWEI(gasFeeEstimates.gasPrice),
        };
      }
    } catch (e) {
      console.error(e);
    }

    const gasPrice = await this.query.gasPrice();

    return { gasPrice: gasPrice && addHexPrefix(gasPrice.toString(16)) };
  }

  /**
   * Gets default gas limit, or debug information about why gas estimate failed.
   *
   * @param {object} txMeta - The txMeta object
   * @returns {Promise<object>} Object containing the default gas limit, or the simulation failure object
   */
  async _getDefaultGasLimit(txMeta) {
    const chainId = this._getCurrentChainId();
    const customNetworkGasBuffer = CHAIN_ID_TO_GAS_LIMIT_BUFFER_MAP[chainId];
    const chainType = getChainType(chainId);

    if (txMeta.txParams.gas) {
      return {};
    } else if (
      txMeta.txParams.to &&
      txMeta.type === TransactionType.simpleSend &&
      chainType !== 'custom' &&
      !txMeta.txParams.data
    ) {
      // This is a standard ether simple send, gas requirement is exactly 21k
      return { gasLimit: GAS_LIMITS.SIMPLE };
    }

    const { blockGasLimit, estimatedGasHex, simulationFails } =
      await this.txGasUtil.analyzeGasUsage(txMeta);

    // add additional gas buffer to our estimation for safety
    const gasLimit = this.txGasUtil.addGasBuffer(
      addHexPrefix(estimatedGasHex),
      blockGasLimit,
      customNetworkGasBuffer,
    );

    return { gasLimit, simulationFails };
  }

  /**
   * Given a TransactionMeta object, generate new gas params such that if the
   * transaction was an EIP1559 transaction, it only has EIP1559 gas fields,
   * otherwise it only has gasPrice. Will use whatever custom values are
   * specified in customGasSettings, or falls back to incrementing by a percent
   * which is defined by specifying a numerator. 11 is a 10% bump, 12 would be
   * a 20% bump, and so on.
   *
   * @param {TransactionMeta} originalTxMeta - Original transaction to use as
   *  base
   * @param {CustomGasSettings} [customGasSettings] - overrides for the gas
   *  fields to use instead of the multiplier
   * @param {number} [incrementNumerator] - Numerator from which to generate a
   *  percentage bump of gas price. E.g 11 would be a 10% bump over base.
   * @returns {{ newGasParams: CustomGasSettings, previousGasParams: CustomGasSettings }}
   */
  generateNewGasParams(
    originalTxMeta,
    customGasSettings = {},
    incrementNumerator = 11,
  ) {
    const { txParams } = originalTxMeta;
    const previousGasParams = {};
    const newGasParams = {};
    if (customGasSettings.gasLimit) {
      newGasParams.gas = customGasSettings?.gas ?? GAS_LIMITS.SIMPLE;
    }

    if (customGasSettings.estimateSuggested) {
      newGasParams.estimateSuggested = customGasSettings.estimateSuggested;
    }

    if (customGasSettings.estimateUsed) {
      newGasParams.estimateUsed = customGasSettings.estimateUsed;
    }

    if (isEIP1559Transaction(originalTxMeta)) {
      previousGasParams.maxFeePerGas = txParams.maxFeePerGas;
      previousGasParams.maxPriorityFeePerGas = txParams.maxPriorityFeePerGas;
      newGasParams.maxFeePerGas =
        customGasSettings?.maxFeePerGas ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.maxFeePerGas),
            incrementNumerator,
            10,
          ),
        );
      newGasParams.maxPriorityFeePerGas =
        customGasSettings?.maxPriorityFeePerGas ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.maxPriorityFeePerGas),
            incrementNumerator,
            10,
          ),
        );
    } else {
      previousGasParams.gasPrice = txParams.gasPrice;
      newGasParams.gasPrice =
        customGasSettings?.gasPrice ||
        bnToHex(
          BnMultiplyByFraction(
            hexToBn(txParams.gasPrice),
            incrementNumerator,
            10,
          ),
        );
    }

    return { previousGasParams, newGasParams };
  }

  /**
   * Creates a new approved transaction to attempt to cancel a previously submitted transaction. The
   * new transaction contains the same nonce as the previous, is a basic ETH transfer of 0x value to
   * the sender's address, and has a higher gasPrice than that of the previous transaction.
   *
   * @param {number} originalTxId - the id of the txMeta that you want to attempt to cancel
   * @param {CustomGasSettings} [customGasSettings] - overrides to use for gas
   *  params instead of allowing this method to generate them
   * @param options
   * @param options.estimatedBaseFee
   * @param options.actionId
   * @returns {txMeta}
   */
  async createCancelTransaction(
    originalTxId,
    customGasSettings,
    { estimatedBaseFee, actionId } = {},
  ) {
    // If transaction is found for same action id, do not create a new cancel transaction.
    if (actionId) {
      const existingTxMeta =
        this.txStateManager.getTransactionWithActionId(actionId);
      if (existingTxMeta) {
        return existingTxMeta;
      }
    }

    const originalTxMeta = this.txStateManager.getTransaction(originalTxId);
    const { txParams } = originalTxMeta;
    const { from, nonce } = txParams;

    const { previousGasParams, newGasParams } = this.generateNewGasParams(
      originalTxMeta,
      {
        ...customGasSettings,
        // We want to override the previous transactions gasLimit because it
        // will now be a simple send instead of whatever it was before such
        // as a token transfer or contract call.
        gasLimit: customGasSettings.gasLimit || GAS_LIMITS.SIMPLE,
      },
    );

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        from,
        to: from,
        nonce,
        value: '0x0',
        ...newGasParams,
      },
      previousGasParams,
      loadingDefaults: false,
      status: TransactionStatus.approved,
      type: TransactionType.cancel,
      actionId,
    });

    if (estimatedBaseFee) {
      newTxMeta.estimatedBaseFee = estimatedBaseFee;
    }

    this.addTransaction(newTxMeta);
    await this.approveTransaction(newTxMeta.id, actionId);
    return newTxMeta;
  }

  /**
   * Creates a new approved transaction to attempt to speed up a previously submitted transaction. The
   * new transaction contains the same nonce as the previous. By default, the new transaction will use
   * the same gas limit and a 10% higher gas price, though it is possible to set a custom value for
   * each instead.
   *
   * @param {number} originalTxId - the id of the txMeta that you want to speed up
   * @param {CustomGasSettings} [customGasSettings] - overrides to use for gas
   *  params instead of allowing this method to generate them
   * @param options
   * @param options.estimatedBaseFee
   * @param options.actionId
   * @returns {txMeta}
   */
  async createSpeedUpTransaction(
    originalTxId,
    customGasSettings,
    { estimatedBaseFee, actionId } = {},
  ) {
    // If transaction is found for same action id, do not create a new speed-up transaction.
    if (actionId) {
      const existingTxMeta =
        this.txStateManager.getTransactionWithActionId(actionId);
      if (existingTxMeta) {
        return existingTxMeta;
      }
    }

    const originalTxMeta = this.txStateManager.getTransaction(originalTxId);
    const { txParams } = originalTxMeta;

    const { previousGasParams, newGasParams } = this.generateNewGasParams(
      originalTxMeta,
      customGasSettings,
    );

    const newTxMeta = this.txStateManager.generateTxMeta({
      txParams: {
        ...txParams,
        ...newGasParams,
      },
      previousGasParams,
      loadingDefaults: false,
      status: TransactionStatus.approved,
      type: TransactionType.retry,
      originalType: originalTxMeta.type,
      actionId,
    });

    if (estimatedBaseFee) {
      newTxMeta.estimatedBaseFee = estimatedBaseFee;
    }

    this.addTransaction(newTxMeta);
    await this.approveTransaction(newTxMeta.id, actionId);
    return newTxMeta;
  }

  /**
   * updates the txMeta in the txStateManager
   *
   * @param {object} txMeta - the updated txMeta
   */
  async updateTransaction(txMeta) {
    this.txStateManager.updateTransaction(
      txMeta,
      'confTx: user updated transaction',
    );
  }

  /**
   * updates and approves the transaction
   *
   * @param {object} txMeta
   * @param {string} actionId
   */
  async updateAndApproveTransaction(txMeta, actionId) {
    this.txStateManager.updateTransaction(
      txMeta,
      'confTx: user approved transaction',
    );
    await this.approveTransaction(txMeta.id, actionId);
  }

  /**
   * sets the tx status to approved
   * auto fills the nonce
   * signs the transaction
   * publishes the transaction
   * if any of these steps fails the tx status will be set to failed
   *
   * @param {number} txId - the tx's Id
   * @param {string} actionId - actionId passed from UI
   */
  async approveTransaction(txId, actionId) {
    // TODO: Move this safety out of this function.
    // Since this transaction is async,
    // we need to keep track of what is currently being signed,
    // So that we do not increment nonce + resubmit something
    // that is already being incremented & signed.
    const txMeta = this.txStateManager.getTransaction(txId);
    if (this.inProcessOfSigning.has(txId)) {
      return;
    }
    this.inProcessOfSigning.add(txId);
    let nonceLock;
    try {
      // approve
      this.txStateManager.setTxStatusApproved(txId);
      // get next nonce
      const fromAddress = txMeta.txParams.from;
      // wait for a nonce
      let { customNonceValue } = txMeta;
      customNonceValue = Number(customNonceValue);
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress);
      // add nonce to txParams
      // if txMeta has previousGasParams then it is a retry at same nonce with
      // higher gas settings and therefor the nonce should not be recalculated
      const nonce = txMeta.previousGasParams
        ? txMeta.txParams.nonce
        : nonceLock.nextNonce;
      const customOrNonce =
        customNonceValue === 0 ? customNonceValue : customNonceValue || nonce;

      txMeta.txParams.nonce = addHexPrefix(customOrNonce.toString(16));
      // add nonce debugging information to txMeta
      txMeta.nonceDetails = nonceLock.nonceDetails;
      if (customNonceValue) {
        txMeta.nonceDetails.customNonceValue = customNonceValue;
      }
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions#approveTransaction',
      );
      // sign transaction
      const rawTx = await this.signTransaction(txId);
      await this.publishTransaction(txId, rawTx, actionId);
      this._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.approved,
        actionId,
      );
      // must set transaction to submitted/failed before releasing lock
      nonceLock.releaseLock();
    } catch (err) {
      // this is try-catch wrapped so that we can guarantee that the nonceLock is released
      try {
        this._failTransaction(txId, err, actionId);
      } catch (err2) {
        log.error(err2);
      }
      // must set transaction to submitted/failed before releasing lock
      if (nonceLock) {
        nonceLock.releaseLock();
      }
      // continue with error chain
      throw err;
    } finally {
      this.inProcessOfSigning.delete(txId);
    }
  }

  async approveTransactionsWithSameNonce(listOfTxParams = []) {
    if (listOfTxParams.length === 0) {
      return '';
    }

    const initialTx = listOfTxParams[0];
    const common = await this.getCommonConfiguration(initialTx.from);
    const initialTxAsEthTx = TransactionFactory.fromTxData(initialTx, {
      common,
    });
    const initialTxAsSerializedHex = bufferToHex(initialTxAsEthTx.serialize());

    if (this.inProcessOfSigning.has(initialTxAsSerializedHex)) {
      return '';
    }
    this.inProcessOfSigning.add(initialTxAsSerializedHex);
    let rawTxes, nonceLock;
    try {
      // TODO: we should add a check to verify that all transactions have the same from address
      const fromAddress = initialTx.from;
      nonceLock = await this.nonceTracker.getNonceLock(fromAddress);
      const nonce = nonceLock.nextNonce;

      rawTxes = await Promise.all(
        listOfTxParams.map((txParams) => {
          txParams.nonce = addHexPrefix(nonce.toString(16));
          return this.signExternalTransaction(txParams);
        }),
      );
    } catch (err) {
      log.error(err);
      // must set transaction to submitted/failed before releasing lock
      // continue with error chain
      throw err;
    } finally {
      if (nonceLock) {
        nonceLock.releaseLock();
      }
      this.inProcessOfSigning.delete(initialTxAsSerializedHex);
    }
    return rawTxes;
  }

  async signExternalTransaction(_txParams) {
    const normalizedTxParams = txUtils.normalizeTxParams(_txParams);
    // add network/chain id
    const chainId = this.getChainId();
    const type = isEIP1559Transaction({ txParams: normalizedTxParams })
      ? TransactionEnvelopeType.feeMarket
      : TransactionEnvelopeType.legacy;
    const txParams = {
      ...normalizedTxParams,
      type,
      gasLimit: normalizedTxParams.gas,
      chainId: new Numeric(chainId, 10).toPrefixedHexString(),
    };
    // sign tx
    const fromAddress = txParams.from;
    const common = await this.getCommonConfiguration(fromAddress);
    const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
    const signedEthTx = await this.signEthTx(unsignedEthTx, fromAddress);

    const rawTx = bufferToHex(signedEthTx.serialize());
    return rawTx;
  }

  /**
   * adds the chain id and signs the transaction and set the status to signed
   *
   * @param {number} txId - the tx's Id
   * @returns {string} rawTx
   */
  async signTransaction(txId) {
    const txMeta = this.txStateManager.getTransaction(txId);
    // add network/chain id
    const chainId = this.getChainId();
    const type = isEIP1559Transaction(txMeta)
      ? TransactionEnvelopeType.feeMarket
      : TransactionEnvelopeType.legacy;
    const txParams = {
      ...txMeta.txParams,
      type,
      chainId,
      gasLimit: txMeta.txParams.gas,
    };
    // sign tx
    const fromAddress = txParams.from;
    const common = await this.getCommonConfiguration(txParams.from);
    const unsignedEthTx = TransactionFactory.fromTxData(txParams, { common });
    const signedEthTx = await this.signEthTx(unsignedEthTx, fromAddress);

    // add r,s,v values for provider request purposes see createMetamaskMiddleware
    // and JSON rpc standard for further explanation
    txMeta.r = bufferToHex(signedEthTx.r);
    txMeta.s = bufferToHex(signedEthTx.s);
    txMeta.v = bufferToHex(signedEthTx.v);

    this.txStateManager.updateTransaction(
      txMeta,
      'transactions#signTransaction: add r, s, v values',
    );

    // set state to signed
    this.txStateManager.setTxStatusSigned(txMeta.id);
    const rawTx = bufferToHex(signedEthTx.serialize());
    return rawTx;
  }

  /**
   * publishes the raw tx and sets the txMeta to submitted
   *
   * @param {number} txId - the tx's Id
   * @param {string} rawTx - the hex string of the serialized signed transaction
   * @returns {Promise<void>}
   * @param {number} actionId - actionId passed from UI
   */
  async publishTransaction(txId, rawTx, actionId) {
    const txMeta = this.txStateManager.getTransaction(txId);
    txMeta.rawTx = rawTx;
    if (txMeta.type === TransactionType.swap) {
      const preTxBalance = await this.query.getBalance(txMeta.txParams.from);
      txMeta.preTxBalance = preTxBalance.toString(16);
    }
    this.txStateManager.updateTransaction(
      txMeta,
      'transactions#publishTransaction',
    );
    let txHash;
    try {
      txHash = await this.query.sendRawTransaction(rawTx);
    } catch (error) {
      if (error.message.toLowerCase().includes('known transaction')) {
        txHash = keccak(toBuffer(addHexPrefix(rawTx), 'hex')).toString('hex');
        txHash = addHexPrefix(txHash);
      } else {
        throw error;
      }
    }
    this.setTxHash(txId, txHash);

    this.txStateManager.setTxStatusSubmitted(txId);

    this._trackTransactionMetricsEvent(
      txMeta,
      TransactionMetaMetricsEvent.submitted,
      actionId,
    );
  }

  async updatePostTxBalance({ txMeta, txId, numberOfAttempts = 6 }) {
    const postTxBalance = await this.query.getBalance(txMeta.txParams.from);
    const latestTxMeta = this.txStateManager.getTransaction(txId);
    const approvalTxMeta = latestTxMeta.approvalTxId
      ? this.txStateManager.getTransaction(latestTxMeta.approvalTxId)
      : null;
    latestTxMeta.postTxBalance = postTxBalance.toString(16);
    const isDefaultTokenAddress = isSwapsDefaultTokenAddress(
      txMeta.destinationTokenAddress,
      txMeta.chainId,
    );
    if (
      isDefaultTokenAddress &&
      txMeta.preTxBalance === latestTxMeta.postTxBalance &&
      numberOfAttempts > 0
    ) {
      setTimeout(() => {
        // If postTxBalance is the same as preTxBalance, try it again.
        this.updatePostTxBalance({
          txMeta,
          txId,
          numberOfAttempts: numberOfAttempts - 1,
        });
      }, UPDATE_POST_TX_BALANCE_TIMEOUT);
    } else {
      this.txStateManager.updateTransaction(
        latestTxMeta,
        'transactions#confirmTransaction - add postTxBalance',
      );
      this._trackSwapsMetrics(latestTxMeta, approvalTxMeta);
    }
  }

  /**
   * Sets the status of the transaction to confirmed and sets the status of nonce duplicates as
   * dropped if the txParams have data it will fetch the txReceipt
   *
   * @param {number} txId - The tx's ID
   * @param txReceipt
   * @param baseFeePerGas
   * @param blockTimestamp
   * @returns {Promise<void>}
   */
  async confirmTransaction(txId, txReceipt, baseFeePerGas, blockTimestamp) {
    // get the txReceipt before marking the transaction confirmed
    // to ensure the receipt is gotten before the ui revives the tx
    const txMeta = this.txStateManager.getTransaction(txId);

    if (!txMeta) {
      return;
    }

    try {
      const gasUsed = txUtils.normalizeTxReceiptGasUsed(txReceipt.gasUsed);

      txMeta.txReceipt = {
        ...txReceipt,
        gasUsed,
      };

      if (baseFeePerGas) {
        txMeta.baseFeePerGas = baseFeePerGas;
      }
      if (blockTimestamp) {
        txMeta.blockTimestamp = blockTimestamp;
      }

      this.txStateManager.setTxStatusConfirmed(txId);
      this._markNonceDuplicatesDropped(txId);

      const { submittedTime } = txMeta;
      const metricsParams = { gas_used: gasUsed };

      if (submittedTime) {
        metricsParams.completion_time =
          this._getTransactionCompletionTime(submittedTime);
      }

      if (txReceipt.status === '0x0') {
        metricsParams.status = METRICS_STATUS_FAILED;
        // metricsParams.error = TODO: figure out a way to get the on-chain failure reason
      }

      this._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.finalized,
        undefined,
        metricsParams,
      );

      this.txStateManager.updateTransaction(
        txMeta,
        'transactions#confirmTransaction - add txReceipt',
      );

      if (txMeta.type === TransactionType.swap) {
        await this.updatePostTxBalance({
          txMeta,
          txId,
        });
      }
    } catch (err) {
      log.error(err);
    }
  }

  async confirmExternalTransaction(txMeta, txReceipt, baseFeePerGas) {
    // add external transaction
    await this.txStateManager.addExternalTransaction(txMeta);

    if (!txMeta) {
      return;
    }

    const txId = txMeta.id;

    try {
      const gasUsed = txUtils.normalizeTxReceiptGasUsed(txReceipt.gasUsed);

      txMeta.txReceipt = {
        ...txReceipt,
        gasUsed,
      };

      if (baseFeePerGas) {
        txMeta.baseFeePerGas = baseFeePerGas;
      }

      this.txStateManager.setTxStatusConfirmed(txId);
      this._markNonceDuplicatesDropped(txId);

      const { submittedTime } = txMeta;
      const metricsParams = { gas_used: gasUsed };

      if (submittedTime) {
        metricsParams.completion_time =
          this._getTransactionCompletionTime(submittedTime);
      }

      if (txReceipt.status === '0x0') {
        metricsParams.status = METRICS_STATUS_FAILED;
        // metricsParams.error = TODO: figure out a way to get the on-chain failure reason
      }

      this._trackTransactionMetricsEvent(
        txMeta,
        TransactionMetaMetricsEvent.finalized,
        undefined,
        metricsParams,
      );

      this.txStateManager.updateTransaction(
        txMeta,
        'transactions#confirmTransaction - add txReceipt',
      );

      if (txMeta.type === TransactionType.swap) {
        await this.updatePostTxBalance({
          txMeta,
          txId,
        });
      }
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * Convenience method for the ui thats sets the transaction to rejected
   *
   * @param {number} txId - the tx's Id
   * @param {string} actionId - actionId passed from UI
   * @returns {Promise<void>}
   */
  async cancelTransaction(txId, actionId) {
    const txMeta = this.txStateManager.getTransaction(txId);
    this.txStateManager.setTxStatusRejected(txId);
    this._trackTransactionMetricsEvent(
      txMeta,
      TransactionMetaMetricsEvent.rejected,
      actionId,
    );
  }

  /**
   * Sets the txHas on the txMeta
   *
   * @param {number} txId - the tx's Id
   * @param {string} txHash - the hash for the txMeta
   */
  setTxHash(txId, txHash) {
    // Add the tx hash to the persisted meta-tx object
    const txMeta = this.txStateManager.getTransaction(txId);
    txMeta.hash = txHash;
    this.txStateManager.updateTransaction(txMeta, 'transactions#setTxHash');
  }

  /**
   * Convenience method for the UI to easily create event fragments when the
   * fragment does not exist in state.
   *
   * @param {number} transactionId - The transaction id to create the event
   *  fragment for
   * @param {valueOf<TransactionMetaMetricsEvent>} event - event type to create
   * @param {string} actionId - actionId passed from UI
   */
  async createTransactionEventFragment(transactionId, event, actionId) {
    const txMeta = this.txStateManager.getTransaction(transactionId);
    const { properties, sensitiveProperties } =
      await this._buildEventFragmentProperties(txMeta);
    this._createTransactionEventFragment(
      txMeta,
      event,
      properties,
      sensitiveProperties,
      actionId,
    );
  }

  //
  //           PRIVATE METHODS
  //
  /** maps methods for convenience*/
  _mapMethods() {
    /** @returns {object} the state in transaction controller */
    this.getState = () => this.memStore.getState();

    /** @returns {string} the user selected address */
    this.getSelectedAddress = () =>
      this.preferencesStore.getState().selectedAddress;

    /** @returns {Array} transactions whos status is unapproved */
    this.getUnapprovedTxCount = () =>
      Object.keys(this.txStateManager.getUnapprovedTxList()).length;

    /**
     * @returns {number} number of transactions that have the status submitted
     * @param {string} account - hex prefixed account
     */
    this.getPendingTxCount = (account) =>
      this.txStateManager.getPendingTransactions(account).length;

    /**
     * see txStateManager
     *
     * @param opts
     */
    this.getTransactions = (opts) => this.txStateManager.getTransactions(opts);

    /** @returns {object} the saved default values for advancedGasFee */
    this.getAdvancedGasFee = () =>
      this.preferencesStore.getState().advancedGasFee;
  }

  // called once on startup
  async _updatePendingTxsAfterFirstBlock() {
    // wait for first block so we know we're ready
    await this.blockTracker.getLatestBlock();
    // get status update for all pending transactions (for the current network)
    await this.pendingTxTracker.updatePendingTxs();
  }

  /**
   * If transaction controller was rebooted with transactions that are uncompleted
   * in steps of the transaction signing or user confirmation process it will either
   * transition txMetas to a failed state or try to redo those tasks.
   */

  _onBootCleanUp() {
    this.txStateManager
      .getTransactions({
        searchCriteria: {
          status: TransactionStatus.unapproved,
          loadingDefaults: true,
        },
      })
      .forEach((tx) => {
        this.addTxGasDefaults(tx)
          .then((txMeta) => {
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTransaction(
              txMeta,
              'transactions: gas estimation for tx on boot',
            );
          })
          .catch((error) => {
            const txMeta = this.txStateManager.getTransaction(tx.id);
            txMeta.loadingDefaults = false;
            this.txStateManager.updateTransaction(
              txMeta,
              'failed to estimate gas during boot cleanup.',
            );
            this._failTransaction(txMeta.id, error);
          });
      });

    this.txStateManager
      .getTransactions({
        searchCriteria: {
          status: TransactionStatus.approved,
        },
      })
      .forEach((txMeta) => {
        // Line below will try to publish transaction which is in
        // APPROVED state at the time of controller bootup
        this.approveTransaction(txMeta.id);
      });
  }

  /**
   * is called in constructor applies the listeners for pendingTxTracker txStateManager
   * and blockTracker
   */
  _setupListeners() {
    this.txStateManager.on(
      'tx:status-update',
      this.emit.bind(this, 'tx:status-update'),
    );
    this._setupBlockTrackerListener();
    this.pendingTxTracker.on('tx:warning', (txMeta) => {
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:warning',
      );
    });
    this.pendingTxTracker.on('tx:failed', (txId, error) => {
      this._failTransaction(txId, error);
    });
    this.pendingTxTracker.on(
      'tx:confirmed',
      (txId, transactionReceipt, baseFeePerGas, blockTimestamp) =>
        this.confirmTransaction(
          txId,
          transactionReceipt,
          baseFeePerGas,
          blockTimestamp,
        ),
    );
    this.pendingTxTracker.on('tx:dropped', (txId) => {
      this._dropTransaction(txId);
    });
    this.pendingTxTracker.on('tx:block-update', (txMeta, latestBlockNumber) => {
      if (!txMeta.firstRetryBlockNumber) {
        txMeta.firstRetryBlockNumber = latestBlockNumber;
        this.txStateManager.updateTransaction(
          txMeta,
          'transactions/pending-tx-tracker#event: tx:block-update',
        );
      }
    });
    this.pendingTxTracker.on('tx:retry', (txMeta) => {
      if (!('retryCount' in txMeta)) {
        txMeta.retryCount = 0;
      }
      txMeta.retryCount += 1;
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:retry',
      );
    });
  }

  /**
   * Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
   * in the list have the same nonce
   *
   * @param {number} txId - the txId of the transaction that has been confirmed in a block
   */
  _markNonceDuplicatesDropped(txId) {
    // get the confirmed transactions nonce and from address
    const txMeta = this.txStateManager.getTransaction(txId);
    const { nonce, from } = txMeta.txParams;
    const sameNonceTxs = this.txStateManager.getTransactions({
      searchCriteria: { nonce, from },
    });
    if (!sameNonceTxs.length) {
      return;
    }
    // mark all same nonce transactions as dropped and give i a replacedBy hash
    sameNonceTxs.forEach((otherTxMeta) => {
      if (otherTxMeta.id === txId) {
        return;
      }
      otherTxMeta.replacedBy = txMeta.hash;
      otherTxMeta.replacedById = txMeta.id;
      this.txStateManager.updateTransaction(
        txMeta,
        'transactions/pending-tx-tracker#event: tx:confirmed reference to confirmed txHash with same nonce',
      );
      // Drop any transaction that wasn't previously failed (off chain failure)
      if (otherTxMeta.status !== TransactionStatus.failed) {
        this._dropTransaction(otherTxMeta.id);
      }
    });
  }

  _setupBlockTrackerListener() {
    let listenersAreActive = false;
    const latestBlockHandler = this._onLatestBlock.bind(this);
    const { blockTracker, txStateManager } = this;

    txStateManager.on('tx:status-update', updateSubscription);
    updateSubscription();

    function updateSubscription() {
      const pendingTxs = txStateManager.getPendingTransactions();
      if (!listenersAreActive && pendingTxs.length > 0) {
        blockTracker.on('latest', latestBlockHandler);
        listenersAreActive = true;
      } else if (listenersAreActive && !pendingTxs.length) {
        blockTracker.removeListener('latest', latestBlockHandler);
        listenersAreActive = false;
      }
    }
  }

  async _onLatestBlock(blockNumber) {
    try {
      await this.pendingTxTracker.updatePendingTxs();
    } catch (err) {
      log.error(err);
    }
    try {
      await this.pendingTxTracker.resubmitPendingTxs(blockNumber);
    } catch (err) {
      log.error(err);
    }
  }

  /**
   * Updates the memStore in transaction controller
   */
  _updateMemstore() {
    const unapprovedTxs = this.txStateManager.getUnapprovedTxList();
    const currentNetworkTxList = this.txStateManager.getTransactions({
      limit: MAX_MEMSTORE_TX_LIST_SIZE,
    });
    this.memStore.updateState({ unapprovedTxs, currentNetworkTxList });
  }

  _calculateTransactionsCost(txMeta, approvalTxMeta) {
    let approvalGasCost = '0x0';
    if (approvalTxMeta?.txReceipt) {
      approvalGasCost = calcGasTotal(
        approvalTxMeta.txReceipt.gasUsed,
        approvalTxMeta.txReceipt.effectiveGasPrice,
      );
    }
    const tradeGasCost = calcGasTotal(
      txMeta.txReceipt.gasUsed,
      txMeta.txReceipt.effectiveGasPrice,
    );
    const tradeAndApprovalGasCost = new BigNumber(tradeGasCost, 16)
      .plus(approvalGasCost, 16)
      .toString(16);
    return {
      approvalGasCostInEth: Number(hexWEIToDecETH(approvalGasCost)),
      tradeGasCostInEth: Number(hexWEIToDecETH(tradeGasCost)),
      tradeAndApprovalGasCostInEth: Number(
        hexWEIToDecETH(tradeAndApprovalGasCost),
      ),
    };
  }

  _trackSwapsMetrics(txMeta, approvalTxMeta) {
    if (this._getParticipateInMetrics() && txMeta.swapMetaData) {
      if (txMeta.txReceipt.status === '0x0') {
        this._trackMetaMetricsEvent({
          event: 'Swap Failed',
          sensitiveProperties: { ...txMeta.swapMetaData },
          category: EVENT.CATEGORIES.SWAPS,
        });
      } else {
        const tokensReceived = getSwapsTokensReceivedFromTxMeta(
          txMeta.destinationTokenSymbol,
          txMeta,
          txMeta.destinationTokenAddress,
          txMeta.txParams.from,
          txMeta.destinationTokenDecimals,
          approvalTxMeta,
          txMeta.chainId,
        );

        const quoteVsExecutionRatio = tokensReceived
          ? `${new BigNumber(tokensReceived, 10)
              .div(txMeta.swapMetaData.token_to_amount, 10)
              .times(100)
              .round(2)}%`
          : null;

        const estimatedVsUsedGasRatio =
          txMeta.txReceipt.gasUsed && txMeta.swapMetaData.estimated_gas
            ? `${new BigNumber(txMeta.txReceipt.gasUsed, 16)
                .div(txMeta.swapMetaData.estimated_gas, 10)
                .times(100)
                .round(2)}%`
            : null;

        const transactionsCost = this._calculateTransactionsCost(
          txMeta,
          approvalTxMeta,
        );

        this._trackMetaMetricsEvent({
          event: 'Swap Completed',
          category: EVENT.CATEGORIES.SWAPS,
          sensitiveProperties: {
            ...txMeta.swapMetaData,
            token_to_amount_received: tokensReceived,
            quote_vs_executionRatio: quoteVsExecutionRatio,
            estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
            approval_gas_cost_in_eth: transactionsCost.approvalGasCostInEth,
            trade_gas_cost_in_eth: transactionsCost.tradeGasCostInEth,
            trade_and_approval_gas_cost_in_eth:
              transactionsCost.tradeAndApprovalGasCostInEth,
          },
        });
      }
    }
  }

  /**
   * The allowance amount in relation to the dapp proposed amount for specific token
   *
   * @param {string} transactionApprovalAmountType - The transaction approval amount type
   * @param {string} originalApprovalAmount - The original approval amount is the originally dapp proposed token amount
   * @param {string} finalApprovalAmount - The final approval amount is the chosen amount which will be the same as the
   * originally dapp proposed token amount if the user does not edit the amount or will be a custom token amount set by the user
   */
  _allowanceAmountInRelationToDappProposedValue(
    transactionApprovalAmountType,
    originalApprovalAmount,
    finalApprovalAmount,
  ) {
    if (
      transactionApprovalAmountType === TransactionApprovalAmountType.custom &&
      originalApprovalAmount &&
      finalApprovalAmount
    ) {
      return `${new BigNumber(originalApprovalAmount, 10)
        .div(finalApprovalAmount, 10)
        .times(100)
        .round(2)}`;
    }
    return null;
  }

  /**
   * The allowance amount in relation to the balance for that specific token
   *
   * @param {string} transactionApprovalAmountType - The transaction approval amount type
   * @param {string} dappProposedTokenAmount - The dapp proposed token amount
   * @param {string} currentTokenBalance - The balance of the token that is being send
   */
  _allowanceAmountInRelationToTokenBalance(
    transactionApprovalAmountType,
    dappProposedTokenAmount,
    currentTokenBalance,
  ) {
    if (
      (transactionApprovalAmountType === TransactionApprovalAmountType.custom ||
        transactionApprovalAmountType ===
          TransactionApprovalAmountType.dappProposed) &&
      dappProposedTokenAmount &&
      currentTokenBalance
    ) {
      return `${new BigNumber(dappProposedTokenAmount, 16)
        .div(currentTokenBalance, 10)
        .times(100)
        .round(2)}`;
    }
    return null;
  }

  async _buildEventFragmentProperties(txMeta, extraParams) {
    const {
      type,
      time,
      status,
      chainId,
      origin: referrer,
      txParams: {
        gasPrice,
        gas: gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimateSuggested,
        estimateUsed,
      },
      defaultGasEstimates,
      originalType,
      replacedById,
      metamaskNetworkId: network,
      customTokenAmount,
      dappProposedTokenAmount,
      currentTokenBalance,
      originalApprovalAmount,
      finalApprovalAmount,
      contractMethodName,
    } = txMeta;

    const source = referrer === ORIGIN_METAMASK ? 'user' : 'dapp';

    const { assetType, tokenStandard } = await determineTransactionAssetType(
      txMeta,
      this.query,
      this.getTokenStandardAndDetails,
    );

    const gasParams = {};

    if (isEIP1559Transaction(txMeta)) {
      gasParams.max_fee_per_gas = maxFeePerGas;
      gasParams.max_priority_fee_per_gas = maxPriorityFeePerGas;
    } else {
      gasParams.gas_price = gasPrice;
    }

    if (defaultGasEstimates) {
      const { estimateType } = defaultGasEstimates;
      if (estimateType) {
        gasParams.default_estimate = estimateType;
        let defaultMaxFeePerGas = txMeta.defaultGasEstimates.maxFeePerGas;
        let defaultMaxPriorityFeePerGas =
          txMeta.defaultGasEstimates.maxPriorityFeePerGas;

        if (
          [
            GAS_RECOMMENDATIONS.LOW,
            GAS_RECOMMENDATIONS.MEDIUM,
            GAS_RECOMMENDATIONS.MEDIUM.HIGH,
          ].includes(estimateType)
        ) {
          const { gasFeeEstimates } = await this._getEIP1559GasFeeEstimates();
          if (gasFeeEstimates?.[estimateType]?.suggestedMaxFeePerGas) {
            defaultMaxFeePerGas =
              gasFeeEstimates[estimateType]?.suggestedMaxFeePerGas;
            gasParams.default_max_fee_per_gas = defaultMaxFeePerGas;
          }
          if (gasFeeEstimates?.[estimateType]?.suggestedMaxPriorityFeePerGas) {
            defaultMaxPriorityFeePerGas =
              gasFeeEstimates[estimateType]?.suggestedMaxPriorityFeePerGas;
            gasParams.default_max_priority_fee_per_gas =
              defaultMaxPriorityFeePerGas;
          }
        }
      }

      if (txMeta.defaultGasEstimates.gas) {
        gasParams.default_gas = txMeta.defaultGasEstimates.gas;
      }
      if (txMeta.defaultGasEstimates.gasPrice) {
        gasParams.default_gas_price = txMeta.defaultGasEstimates.gasPrice;
      }
    }

    if (estimateSuggested) {
      gasParams.estimate_suggested = estimateSuggested;
    }

    if (estimateUsed) {
      gasParams.estimate_used = estimateUsed;
    }

    if (extraParams?.gas_used) {
      gasParams.gas_used = extraParams.gas_used;
    }

    const gasParamsInGwei = this._getGasValuesInGWEI(gasParams);

    let eip1559Version = '0';
    if (txMeta.txParams.maxFeePerGas) {
      eip1559Version = '2';
    }

    const contractInteractionTypes = [
      TransactionType.contractInteraction,
      TransactionType.tokenMethodApprove,
      TransactionType.tokenMethodSafeTransferFrom,
      TransactionType.tokenMethodSetApprovalForAll,
      TransactionType.tokenMethodTransfer,
      TransactionType.tokenMethodTransferFrom,
      TransactionType.smart,
      TransactionType.swap,
      TransactionType.swapApproval,
    ].includes(type);

    const contractMethodNames = {
      APPROVE: 'Approve',
    };

    let transactionApprovalAmountType;
    let transactionContractMethod;
    let transactionApprovalAmountVsProposedRatio;
    let transactionApprovalAmountVsBalanceRatio;
    let transactionType = TransactionType.simpleSend;
    if (type === TransactionType.cancel) {
      transactionType = TransactionType.cancel;
    } else if (type === TransactionType.retry) {
      transactionType = originalType;
    } else if (type === TransactionType.deployContract) {
      transactionType = TransactionType.deployContract;
    } else if (contractInteractionTypes) {
      transactionType = TransactionType.contractInteraction;
      transactionContractMethod = contractMethodName;
      if (
        transactionContractMethod === contractMethodNames.APPROVE &&
        tokenStandard === TokenStandard.ERC20
      ) {
        if (dappProposedTokenAmount === '0' || customTokenAmount === '0') {
          transactionApprovalAmountType = TransactionApprovalAmountType.revoke;
        } else if (customTokenAmount) {
          transactionApprovalAmountType = TransactionApprovalAmountType.custom;
        } else if (dappProposedTokenAmount) {
          transactionApprovalAmountType =
            TransactionApprovalAmountType.dappProposed;
        }
        transactionApprovalAmountVsProposedRatio =
          this._allowanceAmountInRelationToDappProposedValue(
            transactionApprovalAmountType,
            originalApprovalAmount,
            finalApprovalAmount,
          );
        transactionApprovalAmountVsBalanceRatio =
          this._allowanceAmountInRelationToTokenBalance(
            transactionApprovalAmountType,
            dappProposedTokenAmount,
            currentTokenBalance,
          );
      }
    }

    const replacedTxMeta = this._getTransaction(replacedById);

    const TRANSACTION_REPLACEMENT_METHODS = {
      RETRY: TransactionType.retry,
      CANCEL: TransactionType.cancel,
      SAME_NONCE: 'other',
    };

    let transactionReplaced;
    if (extraParams?.dropped) {
      transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.SAME_NONCE;
      if (replacedTxMeta?.type === TransactionType.cancel) {
        transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.CANCEL;
      } else if (replacedTxMeta?.type === TransactionType.retry) {
        transactionReplaced = TRANSACTION_REPLACEMENT_METHODS.RETRY;
      }
    }

    let properties = {
      chain_id: chainId,
      referrer,
      source,
      network,
      eip_1559_version: eip1559Version,
      gas_edit_type: 'none',
      gas_edit_attempted: 'none',
      account_type: await this.getAccountType(this.getSelectedAddress()),
      device_model: await this.getDeviceModel(this.getSelectedAddress()),
      asset_type: assetType,
      token_standard: tokenStandard,
      transaction_type: transactionType,
      transaction_speed_up: type === TransactionType.retry,
    };

    if (transactionContractMethod === contractMethodNames.APPROVE) {
      properties = {
        ...properties,
        transaction_approval_amount_type: transactionApprovalAmountType,
      };
    }

    let sensitiveProperties = {
      status,
      transaction_envelope_type: isEIP1559Transaction(txMeta)
        ? TRANSACTION_ENVELOPE_TYPE_NAMES.FEE_MARKET
        : TRANSACTION_ENVELOPE_TYPE_NAMES.LEGACY,
      first_seen: time,
      gas_limit: gasLimit,
      transaction_contract_method: transactionContractMethod,
      transaction_replaced: transactionReplaced,
      ...extraParams,
      ...gasParamsInGwei,
    };

    if (transactionContractMethod === contractMethodNames.APPROVE) {
      sensitiveProperties = {
        ...sensitiveProperties,
        transaction_approval_amount_vs_balance_ratio:
          transactionApprovalAmountVsBalanceRatio,
        transaction_approval_amount_vs_proposed_ratio:
          transactionApprovalAmountVsProposedRatio,
      };
    }

    return { properties, sensitiveProperties };
  }

  /**
   * Helper method that checks for the presence of an existing fragment by id
   * appropriate for the type of event that triggered fragment creation. If the
   * appropriate fragment exists, then nothing is done. If it does not exist a
   * new event fragment is created with the appropriate payload.
   *
   * @param {TransactionMeta} txMeta - Transaction meta object
   * @param {TransactionMetaMetricsEvent} event - The event type that
   *  triggered fragment creation
   * @param {object} properties - properties to include in the fragment
   * @param {object} [sensitiveProperties] - sensitive properties to include in
   * @param {object} [actionId] - actionId passed from UI
   *  the fragment
   */
  _createTransactionEventFragment(
    txMeta,
    event,
    properties,
    sensitiveProperties,
    actionId,
  ) {
    const isSubmitted = [
      TransactionMetaMetricsEvent.finalized,
      TransactionMetaMetricsEvent.submitted,
    ].includes(event);
    const uniqueIdentifier = `transaction-${
      isSubmitted ? 'submitted' : 'added'
    }-${txMeta.id}`;

    const fragment = this.getEventFragmentById(uniqueIdentifier);
    if (typeof fragment !== 'undefined') {
      return;
    }

    switch (event) {
      // When a transaction is added to the controller, we know that the user
      // will be presented with a confirmation screen. The user will then
      // either confirm or reject that transaction. Each has an associated
      // event we want to track. While we don't necessarily need an event
      // fragment to model this, having one allows us to record additional
      // properties onto the event from the UI. For example, when the user
      // edits the transactions gas params we can record that property and
      // then get analytics on the number of transactions in which gas edits
      // occur.
      case TransactionMetaMetricsEvent.added:
        this.createEventFragment({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          initialEvent: TransactionMetaMetricsEvent.added,
          successEvent: TransactionMetaMetricsEvent.approved,
          failureEvent: TransactionMetaMetricsEvent.rejected,
          properties,
          sensitiveProperties,
          persist: true,
          uniqueIdentifier,
          actionId,
        });
        break;
      // If for some reason an approval or rejection occurs without the added
      // fragment existing in memory, we create the added fragment but without
      // the initialEvent firing. This is to prevent possible duplication of
      // events. A good example why this might occur is if the user had
      // unapproved transactions in memory when updating to the version that
      // includes this change. A migration would have also helped here but this
      // implementation hardens against other possible bugs where a fragment
      // does not exist.
      case TransactionMetaMetricsEvent.approved:
      case TransactionMetaMetricsEvent.rejected:
        this.createEventFragment({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          successEvent: TransactionMetaMetricsEvent.approved,
          failureEvent: TransactionMetaMetricsEvent.rejected,
          properties,
          sensitiveProperties,
          persist: true,
          uniqueIdentifier,
          actionId,
        });
        break;
      // When a transaction is submitted it will always result in updating
      // to a finalized state (dropped, failed, confirmed) -- eventually.
      // However having a fragment started at this stage allows augmenting
      // analytics data with user interactions such as speeding up and
      // canceling the transactions. From this controllers perspective a new
      // transaction with a new id is generated for speed up and cancel
      // transactions, but from the UI we could augment the previous ID with
      // supplemental data to show user intent. Such as when they open the
      // cancel UI but don't submit. We can record that this happened and add
      // properties to the transaction event.
      case TransactionMetaMetricsEvent.submitted:
        this.createEventFragment({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          initialEvent: TransactionMetaMetricsEvent.submitted,
          successEvent: TransactionMetaMetricsEvent.finalized,
          properties,
          sensitiveProperties,
          persist: true,
          uniqueIdentifier,
          actionId,
        });
        break;
      // If for some reason a transaction is finalized without the submitted
      // fragment existing in memory, we create the submitted fragment but
      // without the initialEvent firing. This is to prevent possible
      // duplication of events. A good example why this might occur is if th
      // user had pending transactions in memory when updating to the version
      // that includes this change. A migration would have also helped here but
      // this implementation hardens against other possible bugs where a
      // fragment does not exist.
      case TransactionMetaMetricsEvent.finalized:
        this.createEventFragment({
          category: EVENT.CATEGORIES.TRANSACTIONS,
          successEvent: TransactionMetaMetricsEvent.finalized,
          properties,
          sensitiveProperties,
          persist: true,
          uniqueIdentifier,
          actionId,
        });
        break;
      default:
        break;
    }
  }

  /**
   * Extracts relevant properties from a transaction meta
   * object and uses them to create and send metrics for various transaction
   * events.
   *
   * @param {object} txMeta - the txMeta object
   * @param {TransactionMetaMetricsEvent} event - the name of the transaction event
   * @param {string} actionId - actionId passed from UI
   * @param {object} extraParams - optional props and values to include in sensitiveProperties
   */
  async _trackTransactionMetricsEvent(
    txMeta,
    event,
    actionId,
    extraParams = {},
  ) {
    if (!txMeta) {
      return;
    }
    const { properties, sensitiveProperties } =
      await this._buildEventFragmentProperties(txMeta, extraParams);

    // Create event fragments for event types that spawn fragments, and ensure
    // existence of fragments for event types that act upon them.
    this._createTransactionEventFragment(
      txMeta,
      event,
      properties,
      sensitiveProperties,
      actionId,
    );

    let id;

    switch (event) {
      // If the user approves a transaction, finalize the transaction added
      // event fragment.
      case TransactionMetaMetricsEvent.approved:
        id = `transaction-added-${txMeta.id}`;
        this.updateEventFragment(id, { properties, sensitiveProperties });
        this.finalizeEventFragment(id);
        break;
      // If the user rejects a transaction, finalize the transaction added
      // event fragment. with the abandoned flag set.
      case TransactionMetaMetricsEvent.rejected:
        id = `transaction-added-${txMeta.id}`;
        this.updateEventFragment(id, { properties, sensitiveProperties });
        this.finalizeEventFragment(id, {
          abandoned: true,
        });
        break;
      // When a transaction is finalized, also finalize the transaction
      // submitted event fragment.
      case TransactionMetaMetricsEvent.finalized:
        id = `transaction-submitted-${txMeta.id}`;
        this.updateEventFragment(id, { properties, sensitiveProperties });
        this.finalizeEventFragment(`transaction-submitted-${txMeta.id}`);
        break;
      default:
        break;
    }
  }

  _getTransactionCompletionTime(submittedTime) {
    return Math.round((Date.now() - submittedTime) / 1000).toString();
  }

  _getGasValuesInGWEI(gasParams) {
    const gasValuesInGwei = {};
    for (const param in gasParams) {
      if (isHexString(gasParams[param])) {
        gasValuesInGwei[param] = hexWEIToDecGWEI(gasParams[param]);
      } else {
        gasValuesInGwei[param] = gasParams[param];
      }
    }
    return gasValuesInGwei;
  }

  _failTransaction(txId, error, actionId) {
    this.txStateManager.setTxStatusFailed(txId, error);
    const txMeta = this.txStateManager.getTransaction(txId);
    this._trackTransactionMetricsEvent(
      txMeta,
      TransactionMetaMetricsEvent.finalized,
      actionId,
      {
        error: error.message,
      },
    );
  }

  _dropTransaction(txId) {
    this.txStateManager.setTxStatusDropped(txId);
    const txMeta = this.txStateManager.getTransaction(txId);
    this._trackTransactionMetricsEvent(
      txMeta,
      TransactionMetaMetricsEvent.finalized,
      undefined,
      {
        dropped: true,
      },
    );
  }
}
