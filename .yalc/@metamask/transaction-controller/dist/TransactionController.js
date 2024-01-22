"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = exports.SPEED_UP_RATE = exports.CANCEL_RATE = exports.HARDFORK = void 0;
const common_1 = require("@ethereumjs/common");
const tx_1 = require("@ethereumjs/tx");
const base_controller_1 = require("@metamask/base-controller");
const controller_utils_1 = require("@metamask/controller-utils");
const eth_query_1 = __importDefault(require("@metamask/eth-query"));
const rpc_errors_1 = require("@metamask/rpc-errors");
const async_mutex_1 = require("async-mutex");
const eth_method_registry_1 = require("eth-method-registry");
const ethereumjs_util_1 = require("ethereumjs-util");
const events_1 = require("events");
const lodash_1 = require("lodash");
const nonce_tracker_1 = require("nonce-tracker");
const uuid_1 = require("uuid");
const EtherscanRemoteTransactionSource_1 = require("./helpers/EtherscanRemoteTransactionSource");
const IncomingTransactionHelper_1 = require("./helpers/IncomingTransactionHelper");
const PendingTransactionTracker_1 = require("./helpers/PendingTransactionTracker");
const logger_1 = require("./logger");
const types_1 = require("./types");
const external_transactions_1 = require("./utils/external-transactions");
const gas_1 = require("./utils/gas");
const gas_fees_1 = require("./utils/gas-fees");
const history_1 = require("./utils/history");
const nonce_1 = require("./utils/nonce");
const swaps_1 = require("./utils/swaps");
const transaction_type_1 = require("./utils/transaction-type");
const utils_1 = require("./utils/utils");
const validation_1 = require("./utils/validation");
exports.HARDFORK = common_1.Hardfork.London;
/**
 * Multiplier used to determine a transaction's increased gas fee during cancellation
 */
exports.CANCEL_RATE = 1.5;
/**
 * Multiplier used to determine a transaction's increased gas fee during speed up
 */
exports.SPEED_UP_RATE = 1.1;
/**
 * The name of the {@link TransactionController}.
 */
const controllerName = 'TransactionController';
/**
 * Controller responsible for submitting and managing transactions.
 */
class TransactionController extends base_controller_1.BaseControllerV1 {
    /**
     * Creates a TransactionController instance.
     *
     * @param options - The controller options.
     * @param options.blockTracker - The block tracker used to poll for new blocks data.
     * @param options.cancelMultiplier - Multiplier used to determine a transaction's increased gas fee during cancellation.
     * @param options.disableHistory - Whether to disable storing history in transaction metadata.
     * @param options.disableSendFlowHistory - Explicitly disable transaction metadata history.
     * @param options.disableSwaps - Whether to disable additional processing on swaps transactions.
     * @param options.getCurrentAccountEIP1559Compatibility - Whether or not the account supports EIP-1559.
     * @param options.getCurrentNetworkEIP1559Compatibility - Whether or not the network supports EIP-1559.
     * @param options.getExternalPendingTransactions - Callback to retrieve pending transactions from external sources.
     * @param options.getGasFeeEstimates - Callback to retrieve gas fee estimates.
     * @param options.getNetworkState - Gets the state of the network controller.
     * @param options.getPermittedAccounts - Get accounts that a given origin has permissions for.
     * @param options.getSavedGasFees - Gets the saved gas fee config.
     * @param options.getSelectedAddress - Gets the address of the currently selected account.
     * @param options.incomingTransactions - Configuration options for incoming transaction support.
     * @param options.incomingTransactions.includeTokenTransfers - Whether or not to include ERC20 token transfers.
     * @param options.incomingTransactions.isEnabled - Whether or not incoming transaction retrieval is enabled.
     * @param options.incomingTransactions.queryEntireHistory - Whether to initially query the entire transaction history or only recent blocks.
     * @param options.incomingTransactions.updateTransactions - Whether to update local transactions using remote transaction data.
     * @param options.messenger - The controller messenger.
     * @param options.onNetworkStateChange - Allows subscribing to network controller state changes.
     * @param options.pendingTransactions - Configuration options for pending transaction support.
     * @param options.pendingTransactions.isResubmitEnabled - Whether transaction publishing is automatically retried.
     * @param options.provider - The provider used to create the underlying EthQuery instance.
     * @param options.securityProviderRequest - A function for verifying a transaction, whether it is malicious or not.
     * @param options.speedUpMultiplier - Multiplier used to determine a transaction's increased gas fee during speed up.
     * @param options.hooks - The controller hooks.
     * @param options.hooks.afterSign - Additional logic to execute after signing a transaction. Return false to not change the status to signed.
     * @param options.hooks.beforeApproveOnInit - Additional logic to execute before starting an approval flow for a transaction during initialization. Return false to skip the transaction.
     * @param options.hooks.beforeCheckPendingTransaction - Additional logic to execute before checking pending transactions. Return false to prevent the broadcast of the transaction.
     * @param options.hooks.beforePublish - Additional logic to execute before publishing a transaction. Return false to prevent the broadcast of the transaction.
     * @param options.hooks.getAdditionalSignArguments - Returns additional arguments required to sign a transaction.
     * @param options.hooks.publish - Alternate logic to publish a transaction.
     * @param config - Initial options used to configure this controller.
     * @param state - Initial state to set on this controller.
     */
    constructor({ blockTracker, cancelMultiplier, disableHistory, disableSendFlowHistory, disableSwaps, getCurrentAccountEIP1559Compatibility, getCurrentNetworkEIP1559Compatibility, getExternalPendingTransactions, getGasFeeEstimates, getNetworkState, getPermittedAccounts, getSavedGasFees, getSelectedAddress, incomingTransactions = {}, messenger, onNetworkStateChange, pendingTransactions = {}, provider, securityProviderRequest, speedUpMultiplier, hooks = {}, }, config, state) {
        var _a, _b, _c, _d, _e, _f;
        super(config, state);
        this.inProcessOfSigning = new Set();
        this.mutex = new async_mutex_1.Mutex();
        /**
         * EventEmitter instance used to listen to specific transactional events
         */
        this.hub = new events_1.EventEmitter();
        /**
         * Name of this controller used during composition
         */
        this.name = 'TransactionController';
        this.defaultConfig = {
            txHistoryLimit: 40,
        };
        this.defaultState = {
            methodData: {},
            transactions: [],
            lastFetchedBlockNumbers: {},
        };
        this.initialize();
        this.provider = provider;
        this.messagingSystem = messenger;
        this.getNetworkState = getNetworkState;
        this.ethQuery = new eth_query_1.default(provider);
        this.isSendFlowHistoryDisabled = disableSendFlowHistory !== null && disableSendFlowHistory !== void 0 ? disableSendFlowHistory : false;
        this.isHistoryDisabled = disableHistory !== null && disableHistory !== void 0 ? disableHistory : false;
        this.isSwapsDisabled = disableSwaps !== null && disableSwaps !== void 0 ? disableSwaps : false;
        // @ts-expect-error the type in eth-method-registry is inappropriate and should be changed
        this.registry = new eth_method_registry_1.MethodRegistry({ provider });
        this.getSavedGasFees = getSavedGasFees !== null && getSavedGasFees !== void 0 ? getSavedGasFees : ((_chainId) => undefined);
        this.getCurrentAccountEIP1559Compatibility =
            getCurrentAccountEIP1559Compatibility !== null && getCurrentAccountEIP1559Compatibility !== void 0 ? getCurrentAccountEIP1559Compatibility : (() => Promise.resolve(true));
        this.getCurrentNetworkEIP1559Compatibility =
            getCurrentNetworkEIP1559Compatibility;
        this.getGasFeeEstimates =
            getGasFeeEstimates || (() => Promise.resolve({}));
        this.getPermittedAccounts = getPermittedAccounts;
        this.getSelectedAddress = getSelectedAddress;
        this.getExternalPendingTransactions =
            getExternalPendingTransactions !== null && getExternalPendingTransactions !== void 0 ? getExternalPendingTransactions : (() => []);
        this.securityProviderRequest = securityProviderRequest;
        this.cancelMultiplier = cancelMultiplier !== null && cancelMultiplier !== void 0 ? cancelMultiplier : exports.CANCEL_RATE;
        this.speedUpMultiplier = speedUpMultiplier !== null && speedUpMultiplier !== void 0 ? speedUpMultiplier : exports.SPEED_UP_RATE;
        this.afterSign = (_a = hooks === null || hooks === void 0 ? void 0 : hooks.afterSign) !== null && _a !== void 0 ? _a : (() => true);
        this.beforeApproveOnInit = (_b = hooks === null || hooks === void 0 ? void 0 : hooks.beforeApproveOnInit) !== null && _b !== void 0 ? _b : (() => true);
        this.beforeCheckPendingTransaction =
            (_c = hooks === null || hooks === void 0 ? void 0 : hooks.beforeCheckPendingTransaction) !== null && _c !== void 0 ? _c : 
            /* istanbul ignore next */
            (() => true);
        this.beforePublish = (_d = hooks === null || hooks === void 0 ? void 0 : hooks.beforePublish) !== null && _d !== void 0 ? _d : (() => true);
        this.getAdditionalSignArguments =
            (_e = hooks === null || hooks === void 0 ? void 0 : hooks.getAdditionalSignArguments) !== null && _e !== void 0 ? _e : (() => []);
        this.publish =
            (_f = hooks === null || hooks === void 0 ? void 0 : hooks.publish) !== null && _f !== void 0 ? _f : (() => Promise.resolve({ transactionHash: undefined }));
        this.nonceTracker = new nonce_tracker_1.NonceTracker({
            // @ts-expect-error provider types misaligned: SafeEventEmitterProvider vs Record<string,string>
            provider,
            blockTracker,
            getPendingTransactions: this.getNonceTrackerPendingTransactions.bind(this),
            getConfirmedTransactions: this.getNonceTrackerTransactions.bind(this, types_1.TransactionStatus.confirmed),
        });
        this.incomingTransactionHelper = new IncomingTransactionHelper_1.IncomingTransactionHelper({
            blockTracker,
            getCurrentAccount: getSelectedAddress,
            getLastFetchedBlockNumbers: () => this.state.lastFetchedBlockNumbers,
            getNetworkState,
            isEnabled: incomingTransactions.isEnabled,
            queryEntireHistory: incomingTransactions.queryEntireHistory,
            remoteTransactionSource: new EtherscanRemoteTransactionSource_1.EtherscanRemoteTransactionSource({
                includeTokenTransfers: incomingTransactions.includeTokenTransfers,
            }),
            transactionLimit: this.config.txHistoryLimit,
            updateTransactions: incomingTransactions.updateTransactions,
        });
        this.incomingTransactionHelper.hub.on('transactions', this.onIncomingTransactions.bind(this));
        this.incomingTransactionHelper.hub.on('updatedLastFetchedBlockNumbers', this.onUpdatedLastFetchedBlockNumbers.bind(this));
        this.pendingTransactionTracker = new PendingTransactionTracker_1.PendingTransactionTracker({
            approveTransaction: this.approveTransaction.bind(this),
            blockTracker,
            getChainId: this.getChainId.bind(this),
            getEthQuery: () => this.ethQuery,
            getTransactions: () => this.state.transactions,
            isResubmitEnabled: pendingTransactions.isResubmitEnabled,
            nonceTracker: this.nonceTracker,
            onStateChange: (listener) => {
                this.subscribe(listener);
                onNetworkStateChange(listener);
                listener();
            },
            publishTransaction: this.publishTransaction.bind(this),
            hooks: {
                beforeCheckPendingTransaction: this.beforeCheckPendingTransaction.bind(this),
                beforePublish: this.beforePublish.bind(this),
            },
        });
        this.addPendingTransactionTrackerListeners();
        onNetworkStateChange(() => {
            (0, logger_1.projectLogger)('Detected network change', this.getChainId());
            this.onBootCleanup();
        });
        this.onBootCleanup();
    }
    failTransaction(transactionMeta, error, actionId) {
        const newTransactionMeta = Object.assign(Object.assign({}, transactionMeta), { error: (0, utils_1.normalizeTxError)(error), status: types_1.TransactionStatus.failed });
        this.hub.emit('transaction-failed', {
            actionId,
            error: error.message,
            transactionMeta: newTransactionMeta,
        });
        this.updateTransaction(newTransactionMeta, 'TransactionController#failTransaction - Add error message and set status to failed');
        this.onTransactionStatusChange(newTransactionMeta);
        this.hub.emit(`${transactionMeta.id}:finished`, newTransactionMeta);
    }
    registryLookup(fourBytePrefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const registryMethod = yield this.registry.lookup(fourBytePrefix);
            const parsedRegistryMethod = this.registry.parse(registryMethod);
            return { registryMethod, parsedRegistryMethod };
        });
    }
    /**
     * Handle new method data request.
     *
     * @param fourBytePrefix - The method prefix.
     * @returns The method data object corresponding to the given signature prefix.
     */
    handleMethodData(fourBytePrefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const { methodData } = this.state;
                const knownMethod = Object.keys(methodData).find((knownFourBytePrefix) => fourBytePrefix === knownFourBytePrefix);
                if (knownMethod) {
                    return methodData[fourBytePrefix];
                }
                const registry = yield this.registryLookup(fourBytePrefix);
                this.update({
                    methodData: Object.assign(Object.assign({}, methodData), { [fourBytePrefix]: registry }),
                });
                return registry;
            }
            finally {
                releaseLock();
            }
        });
    }
    /**
     * Add a new unapproved transaction to state. Parameters will be validated, a
     * unique transaction id will be generated, and gas and gasPrice will be calculated
     * if not provided. If A `<tx.id>:unapproved` hub event will be emitted once added.
     *
     * @param txParams - Standard parameters for an Ethereum transaction.
     * @param opts - Additional options to control how the transaction is added.
     * @param opts.actionId - Unique ID to prevent duplicate requests.
     * @param opts.deviceConfirmedOn - An enum to indicate what device confirmed the transaction.
     * @param opts.method - RPC method that requested the transaction.
     * @param opts.origin - The origin of the transaction request, such as a dApp hostname.
     * @param opts.requireApproval - Whether the transaction requires approval by the user, defaults to true unless explicitly disabled.
     * @param opts.securityAlertResponse - Response from security validator.
     * @param opts.sendFlowHistory - The sendFlowHistory entries to add.
     * @param opts.type - Type of transaction to add, such as 'cancel' or 'swap'.
     * @param opts.swaps - Options for swaps transactions.
     * @param opts.swaps.hasApproveTx - Whether the transaction has an approval transaction.
     * @param opts.swaps.meta - Metadata for swap transaction.
     * @returns Object containing a promise resolving to the transaction hash if approved.
     */
    addTransaction(txParams, { actionId, deviceConfirmedOn, method, origin, requireApproval, securityAlertResponse, sendFlowHistory, swaps = {}, type, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, logger_1.projectLogger)('Adding transaction', txParams);
            txParams = (0, utils_1.normalizeTxParams)(txParams);
            const isEIP1559Compatible = yield this.getEIP1559Compatibility();
            (0, validation_1.validateTxParams)(txParams, isEIP1559Compatible);
            if (origin) {
                yield (0, validation_1.validateTransactionOrigin)(yield this.getPermittedAccounts(origin), this.getSelectedAddress(), txParams.from, origin);
            }
            const dappSuggestedGasFees = this.generateDappSuggestedGasFees(txParams, origin);
            const transactionType = type !== null && type !== void 0 ? type : (yield (0, transaction_type_1.determineTransactionType)(txParams, this.ethQuery)).type;
            const existingTransactionMeta = this.getTransactionWithActionId(actionId);
            const chainId = this.getChainId();
            // If a request to add a transaction with the same actionId is submitted again, a new transaction will not be created for it.
            const transactionMeta = existingTransactionMeta || {
                // Add actionId to txMeta to check if same actionId is seen again
                actionId,
                chainId,
                dappSuggestedGasFees,
                deviceConfirmedOn,
                id: (0, uuid_1.v1)(),
                origin,
                securityAlertResponse,
                status: types_1.TransactionStatus.unapproved,
                time: Date.now(),
                txParams,
                userEditedGasLimit: false,
                verifiedOnBlockchain: false,
                type: transactionType,
            };
            yield this.updateGasProperties(transactionMeta);
            // Checks if a transaction already exists with a given actionId
            if (!existingTransactionMeta) {
                // Set security provider response
                if (method && this.securityProviderRequest) {
                    const securityProviderResponse = yield this.securityProviderRequest(transactionMeta, method);
                    transactionMeta.securityProviderResponse = securityProviderResponse;
                }
                if (!this.isSendFlowHistoryDisabled) {
                    transactionMeta.sendFlowHistory = sendFlowHistory !== null && sendFlowHistory !== void 0 ? sendFlowHistory : [];
                }
                // Initial history push
                if (!this.isHistoryDisabled) {
                    (0, history_1.addInitialHistorySnapshot)(transactionMeta);
                }
                yield (0, swaps_1.updateSwapsTransaction)(transactionMeta, transactionType, swaps, {
                    isSwapsDisabled: this.isSwapsDisabled,
                    cancelTransaction: this.cancelTransaction.bind(this),
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    controllerHubEmitter: this.hub.emit.bind(this.hub),
                });
                this.addMetadata(transactionMeta);
                this.hub.emit(`unapprovedTransaction`, transactionMeta);
            }
            return {
                result: this.processApproval(transactionMeta, {
                    isExisting: Boolean(existingTransactionMeta),
                    requireApproval,
                    actionId,
                }),
                transactionMeta,
            };
        });
    }
    startIncomingTransactionPolling() {
        this.incomingTransactionHelper.start();
    }
    stopIncomingTransactionPolling() {
        this.incomingTransactionHelper.stop();
    }
    updateIncomingTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.incomingTransactionHelper.update();
        });
    }
    /**
     * Attempts to cancel a transaction based on its ID by setting its status to "rejected"
     * and emitting a `<tx.id>:finished` hub event.
     *
     * @param transactionId - The ID of the transaction to cancel.
     * @param gasValues - The gas values to use for the cancellation transaction.
     * @param options - The options for the cancellation transaction.
     * @param options.actionId - Unique ID to prevent duplicate requests.
     * @param options.estimatedBaseFee - The estimated base fee of the transaction.
     */
    stopTransaction(transactionId, gasValues, { estimatedBaseFee, actionId, } = {}) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // If transaction is found for same action id, do not create a cancel transaction.
            if (this.getTransactionWithActionId(actionId)) {
                return;
            }
            if (gasValues) {
                // Not good practice to reassign a parameter but temporarily avoiding a larger refactor.
                gasValues = (0, utils_1.normalizeGasFeeValues)(gasValues);
                (0, utils_1.validateGasValues)(gasValues);
            }
            (0, logger_1.projectLogger)('Creating cancel transaction', transactionId, gasValues);
            const transactionMeta = this.getTransaction(transactionId);
            if (!transactionMeta) {
                return;
            }
            if (!this.sign) {
                throw new Error('No sign method defined.');
            }
            // gasPrice (legacy non EIP1559)
            const minGasPrice = (0, utils_1.getIncreasedPriceFromExisting)(transactionMeta.txParams.gasPrice, this.cancelMultiplier);
            const gasPriceFromValues = (0, utils_1.isGasPriceValue)(gasValues) && gasValues.gasPrice;
            const newGasPrice = (gasPriceFromValues &&
                (0, utils_1.validateMinimumIncrease)(gasPriceFromValues, minGasPrice)) ||
                minGasPrice;
            // maxFeePerGas (EIP1559)
            const existingMaxFeePerGas = (_a = transactionMeta.txParams) === null || _a === void 0 ? void 0 : _a.maxFeePerGas;
            const minMaxFeePerGas = (0, utils_1.getIncreasedPriceFromExisting)(existingMaxFeePerGas, this.cancelMultiplier);
            const maxFeePerGasValues = (0, utils_1.isFeeMarketEIP1559Values)(gasValues) && gasValues.maxFeePerGas;
            const newMaxFeePerGas = (maxFeePerGasValues &&
                (0, utils_1.validateMinimumIncrease)(maxFeePerGasValues, minMaxFeePerGas)) ||
                (existingMaxFeePerGas && minMaxFeePerGas);
            // maxPriorityFeePerGas (EIP1559)
            const existingMaxPriorityFeePerGas = (_b = transactionMeta.txParams) === null || _b === void 0 ? void 0 : _b.maxPriorityFeePerGas;
            const minMaxPriorityFeePerGas = (0, utils_1.getIncreasedPriceFromExisting)(existingMaxPriorityFeePerGas, this.cancelMultiplier);
            const maxPriorityFeePerGasValues = (0, utils_1.isFeeMarketEIP1559Values)(gasValues) && gasValues.maxPriorityFeePerGas;
            const newMaxPriorityFeePerGas = (maxPriorityFeePerGasValues &&
                (0, utils_1.validateMinimumIncrease)(maxPriorityFeePerGasValues, minMaxPriorityFeePerGas)) ||
                (existingMaxPriorityFeePerGas && minMaxPriorityFeePerGas);
            const newTxParams = newMaxFeePerGas && newMaxPriorityFeePerGas
                ? {
                    from: transactionMeta.txParams.from,
                    gasLimit: transactionMeta.txParams.gas,
                    maxFeePerGas: newMaxFeePerGas,
                    maxPriorityFeePerGas: newMaxPriorityFeePerGas,
                    type: types_1.TransactionEnvelopeType.feeMarket,
                    nonce: transactionMeta.txParams.nonce,
                    to: transactionMeta.txParams.from,
                    value: '0x0',
                }
                : {
                    from: transactionMeta.txParams.from,
                    gasLimit: transactionMeta.txParams.gas,
                    gasPrice: newGasPrice,
                    nonce: transactionMeta.txParams.nonce,
                    to: transactionMeta.txParams.from,
                    value: '0x0',
                };
            const unsignedEthTx = this.prepareUnsignedEthTx(newTxParams);
            const signedTx = yield this.sign(unsignedEthTx, transactionMeta.txParams.from);
            const rawTx = (0, ethereumjs_util_1.bufferToHex)(signedTx.serialize());
            const newFee = (_c = newTxParams.maxFeePerGas) !== null && _c !== void 0 ? _c : newTxParams.gasPrice;
            const oldFee = newTxParams.maxFeePerGas
                ? transactionMeta.txParams.maxFeePerGas
                : transactionMeta.txParams.gasPrice;
            (0, logger_1.projectLogger)('Submitting cancel transaction', {
                oldFee,
                newFee,
                txParams: newTxParams,
            });
            const hash = yield this.publishTransaction(rawTx);
            const cancelTransactionMeta = {
                actionId,
                chainId: transactionMeta.chainId,
                estimatedBaseFee,
                hash,
                id: (0, uuid_1.v1)(),
                originalGasEstimate: transactionMeta.txParams.gas,
                status: types_1.TransactionStatus.submitted,
                time: Date.now(),
                type: types_1.TransactionType.cancel,
                txParams: newTxParams,
            };
            this.addMetadata(cancelTransactionMeta);
            // stopTransaction has no approval request, so we assume the user has already approved the transaction
            this.hub.emit('transaction-approved', {
                transactionMeta: cancelTransactionMeta,
                actionId,
            });
            this.hub.emit('transaction-submitted', {
                transactionMeta: cancelTransactionMeta,
                actionId,
            });
            this.hub.emit(`${cancelTransactionMeta.id}:finished`, cancelTransactionMeta);
        });
    }
    /**
     * Attempts to speed up a transaction increasing transaction gasPrice by ten percent.
     *
     * @param transactionId - The ID of the transaction to speed up.
     * @param gasValues - The gas values to use for the speed up transaction.
     * @param options - The options for the speed up transaction.
     * @param options.actionId - Unique ID to prevent duplicate requests
     * @param options.estimatedBaseFee - The estimated base fee of the transaction.
     */
    speedUpTransaction(transactionId, gasValues, { actionId, estimatedBaseFee, } = {}) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            // If transaction is found for same action id, do not create a new speed up transaction.
            if (this.getTransactionWithActionId(actionId)) {
                return;
            }
            if (gasValues) {
                // Not good practice to reassign a parameter but temporarily avoiding a larger refactor.
                gasValues = (0, utils_1.normalizeGasFeeValues)(gasValues);
                (0, utils_1.validateGasValues)(gasValues);
            }
            (0, logger_1.projectLogger)('Creating speed up transaction', transactionId, gasValues);
            const transactionMeta = this.state.transactions.find(({ id }) => id === transactionId);
            /* istanbul ignore next */
            if (!transactionMeta) {
                return;
            }
            /* istanbul ignore next */
            if (!this.sign) {
                throw new Error('No sign method defined.');
            }
            // gasPrice (legacy non EIP1559)
            const minGasPrice = (0, utils_1.getIncreasedPriceFromExisting)(transactionMeta.txParams.gasPrice, this.speedUpMultiplier);
            const gasPriceFromValues = (0, utils_1.isGasPriceValue)(gasValues) && gasValues.gasPrice;
            const newGasPrice = (gasPriceFromValues &&
                (0, utils_1.validateMinimumIncrease)(gasPriceFromValues, minGasPrice)) ||
                minGasPrice;
            // maxFeePerGas (EIP1559)
            const existingMaxFeePerGas = (_a = transactionMeta.txParams) === null || _a === void 0 ? void 0 : _a.maxFeePerGas;
            const minMaxFeePerGas = (0, utils_1.getIncreasedPriceFromExisting)(existingMaxFeePerGas, this.speedUpMultiplier);
            const maxFeePerGasValues = (0, utils_1.isFeeMarketEIP1559Values)(gasValues) && gasValues.maxFeePerGas;
            const newMaxFeePerGas = (maxFeePerGasValues &&
                (0, utils_1.validateMinimumIncrease)(maxFeePerGasValues, minMaxFeePerGas)) ||
                (existingMaxFeePerGas && minMaxFeePerGas);
            // maxPriorityFeePerGas (EIP1559)
            const existingMaxPriorityFeePerGas = (_b = transactionMeta.txParams) === null || _b === void 0 ? void 0 : _b.maxPriorityFeePerGas;
            const minMaxPriorityFeePerGas = (0, utils_1.getIncreasedPriceFromExisting)(existingMaxPriorityFeePerGas, this.speedUpMultiplier);
            const maxPriorityFeePerGasValues = (0, utils_1.isFeeMarketEIP1559Values)(gasValues) && gasValues.maxPriorityFeePerGas;
            const newMaxPriorityFeePerGas = (maxPriorityFeePerGasValues &&
                (0, utils_1.validateMinimumIncrease)(maxPriorityFeePerGasValues, minMaxPriorityFeePerGas)) ||
                (existingMaxPriorityFeePerGas && minMaxPriorityFeePerGas);
            const txParams = newMaxFeePerGas && newMaxPriorityFeePerGas
                ? Object.assign(Object.assign({}, transactionMeta.txParams), { gasLimit: transactionMeta.txParams.gas, maxFeePerGas: newMaxFeePerGas, maxPriorityFeePerGas: newMaxPriorityFeePerGas, type: types_1.TransactionEnvelopeType.feeMarket }) : Object.assign(Object.assign({}, transactionMeta.txParams), { gasLimit: transactionMeta.txParams.gas, gasPrice: newGasPrice });
            const unsignedEthTx = this.prepareUnsignedEthTx(txParams);
            const signedTx = yield this.sign(unsignedEthTx, transactionMeta.txParams.from);
            yield this.updateTransactionMetaRSV(transactionMeta, signedTx);
            const rawTx = (0, ethereumjs_util_1.bufferToHex)(signedTx.serialize());
            const newFee = (_c = txParams.maxFeePerGas) !== null && _c !== void 0 ? _c : txParams.gasPrice;
            const oldFee = txParams.maxFeePerGas
                ? transactionMeta.txParams.maxFeePerGas
                : transactionMeta.txParams.gasPrice;
            (0, logger_1.projectLogger)('Submitting speed up transaction', { oldFee, newFee, txParams });
            const hash = yield (0, controller_utils_1.query)(this.ethQuery, 'sendRawTransaction', [rawTx]);
            const baseTransactionMeta = Object.assign(Object.assign({}, transactionMeta), { estimatedBaseFee, id: (0, uuid_1.v1)(), time: Date.now(), hash,
                actionId, originalGasEstimate: transactionMeta.txParams.gas, type: types_1.TransactionType.retry, originalType: transactionMeta.type });
            const newTransactionMeta = newMaxFeePerGas && newMaxPriorityFeePerGas
                ? Object.assign(Object.assign({}, baseTransactionMeta), { txParams: Object.assign(Object.assign({}, transactionMeta.txParams), { maxFeePerGas: newMaxFeePerGas, maxPriorityFeePerGas: newMaxPriorityFeePerGas }) }) : Object.assign(Object.assign({}, baseTransactionMeta), { txParams: Object.assign(Object.assign({}, transactionMeta.txParams), { gasPrice: newGasPrice }) });
            this.addMetadata(newTransactionMeta);
            // speedUpTransaction has no approval request, so we assume the user has already approved the transaction
            this.hub.emit('transaction-approved', {
                transactionMeta: newTransactionMeta,
                actionId,
            });
            this.hub.emit('transaction-submitted', {
                transactionMeta: newTransactionMeta,
                actionId,
            });
            this.hub.emit(`${transactionMeta.id}:speedup`, newTransactionMeta);
        });
    }
    /**
     * Estimates required gas for a given transaction.
     *
     * @param transaction - The transaction to estimate gas for.
     * @returns The gas and gas price.
     */
    estimateGas(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const { estimatedGas, simulationFails } = yield (0, gas_1.estimateGas)(transaction, this.ethQuery);
            return { gas: estimatedGas, simulationFails };
        });
    }
    /**
     * Estimates required gas for a given transaction and add additional gas buffer with the given multiplier.
     *
     * @param transaction - The transaction params to estimate gas for.
     * @param multiplier - The multiplier to use for the gas buffer.
     */
    estimateGasBuffered(transaction, multiplier) {
        return __awaiter(this, void 0, void 0, function* () {
            const { blockGasLimit, estimatedGas, simulationFails } = yield (0, gas_1.estimateGas)(transaction, this.ethQuery);
            const gas = (0, gas_1.addGasBuffer)(estimatedGas, blockGasLimit, multiplier);
            return {
                gas,
                simulationFails,
            };
        });
    }
    /**
     * Updates an existing transaction in state.
     *
     * @param transactionMeta - The new transaction to store in state.
     * @param note - A note or update reason to include in the transaction history.
     */
    updateTransaction(transactionMeta, note) {
        const { transactions } = this.state;
        transactionMeta.txParams = (0, utils_1.normalizeTxParams)(transactionMeta.txParams);
        (0, validation_1.validateTxParams)(transactionMeta.txParams);
        if (!this.isHistoryDisabled) {
            (0, history_1.updateTransactionHistory)(transactionMeta, note);
        }
        const index = transactions.findIndex(({ id }) => transactionMeta.id === id);
        transactions[index] = transactionMeta;
        this.update({ transactions: this.trimTransactionsForState(transactions) });
    }
    /**
     * Update the security alert response for a transaction.
     *
     * @param transactionId - ID of the transaction.
     * @param securityAlertResponse - The new security alert response for the transaction.
     */
    updateSecurityAlertResponse(transactionId, securityAlertResponse) {
        if (!securityAlertResponse) {
            throw new Error('updateSecurityAlertResponse: securityAlertResponse should not be null');
        }
        const transactionMeta = this.getTransaction(transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update security alert response as no transaction metadata found`);
        }
        const updatedMeta = (0, lodash_1.merge)(transactionMeta, { securityAlertResponse });
        this.updateTransaction(updatedMeta, 'TransactionController:updatesecurityAlertResponse - securityAlertResponse updated');
    }
    /**
     * Removes all transactions from state, optionally based on the current network.
     *
     * @param ignoreNetwork - Determines whether to wipe all transactions, or just those on the
     * current network. If `true`, all transactions are wiped.
     * @param address - If specified, only transactions originating from this address will be
     * wiped on current network.
     */
    wipeTransactions(ignoreNetwork, address) {
        /* istanbul ignore next */
        if (ignoreNetwork && !address) {
            this.update({ transactions: [] });
            return;
        }
        const currentChainId = this.getChainId();
        const newTransactions = this.state.transactions.filter(({ chainId, txParams }) => {
            var _a;
            const isMatchingNetwork = ignoreNetwork || chainId === currentChainId;
            if (!isMatchingNetwork) {
                return true;
            }
            const isMatchingAddress = !address || ((_a = txParams.from) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === address.toLowerCase();
            return !isMatchingAddress;
        });
        this.update({
            transactions: this.trimTransactionsForState(newTransactions),
        });
    }
    startIncomingTransactionProcessing() {
        this.incomingTransactionHelper.start();
    }
    stopIncomingTransactionProcessing() {
        this.incomingTransactionHelper.stop();
    }
    /**
     * Adds external provided transaction to state as confirmed transaction.
     *
     * @param transactionMeta - TransactionMeta to add transactions.
     * @param transactionReceipt - TransactionReceipt of the external transaction.
     * @param baseFeePerGas - Base fee per gas of the external transaction.
     */
    confirmExternalTransaction(transactionMeta, transactionReceipt, baseFeePerGas) {
        return __awaiter(this, void 0, void 0, function* () {
            // Run validation and add external transaction to state.
            this.addExternalTransaction(transactionMeta);
            try {
                const transactionId = transactionMeta.id;
                // Make sure status is confirmed and define gasUsed as in receipt.
                transactionMeta.status = types_1.TransactionStatus.confirmed;
                transactionMeta.txReceipt = transactionReceipt;
                if (baseFeePerGas) {
                    transactionMeta.baseFeePerGas = baseFeePerGas;
                }
                // Update same nonce local transactions as dropped and define replacedBy properties.
                this.markNonceDuplicatesDropped(transactionId);
                // Update external provided transaction with updated gas values and confirmed status.
                this.updateTransaction(transactionMeta, 'TransactionController:confirmExternalTransaction - Add external transaction');
                this.onTransactionStatusChange(transactionMeta);
                // Intentional given potential duration of process.
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.updatePostBalance(transactionMeta);
                this.hub.emit('transaction-confirmed', {
                    transactionMeta,
                });
            }
            catch (error) {
                console.error('Failed to confirm external transaction', error);
            }
        });
    }
    /**
     * Append new send flow history to a transaction.
     *
     * @param transactionID - The ID of the transaction to update.
     * @param currentSendFlowHistoryLength - The length of the current sendFlowHistory array.
     * @param sendFlowHistoryToAdd - The sendFlowHistory entries to add.
     * @returns The updated transactionMeta.
     */
    updateTransactionSendFlowHistory(transactionID, currentSendFlowHistoryLength, sendFlowHistoryToAdd) {
        var _a, _b;
        if (this.isSendFlowHistoryDisabled) {
            throw new Error('Send flow history is disabled for the current transaction controller');
        }
        const transactionMeta = this.getTransaction(transactionID);
        if (!transactionMeta) {
            throw new Error(`Cannot update send flow history as no transaction metadata found`);
        }
        (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updateTransactionSendFlowHistory');
        if (currentSendFlowHistoryLength ===
            (((_a = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.sendFlowHistory) === null || _a === void 0 ? void 0 : _a.length) || 0)) {
            transactionMeta.sendFlowHistory = [
                ...((_b = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.sendFlowHistory) !== null && _b !== void 0 ? _b : []),
                ...sendFlowHistoryToAdd,
            ];
            this.updateTransaction(transactionMeta, 'TransactionController:updateTransactionSendFlowHistory - sendFlowHistory updated');
        }
        return this.getTransaction(transactionID);
    }
    /**
     * Update the gas values of a transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param gasValues - Gas values to update.
     * @param gasValues.gas - Same as transaction.gasLimit.
     * @param gasValues.gasLimit - Maxmimum number of units of gas to use for this transaction.
     * @param gasValues.gasPrice - Price per gas for legacy transactions.
     * @param gasValues.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
     * @param gasValues.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
     * @param gasValues.estimateUsed - Which estimate level was used.
     * @param gasValues.estimateSuggested - Which estimate level that the API suggested.
     * @param gasValues.defaultGasEstimates - The default estimate for gas.
     * @param gasValues.originalGasEstimate - Original estimate for gas.
     * @param gasValues.userEditedGasLimit - The gas limit supplied by user.
     * @param gasValues.userFeeLevel - Estimate level user selected.
     * @returns The updated transactionMeta.
     */
    updateTransactionGasFees(transactionId, { defaultGasEstimates, estimateUsed, estimateSuggested, gas, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas, originalGasEstimate, userEditedGasLimit, userFeeLevel, }) {
        const transactionMeta = this.getTransaction(transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update transaction as no transaction metadata found`);
        }
        (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updateTransactionGasFees');
        let transactionGasFees = {
            txParams: {
                gas,
                gasLimit,
                gasPrice,
                maxPriorityFeePerGas,
                maxFeePerGas,
            },
            defaultGasEstimates,
            estimateUsed,
            estimateSuggested,
            originalGasEstimate,
            userEditedGasLimit,
            userFeeLevel,
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        };
        // only update what is defined
        transactionGasFees.txParams = (0, lodash_1.pickBy)(transactionGasFees.txParams);
        transactionGasFees = (0, lodash_1.pickBy)(transactionGasFees);
        // merge updated gas values with existing transaction meta
        const updatedMeta = (0, lodash_1.merge)(transactionMeta, transactionGasFees);
        this.updateTransaction(updatedMeta, 'TransactionController:updateTransactionGasFees - gas values updated');
        return this.getTransaction(transactionId);
    }
    /**
     * Update the previous gas values of a transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param previousGas - Previous gas values to update.
     * @param previousGas.gasLimit - Maxmimum number of units of gas to use for this transaction.
     * @param previousGas.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
     * @param previousGas.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
     * @returns The updated transactionMeta.
     */
    updatePreviousGasParams(transactionId, { gasLimit, maxFeePerGas, maxPriorityFeePerGas, }) {
        const transactionMeta = this.getTransaction(transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update transaction as no transaction metadata found`);
        }
        (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updatePreviousGasParams');
        const transactionPreviousGas = {
            previousGas: {
                gasLimit,
                maxFeePerGas,
                maxPriorityFeePerGas,
            },
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        };
        // only update what is defined
        transactionPreviousGas.previousGas = (0, lodash_1.pickBy)(transactionPreviousGas.previousGas);
        // merge updated previous gas values with existing transaction meta
        const updatedMeta = (0, lodash_1.merge)(transactionMeta, transactionPreviousGas);
        this.updateTransaction(updatedMeta, 'TransactionController:updatePreviousGasParams - Previous gas values updated');
        return this.getTransaction(transactionId);
    }
    /**
     * Gets the next nonce according to the nonce-tracker.
     * Ensure `releaseLock` is called once processing of the `nonce` value is complete.
     *
     * @param address - The hex string address for the transaction.
     * @returns object with the `nextNonce` `nonceDetails`, and the releaseLock.
     */
    getNonceLock(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.nonceTracker.getNonceLock(address);
        });
    }
    /**
     * Updates the editable parameters of a transaction.
     *
     * @param txId - The ID of the transaction to update.
     * @param params - The editable parameters to update.
     * @param params.data - Data to pass with the transaction.
     * @param params.gas - Maximum number of units of gas to use for the transaction.
     * @param params.gasPrice - Price per gas for legacy transactions.
     * @param params.from - Address to send the transaction from.
     * @param params.to - Address to send the transaction to.
     * @param params.value - Value associated with the transaction.
     * @returns The updated transaction metadata.
     */
    updateEditableParams(txId, { data, gas, gasPrice, from, to, value, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionMeta = this.getTransaction(txId);
            if (!transactionMeta) {
                throw new Error(`Cannot update editable params as no transaction metadata found`);
            }
            (0, utils_1.validateIfTransactionUnapproved)(transactionMeta, 'updateEditableParams');
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
            editableParams.txParams = (0, lodash_1.pickBy)(editableParams.txParams);
            const updatedTransaction = (0, lodash_1.merge)(transactionMeta, editableParams);
            const { type } = yield (0, transaction_type_1.determineTransactionType)(updatedTransaction.txParams, this.ethQuery);
            updatedTransaction.type = type;
            this.updateTransaction(updatedTransaction, `Update Editable Params for ${txId}`);
            return this.getTransaction(txId);
        });
    }
    /**
     * Signs and returns the raw transaction data for provided transaction params list.
     *
     * @param listOfTxParams - The list of transaction params to approve.
     * @param opts - Options bag.
     * @param opts.hasNonce - Whether the transactions already have a nonce.
     * @returns The raw transactions.
     */
    approveTransactionsWithSameNonce(listOfTxParams = [], { hasNonce } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, logger_1.projectLogger)('Approving transactions with same nonce', {
                transactions: listOfTxParams,
            });
            if (listOfTxParams.length === 0) {
                return '';
            }
            const initialTx = listOfTxParams[0];
            const common = this.getCommonConfiguration();
            const initialTxAsEthTx = tx_1.TransactionFactory.fromTxData(initialTx, {
                common,
            });
            const initialTxAsSerializedHex = (0, ethereumjs_util_1.bufferToHex)(initialTxAsEthTx.serialize());
            if (this.inProcessOfSigning.has(initialTxAsSerializedHex)) {
                return '';
            }
            this.inProcessOfSigning.add(initialTxAsSerializedHex);
            let rawTransactions, nonceLock;
            try {
                // TODO: we should add a check to verify that all transactions have the same from address
                const fromAddress = initialTx.from;
                const requiresNonce = hasNonce !== true;
                nonceLock = requiresNonce
                    ? yield this.nonceTracker.getNonceLock(fromAddress)
                    : undefined;
                const nonce = nonceLock
                    ? (0, ethereumjs_util_1.addHexPrefix)(nonceLock.nextNonce.toString(16))
                    : initialTx.nonce;
                if (nonceLock) {
                    (0, logger_1.projectLogger)('Using nonce from nonce tracker', nonce, nonceLock.nonceDetails);
                }
                rawTransactions = yield Promise.all(listOfTxParams.map((txParams) => {
                    txParams.nonce = nonce;
                    return this.signExternalTransaction(txParams);
                }));
            }
            catch (err) {
                (0, logger_1.projectLogger)('Error while signing transactions with same nonce', err);
                // Must set transaction to submitted/failed before releasing lock
                // continue with error chain
                throw err;
            }
            finally {
                nonceLock === null || nonceLock === void 0 ? void 0 : nonceLock.releaseLock();
                this.inProcessOfSigning.delete(initialTxAsSerializedHex);
            }
            return rawTransactions;
        });
    }
    /**
     * Update a custodial transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param options - The custodial transaction options to update.
     * @param options.errorMessage - The error message to be assigned in case transaction status update to failed.
     * @param options.hash - The new hash value to be assigned.
     * @param options.status - The new status value to be assigned.
     */
    updateCustodialTransaction(transactionId, { errorMessage, hash, status, }) {
        const transactionMeta = this.getTransaction(transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update custodial transaction as no transaction metadata found`);
        }
        if (!transactionMeta.custodyId) {
            throw new Error('Transaction must be a custodian transaction');
        }
        if (status &&
            ![
                types_1.TransactionStatus.submitted,
                types_1.TransactionStatus.signed,
                types_1.TransactionStatus.failed,
            ].includes(status)) {
            throw new Error(`Cannot update custodial transaction with status: ${status}`);
        }
        const updatedTransactionMeta = (0, lodash_1.merge)(transactionMeta, (0, lodash_1.pickBy)({ hash, status }));
        if (status === types_1.TransactionStatus.submitted) {
            updatedTransactionMeta.submittedTime = new Date().getTime();
        }
        if (status === types_1.TransactionStatus.failed) {
            updatedTransactionMeta.error = (0, utils_1.normalizeTxError)(new Error(errorMessage));
        }
        this.updateTransaction(updatedTransactionMeta, `TransactionController:updateCustodialTransaction - Custodial transaction updated`);
    }
    /**
     * Creates approvals for all unapproved transactions persisted.
     */
    initApprovals() {
        const chainId = this.getChainId();
        const unapprovedTxs = this.state.transactions.filter((transaction) => transaction.status === types_1.TransactionStatus.unapproved &&
            transaction.chainId === chainId &&
            !transaction.isUserOperation);
        for (const txMeta of unapprovedTxs) {
            this.processApproval(txMeta, {
                shouldShowRequest: false,
            }).catch((error) => {
                if ((error === null || error === void 0 ? void 0 : error.code) === rpc_errors_1.errorCodes.provider.userRejectedRequest) {
                    return;
                }
                console.error('Error during persisted transaction approval', error);
            });
        }
    }
    /**
     * Search transaction metadata for matching entries.
     *
     * @param opts - Options bag.
     * @param opts.searchCriteria - An object containing values or functions for transaction properties to filter transactions with.
     * @param opts.initialList - The transactions to search. Defaults to the current state.
     * @param opts.filterToCurrentNetwork - Whether to filter the results to the current network. Defaults to true.
     * @param opts.limit - The maximum number of transactions to return. No limit by default.
     * @returns An array of transactions matching the provided options.
     */
    getTransactions({ searchCriteria = {}, initialList, filterToCurrentNetwork = true, limit, } = {}) {
        const chainId = this.getChainId();
        // searchCriteria is an object that might have values that aren't predicate
        // methods. When providing any other value type (string, number, etc), we
        // consider this shorthand for "check the value at key for strict equality
        // with the provided value". To conform this object to be only methods, we
        // mapValues (lodash) such that every value on the object is a method that
        // returns a boolean.
        const predicateMethods = (0, lodash_1.mapValues)(searchCriteria, (predicate) => {
            return typeof predicate === 'function'
                ? predicate
                : // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (v) => v === predicate;
        });
        const transactionsToFilter = initialList !== null && initialList !== void 0 ? initialList : this.state.transactions;
        // Combine sortBy and pickBy to transform our state object into an array of
        // matching transactions that are sorted by time.
        const filteredTransactions = (0, lodash_1.sortBy)((0, lodash_1.pickBy)(transactionsToFilter, (transaction) => {
            if (filterToCurrentNetwork && transaction.chainId !== chainId) {
                return false;
            }
            // iterate over the predicateMethods keys to check if the transaction
            // matches the searchCriteria
            for (const [key, predicate] of Object.entries(predicateMethods)) {
                // We return false early as soon as we know that one of the specified
                // search criteria do not match the transaction. This prevents
                // needlessly checking all criteria when we already know the criteria
                // are not fully satisfied. We check both txParams and the base
                // object as predicate keys can be either.
                if (key in transaction.txParams) {
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (predicate(transaction.txParams[key]) === false) {
                        return false;
                    }
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }
                else if (predicate(transaction[key]) === false) {
                    return false;
                }
            }
            return true;
        }), 'time');
        if (limit !== undefined) {
            // We need to have all transactions of a given nonce in order to display
            // necessary details in the UI. We use the size of this set to determine
            // whether we have reached the limit provided, thus ensuring that all
            // transactions of nonces we include will be sent to the UI.
            const nonces = new Set();
            const txs = [];
            // By default, the transaction list we filter from is sorted by time ASC.
            // To ensure that filtered results prefers the newest transactions we
            // iterate from right to left, inserting transactions into front of a new
            // array. The original order is preserved, but we ensure that newest txs
            // are preferred.
            for (let i = filteredTransactions.length - 1; i > -1; i--) {
                const txMeta = filteredTransactions[i];
                const { nonce } = txMeta.txParams;
                if (!nonces.has(nonce)) {
                    if (nonces.size < limit) {
                        nonces.add(nonce);
                    }
                    else {
                        continue;
                    }
                }
                // Push transaction into the beginning of our array to ensure the
                // original order is preserved.
                txs.unshift(txMeta);
            }
            return txs;
        }
        return filteredTransactions;
    }
    signExternalTransaction(transactionParams) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sign) {
                throw new Error('No sign method defined.');
            }
            const normalizedTransactionParams = (0, utils_1.normalizeTxParams)(transactionParams);
            const chainId = this.getChainId();
            const type = (0, utils_1.isEIP1559Transaction)(normalizedTransactionParams)
                ? types_1.TransactionEnvelopeType.feeMarket
                : types_1.TransactionEnvelopeType.legacy;
            const updatedTransactionParams = Object.assign(Object.assign({}, normalizedTransactionParams), { type, gasLimit: normalizedTransactionParams.gas, chainId });
            const { from } = updatedTransactionParams;
            const common = this.getCommonConfiguration();
            const unsignedTransaction = tx_1.TransactionFactory.fromTxData(updatedTransactionParams, { common });
            const signedTransaction = yield this.sign(unsignedTransaction, from);
            const rawTransaction = (0, ethereumjs_util_1.bufferToHex)(signedTransaction.serialize());
            return rawTransaction;
        });
    }
    /**
     * Removes unapproved transactions from state.
     */
    clearUnapprovedTransactions() {
        const transactions = this.state.transactions.filter(({ status }) => status !== types_1.TransactionStatus.unapproved);
        this.update({ transactions: this.trimTransactionsForState(transactions) });
    }
    addMetadata(transactionMeta) {
        const { transactions } = this.state;
        transactions.push(transactionMeta);
        this.update({ transactions: this.trimTransactionsForState(transactions) });
    }
    updateGasProperties(transactionMeta) {
        return __awaiter(this, void 0, void 0, function* () {
            const isEIP1559Compatible = (yield this.getEIP1559Compatibility()) &&
                transactionMeta.txParams.type !== types_1.TransactionEnvelopeType.legacy;
            const chainId = this.getChainId();
            yield (0, gas_1.updateGas)({
                ethQuery: this.ethQuery,
                providerConfig: this.getNetworkState().providerConfig,
                txMeta: transactionMeta,
            });
            yield (0, gas_fees_1.updateGasFees)({
                eip1559: isEIP1559Compatible,
                ethQuery: this.ethQuery,
                getSavedGasFees: this.getSavedGasFees.bind(this, chainId),
                getGasFeeEstimates: this.getGasFeeEstimates.bind(this),
                txMeta: transactionMeta,
            });
        });
    }
    getCurrentChainTransactionsByStatus(status) {
        const chainId = this.getChainId();
        return this.state.transactions.filter((transaction) => transaction.status === status && transaction.chainId === chainId);
    }
    onBootCleanup() {
        this.submitApprovedTransactions();
    }
    /**
     * Force to submit approved transactions on current chain.
     */
    submitApprovedTransactions() {
        const approvedTransactions = this.getCurrentChainTransactionsByStatus(types_1.TransactionStatus.approved);
        for (const transactionMeta of approvedTransactions) {
            if (this.beforeApproveOnInit(transactionMeta)) {
                this.approveTransaction(transactionMeta.id).catch((error) => {
                    /* istanbul ignore next */
                    console.error('Error while submitting persisted transaction', error);
                });
            }
        }
    }
    processApproval(transactionMeta, { isExisting = false, requireApproval, shouldShowRequest = true, actionId, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionId = transactionMeta.id;
            let resultCallbacks;
            const { meta, isCompleted } = this.isTransactionCompleted(transactionId);
            const finishedPromise = isCompleted
                ? Promise.resolve(meta)
                : this.waitForTransactionFinished(transactionId);
            if (meta && !isExisting && !isCompleted) {
                try {
                    if (requireApproval !== false) {
                        const acceptResult = yield this.requestApproval(transactionMeta, {
                            shouldShowRequest,
                        });
                        resultCallbacks = acceptResult.resultCallbacks;
                        if (resultCallbacks) {
                            this.hub.once(`${transactionId}:publish-skip`, () => {
                                resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.success();
                                // Remove the reference to prevent additional reports once submitted.
                                resultCallbacks = undefined;
                            });
                        }
                        const approvalValue = acceptResult.value;
                        const updatedTransaction = approvalValue === null || approvalValue === void 0 ? void 0 : approvalValue.txMeta;
                        if (updatedTransaction) {
                            (0, logger_1.projectLogger)('Updating transaction with approval data', {
                                customNonce: updatedTransaction.customNonceValue,
                                params: updatedTransaction.txParams,
                            });
                            this.updateTransaction(updatedTransaction, 'TransactionController#processApproval - Updated with approval data');
                        }
                    }
                    const { isCompleted: isTxCompleted } = this.isTransactionCompleted(transactionId);
                    if (!isTxCompleted) {
                        yield this.approveTransaction(transactionId);
                        const updatedTransactionMeta = this.getTransaction(transactionId);
                        this.hub.emit('transaction-approved', {
                            transactionMeta: updatedTransactionMeta,
                            actionId,
                        });
                    }
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }
                catch (error) {
                    const { isCompleted: isTxCompleted } = this.isTransactionCompleted(transactionId);
                    if (!isTxCompleted) {
                        if ((error === null || error === void 0 ? void 0 : error.code) === rpc_errors_1.errorCodes.provider.userRejectedRequest) {
                            this.cancelTransaction(transactionId, actionId);
                            throw rpc_errors_1.providerErrors.userRejectedRequest('MetaMask Tx Signature: User denied transaction signature.');
                        }
                        else {
                            this.failTransaction(meta, error, actionId);
                        }
                    }
                }
            }
            const finalMeta = yield finishedPromise;
            switch (finalMeta === null || finalMeta === void 0 ? void 0 : finalMeta.status) {
                case types_1.TransactionStatus.failed:
                    resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.error(finalMeta.error);
                    throw rpc_errors_1.rpcErrors.internal(finalMeta.error.message);
                case types_1.TransactionStatus.submitted:
                    resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.success();
                    return finalMeta.hash;
                default:
                    const internalError = rpc_errors_1.rpcErrors.internal(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(finalMeta || transactionId)}`);
                    resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.error(internalError);
                    throw internalError;
            }
        });
    }
    /**
     * Approves a transaction and updates it's status in state. If this is not a
     * retry transaction, a nonce will be generated. The transaction is signed
     * using the sign configuration property, then published to the blockchain.
     * A `<tx.id>:finished` hub event is fired after success or failure.
     *
     * @param transactionId - The ID of the transaction to approve.
     */
    approveTransaction(transactionId) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { transactions } = this.state;
            const releaseLock = yield this.mutex.acquire();
            const chainId = this.getChainId();
            const index = transactions.findIndex(({ id }) => transactionId === id);
            const transactionMeta = transactions[index];
            const { txParams: { from }, } = transactionMeta;
            let releaseNonceLock;
            try {
                if (!this.sign) {
                    releaseLock();
                    this.failTransaction(transactionMeta, new Error('No sign method defined.'));
                    return;
                }
                else if (!chainId) {
                    releaseLock();
                    this.failTransaction(transactionMeta, new Error('No chainId defined.'));
                    return;
                }
                if (this.inProcessOfSigning.has(transactionId)) {
                    (0, logger_1.projectLogger)('Skipping approval as signing in progress', transactionId);
                    return;
                }
                const [nonce, releaseNonce] = yield (0, nonce_1.getNextNonce)(transactionMeta, this.nonceTracker);
                releaseNonceLock = releaseNonce;
                transactionMeta.status = types_1.TransactionStatus.approved;
                transactionMeta.txParams.nonce = nonce;
                transactionMeta.txParams.chainId = chainId;
                const baseTxParams = Object.assign(Object.assign({}, transactionMeta.txParams), { gasLimit: transactionMeta.txParams.gas });
                this.updateTransaction(transactionMeta, 'TransactionController#approveTransaction - Transaction approved');
                this.onTransactionStatusChange(transactionMeta);
                const isEIP1559 = (0, utils_1.isEIP1559Transaction)(transactionMeta.txParams);
                const txParams = isEIP1559
                    ? Object.assign(Object.assign({}, baseTxParams), { estimatedBaseFee: transactionMeta.txParams.estimatedBaseFee, type: types_1.TransactionEnvelopeType.feeMarket }) : baseTxParams;
                const rawTx = yield this.signTransaction(transactionMeta, txParams);
                if (!this.beforePublish(transactionMeta)) {
                    (0, logger_1.projectLogger)('Skipping publishing transaction based on hook');
                    this.hub.emit(`${transactionMeta.id}:publish-skip`, transactionMeta);
                    return;
                }
                if (!rawTx) {
                    return;
                }
                if (transactionMeta.type === types_1.TransactionType.swap) {
                    (0, logger_1.projectLogger)('Determining pre-transaction balance');
                    const preTxBalance = yield (0, controller_utils_1.query)(this.ethQuery, 'getBalance', [from]);
                    transactionMeta.preTxBalance = preTxBalance;
                    (0, logger_1.projectLogger)('Updated pre-transaction balance', transactionMeta.preTxBalance);
                }
                (0, logger_1.projectLogger)('Publishing transaction', txParams);
                const hookResponse = yield this.publish(transactionMeta, rawTx);
                const hash = (_a = hookResponse.transactionHash) !== null && _a !== void 0 ? _a : (yield this.publishTransaction(rawTx));
                (0, logger_1.projectLogger)('Publish successful', hash);
                transactionMeta.hash = hash;
                transactionMeta.status = types_1.TransactionStatus.submitted;
                transactionMeta.submittedTime = new Date().getTime();
                this.updateTransaction(transactionMeta, 'TransactionController#approveTransaction - Transaction submitted');
                this.hub.emit('transaction-submitted', {
                    transactionMeta,
                });
                this.hub.emit(`${transactionMeta.id}:finished`, transactionMeta);
                this.onTransactionStatusChange(transactionMeta);
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            catch (error) {
                this.failTransaction(transactionMeta, error);
            }
            finally {
                this.inProcessOfSigning.delete(transactionId);
                // must set transaction to submitted/failed before releasing lock
                releaseNonceLock === null || releaseNonceLock === void 0 ? void 0 : releaseNonceLock();
                releaseLock();
            }
        });
    }
    publishTransaction(rawTransaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, controller_utils_1.query)(this.ethQuery, 'sendRawTransaction', [rawTransaction]);
        });
    }
    /**
     * Cancels a transaction based on its ID by setting its status to "rejected"
     * and emitting a `<tx.id>:finished` hub event.
     *
     * @param transactionId - The ID of the transaction to cancel.
     * @param actionId - The actionId passed from UI
     */
    cancelTransaction(transactionId, actionId) {
        const transactionMeta = this.state.transactions.find(({ id }) => id === transactionId);
        if (!transactionMeta) {
            return;
        }
        transactionMeta.status = types_1.TransactionStatus.rejected;
        const transactions = this.state.transactions.filter(({ id }) => id !== transactionId);
        this.update({ transactions: this.trimTransactionsForState(transactions) });
        this.hub.emit(`${transactionMeta.id}:finished`, transactionMeta);
        this.hub.emit('transaction-rejected', {
            transactionMeta,
            actionId,
        });
        this.onTransactionStatusChange(transactionMeta);
    }
    /**
     * Trim the amount of transactions that are set on the state. Checks
     * if the length of the tx history is longer then desired persistence
     * limit and then if it is removes the oldest confirmed or rejected tx.
     * Pending or unapproved transactions will not be removed by this
     * operation. For safety of presenting a fully functional transaction UI
     * representation, this function will not break apart transactions with the
     * same nonce, created on the same day, per network. Not accounting for transactions of the same
     * nonce, same day and network combo can result in confusing or broken experiences
     * in the UI. The transactions are then updated using the BaseControllerV1 update.
     *
     * @param transactions - The transactions to be applied to the state.
     * @returns The trimmed list of transactions.
     */
    trimTransactionsForState(transactions) {
        const nonceNetworkSet = new Set();
        const txsToKeep = transactions
            .sort((a, b) => (a.time > b.time ? -1 : 1)) // Descending time order
            .filter((tx) => {
            const { chainId, status, txParams, time } = tx;
            if (txParams) {
                const key = `${txParams.nonce}-${(0, controller_utils_1.convertHexToDecimal)(chainId)}-${new Date(time).toDateString()}`;
                if (nonceNetworkSet.has(key)) {
                    return true;
                }
                else if (nonceNetworkSet.size < this.config.txHistoryLimit ||
                    !this.isFinalState(status)) {
                    nonceNetworkSet.add(key);
                    return true;
                }
            }
            return false;
        });
        txsToKeep.reverse(); // Ascending time order
        return txsToKeep;
    }
    /**
     * Determines if the transaction is in a final state.
     *
     * @param status - The transaction status.
     * @returns Whether the transaction is in a final state.
     */
    isFinalState(status) {
        return (status === types_1.TransactionStatus.rejected ||
            status === types_1.TransactionStatus.confirmed ||
            status === types_1.TransactionStatus.failed);
    }
    /**
     * Whether the transaction has at least completed all local processing.
     *
     * @param status - The transaction status.
     * @returns Whether the transaction is in a final state.
     */
    isLocalFinalState(status) {
        return [
            types_1.TransactionStatus.confirmed,
            types_1.TransactionStatus.failed,
            types_1.TransactionStatus.rejected,
            types_1.TransactionStatus.submitted,
        ].includes(status);
    }
    requestApproval(txMeta, { shouldShowRequest }) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.getApprovalId(txMeta);
            const { origin } = txMeta;
            const type = controller_utils_1.ApprovalType.Transaction;
            const requestData = { txId: txMeta.id };
            return (yield this.messagingSystem.call('ApprovalController:addRequest', {
                id,
                origin: origin || controller_utils_1.ORIGIN_METAMASK,
                type,
                requestData,
                expectsResult: true,
            }, shouldShowRequest));
        });
    }
    getTransaction(transactionId) {
        const { transactions } = this.state;
        return transactions.find(({ id }) => id === transactionId);
    }
    getApprovalId(txMeta) {
        return String(txMeta.id);
    }
    isTransactionCompleted(transactionId) {
        const transaction = this.getTransaction(transactionId);
        if (!transaction) {
            return { meta: undefined, isCompleted: false };
        }
        const isCompleted = this.isLocalFinalState(transaction.status);
        return { meta: transaction, isCompleted };
    }
    getChainId() {
        const { providerConfig } = this.getNetworkState();
        return providerConfig.chainId;
    }
    prepareUnsignedEthTx(txParams) {
        return tx_1.TransactionFactory.fromTxData(txParams, {
            common: this.getCommonConfiguration(),
            freeze: false,
        });
    }
    /**
     * `@ethereumjs/tx` uses `@ethereumjs/common` as a configuration tool for
     * specifying which chain, network, hardfork and EIPs to support for
     * a transaction. By referencing this configuration, and analyzing the fields
     * specified in txParams, @ethereumjs/tx is able to determine which EIP-2718
     * transaction type to use.
     *
     * @returns common configuration object
     */
    getCommonConfiguration() {
        const { providerConfig: { type: chain, chainId, nickname: name }, } = this.getNetworkState();
        if (chain !== controller_utils_1.RPC &&
            chain !== controller_utils_1.NetworkType['linea-goerli'] &&
            chain !== controller_utils_1.NetworkType['linea-mainnet']) {
            return new common_1.Common({ chain, hardfork: exports.HARDFORK });
        }
        const customChainParams = {
            name,
            chainId: parseInt(chainId, 16),
            defaultHardfork: exports.HARDFORK,
        };
        return common_1.Common.custom(customChainParams);
    }
    onIncomingTransactions({ added, updated, }) {
        const { transactions: currentTransactions } = this.state;
        const updatedTransactions = [
            ...added,
            ...currentTransactions.map((originalTransaction) => {
                const updatedTransaction = updated.find(({ hash }) => hash === originalTransaction.hash);
                return updatedTransaction !== null && updatedTransaction !== void 0 ? updatedTransaction : originalTransaction;
            }),
        ];
        this.update({
            transactions: this.trimTransactionsForState(updatedTransactions),
        });
    }
    onUpdatedLastFetchedBlockNumbers({ lastFetchedBlockNumbers, blockNumber, }) {
        this.update({ lastFetchedBlockNumbers });
        this.hub.emit('incomingTransactionBlock', blockNumber);
    }
    generateDappSuggestedGasFees(txParams, origin) {
        if (!origin || origin === controller_utils_1.ORIGIN_METAMASK) {
            return undefined;
        }
        const { gasPrice, maxFeePerGas, maxPriorityFeePerGas, gas } = txParams;
        if (gasPrice === undefined &&
            maxFeePerGas === undefined &&
            maxPriorityFeePerGas === undefined &&
            gas === undefined) {
            return undefined;
        }
        const dappSuggestedGasFees = {};
        if (gasPrice !== undefined) {
            dappSuggestedGasFees.gasPrice = gasPrice;
        }
        else if (maxFeePerGas !== undefined ||
            maxPriorityFeePerGas !== undefined) {
            dappSuggestedGasFees.maxFeePerGas = maxFeePerGas;
            dappSuggestedGasFees.maxPriorityFeePerGas = maxPriorityFeePerGas;
        }
        if (gas !== undefined) {
            dappSuggestedGasFees.gas = gas;
        }
        return dappSuggestedGasFees;
    }
    /**
     * Validates and adds external provided transaction to state.
     *
     * @param transactionMeta - Nominated external transaction to be added to state.
     */
    addExternalTransaction(transactionMeta) {
        var _a, _b;
        const chainId = this.getChainId();
        const { transactions } = this.state;
        const fromAddress = (_a = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.txParams) === null || _a === void 0 ? void 0 : _a.from;
        const sameFromAndNetworkTransactions = transactions.filter((transaction) => transaction.txParams.from === fromAddress &&
            transaction.chainId === chainId);
        const confirmedTxs = sameFromAndNetworkTransactions.filter((transaction) => transaction.status === types_1.TransactionStatus.confirmed);
        const pendingTxs = sameFromAndNetworkTransactions.filter((transaction) => transaction.status === types_1.TransactionStatus.submitted);
        (0, external_transactions_1.validateConfirmedExternalTransaction)(transactionMeta, confirmedTxs, pendingTxs);
        // Make sure provided external transaction has non empty history array
        if (!((_b = transactionMeta.history) !== null && _b !== void 0 ? _b : []).length) {
            if (!this.isHistoryDisabled) {
                (0, history_1.addInitialHistorySnapshot)(transactionMeta);
            }
        }
        const updatedTransactions = [...transactions, transactionMeta];
        this.update({
            transactions: this.trimTransactionsForState(updatedTransactions),
        });
    }
    /**
     * Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
     * in the transactions have the same nonce.
     *
     * @param transactionId - Used to identify original transaction.
     */
    markNonceDuplicatesDropped(transactionId) {
        var _a, _b;
        const chainId = this.getChainId();
        const transactionMeta = this.getTransaction(transactionId);
        const nonce = (_a = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.txParams) === null || _a === void 0 ? void 0 : _a.nonce;
        const from = (_b = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.txParams) === null || _b === void 0 ? void 0 : _b.from;
        const sameNonceTxs = this.state.transactions.filter((transaction) => transaction.id !== transactionId &&
            transaction.txParams.from === from &&
            transaction.txParams.nonce === nonce &&
            transaction.chainId === chainId &&
            transaction.type !== types_1.TransactionType.incoming);
        if (!sameNonceTxs.length) {
            return;
        }
        // Mark all same nonce transactions as dropped and give it a replacedBy hash
        for (const transaction of sameNonceTxs) {
            transaction.replacedBy = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.hash;
            transaction.replacedById = transactionMeta === null || transactionMeta === void 0 ? void 0 : transactionMeta.id;
            // Drop any transaction that wasn't previously failed (off chain failure)
            if (transaction.status !== types_1.TransactionStatus.failed) {
                this.setTransactionStatusDropped(transaction);
            }
        }
    }
    /**
     * Method to set transaction status to dropped.
     *
     * @param transactionMeta - TransactionMeta of transaction to be marked as dropped.
     */
    setTransactionStatusDropped(transactionMeta) {
        transactionMeta.status = types_1.TransactionStatus.dropped;
        this.hub.emit('transaction-dropped', {
            transactionMeta,
        });
        this.updateTransaction(transactionMeta, 'TransactionController#setTransactionStatusDropped - Transaction dropped');
        this.onTransactionStatusChange(transactionMeta);
    }
    /**
     * Get transaction with provided actionId.
     *
     * @param actionId - Unique ID to prevent duplicate requests
     * @returns the filtered transaction
     */
    getTransactionWithActionId(actionId) {
        return this.state.transactions.find((transaction) => actionId && transaction.actionId === actionId);
    }
    waitForTransactionFinished(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.hub.once(`${transactionId}:finished`, (txMeta) => {
                    resolve(txMeta);
                });
            });
        });
    }
    /**
     * Updates the r, s, and v properties of a TransactionMeta object
     * with values from a signed transaction.
     *
     * @param transactionMeta - The TransactionMeta object to update.
     * @param signedTx - The encompassing type for all transaction types containing r, s, and v values.
     */
    updateTransactionMetaRSV(transactionMeta, signedTx) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const key of ['r', 's', 'v']) {
                const value = signedTx[key];
                if (value === undefined || value === null) {
                    continue;
                }
                transactionMeta[key] = (0, ethereumjs_util_1.addHexPrefix)(value.toString(16));
            }
        });
    }
    getEIP1559Compatibility() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentNetworkIsEIP1559Compatible = yield this.getCurrentNetworkEIP1559Compatibility();
            const currentAccountIsEIP1559Compatible = yield this.getCurrentAccountEIP1559Compatibility();
            return (currentNetworkIsEIP1559Compatible && currentAccountIsEIP1559Compatible);
        });
    }
    addPendingTransactionTrackerListeners() {
        this.pendingTransactionTracker.hub.on('transaction-confirmed', this.onConfirmedTransaction.bind(this));
        this.pendingTransactionTracker.hub.on('transaction-dropped', this.setTransactionStatusDropped.bind(this));
        this.pendingTransactionTracker.hub.on('transaction-failed', this.failTransaction.bind(this));
        this.pendingTransactionTracker.hub.on('transaction-updated', this.updateTransaction.bind(this));
    }
    signTransaction(transactionMeta, txParams) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (0, logger_1.projectLogger)('Signing transaction', txParams);
            const unsignedEthTx = this.prepareUnsignedEthTx(txParams);
            this.inProcessOfSigning.add(transactionMeta.id);
            const signedTx = yield ((_a = this.sign) === null || _a === void 0 ? void 0 : _a.call(this, unsignedEthTx, txParams.from, ...this.getAdditionalSignArguments(transactionMeta)));
            if (!signedTx) {
                (0, logger_1.projectLogger)('Skipping signed status as no signed transaction');
                return undefined;
            }
            if (!this.afterSign(transactionMeta, signedTx)) {
                this.updateTransaction(transactionMeta, 'TransactionController#signTransaction - Update after sign');
                (0, logger_1.projectLogger)('Skipping signed status based on hook');
                return undefined;
            }
            yield this.updateTransactionMetaRSV(transactionMeta, signedTx);
            transactionMeta.status = types_1.TransactionStatus.signed;
            this.updateTransaction(transactionMeta, 'TransactionController#approveTransaction - Transaction signed');
            this.onTransactionStatusChange(transactionMeta);
            const rawTx = (0, ethereumjs_util_1.bufferToHex)(signedTx.serialize());
            transactionMeta.rawTx = rawTx;
            this.updateTransaction(transactionMeta, 'TransactionController#approveTransaction - RawTransaction added');
            return rawTx;
        });
    }
    onTransactionStatusChange(transactionMeta) {
        this.hub.emit('transaction-status-update', { transactionMeta });
    }
    getNonceTrackerPendingTransactions(address) {
        const standardPendingTransactions = this.getNonceTrackerTransactions(types_1.TransactionStatus.submitted, address);
        const externalPendingTransactions = this.getExternalPendingTransactions(address);
        return [...standardPendingTransactions, ...externalPendingTransactions];
    }
    getNonceTrackerTransactions(status, address) {
        const currentChainId = this.getChainId();
        return (0, nonce_1.getAndFormatTransactionsForNonceTracker)(currentChainId, address, status, this.state.transactions);
    }
    onConfirmedTransaction(transactionMeta) {
        (0, logger_1.projectLogger)('Processing confirmed transaction', transactionMeta.id);
        this.markNonceDuplicatesDropped(transactionMeta.id);
        this.hub.emit('transaction-confirmed', { transactionMeta });
        this.hub.emit(`${transactionMeta.id}:confirmed`, transactionMeta);
        this.onTransactionStatusChange(transactionMeta);
        // Intentional given potential duration of process.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.updatePostBalance(transactionMeta);
    }
    updatePostBalance(transactionMeta) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (transactionMeta.type !== types_1.TransactionType.swap) {
                    return;
                }
                const { updatedTransactionMeta, approvalTransactionMeta } = yield (0, swaps_1.updatePostTransactionBalance)(transactionMeta, {
                    ethQuery: this.ethQuery,
                    getTransaction: this.getTransaction.bind(this),
                    updateTransaction: this.updateTransaction.bind(this),
                });
                this.hub.emit('post-transaction-balance-updated', {
                    transactionMeta: updatedTransactionMeta,
                    approvalTransactionMeta,
                });
            }
            catch (error) {
                /* istanbul ignore next */
                (0, logger_1.projectLogger)('Error while updating post transaction balance', error);
            }
        });
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=TransactionController.js.map