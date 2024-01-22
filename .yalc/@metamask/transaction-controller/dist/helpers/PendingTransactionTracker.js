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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _PendingTransactionTracker_instances, _PendingTransactionTracker_approveTransaction, _PendingTransactionTracker_blockTracker, _PendingTransactionTracker_droppedBlockCountByHash, _PendingTransactionTracker_getChainId, _PendingTransactionTracker_getEthQuery, _PendingTransactionTracker_getTransactions, _PendingTransactionTracker_isResubmitEnabled, _PendingTransactionTracker_listener, _PendingTransactionTracker_nonceTracker, _PendingTransactionTracker_onStateChange, _PendingTransactionTracker_publishTransaction, _PendingTransactionTracker_running, _PendingTransactionTracker_beforeCheckPendingTransaction, _PendingTransactionTracker_beforePublish, _PendingTransactionTracker_start, _PendingTransactionTracker_stop, _PendingTransactionTracker_onLatestBlock, _PendingTransactionTracker_checkTransactions, _PendingTransactionTracker_resubmitTransactions, _PendingTransactionTracker_isKnownTransactionError, _PendingTransactionTracker_resubmitTransaction, _PendingTransactionTracker_isResubmitDue, _PendingTransactionTracker_checkTransaction, _PendingTransactionTracker_onTransactionConfirmed, _PendingTransactionTracker_isTransactionDropped, _PendingTransactionTracker_isNonceTaken, _PendingTransactionTracker_getPendingTransactions, _PendingTransactionTracker_warnTransaction, _PendingTransactionTracker_failTransaction, _PendingTransactionTracker_dropTransaction, _PendingTransactionTracker_updateTransaction, _PendingTransactionTracker_getTransactionReceipt, _PendingTransactionTracker_getBlockByHash, _PendingTransactionTracker_getNetworkTransactionCount, _PendingTransactionTracker_getCurrentChainTransactions;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingTransactionTracker = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const utils_1 = require("@metamask/utils");
const events_1 = __importDefault(require("events"));
const logger_1 = require("../logger");
const types_1 = require("../types");
/**
 * We wait this many blocks before emitting a 'transaction-dropped' event
 * This is because we could be talking to a node that is out of sync
 */
const DROPPED_BLOCK_COUNT = 3;
const RECEIPT_STATUS_SUCCESS = '0x1';
const RECEIPT_STATUS_FAILURE = '0x0';
const MAX_RETRY_BLOCK_DISTANCE = 50;
const KNOWN_TRANSACTION_ERRORS = [
    'replacement transaction underpriced',
    'known transaction',
    'gas price too low to replace',
    'transaction with the same hash was already imported',
    'gateway timeout',
    'nonce too low',
];
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'pending-transactions');
class PendingTransactionTracker {
    constructor({ approveTransaction, blockTracker, getChainId, getEthQuery, getTransactions, isResubmitEnabled, nonceTracker, onStateChange, publishTransaction, hooks, }) {
        var _a, _b;
        _PendingTransactionTracker_instances.add(this);
        _PendingTransactionTracker_approveTransaction.set(this, void 0);
        _PendingTransactionTracker_blockTracker.set(this, void 0);
        _PendingTransactionTracker_droppedBlockCountByHash.set(this, void 0);
        _PendingTransactionTracker_getChainId.set(this, void 0);
        _PendingTransactionTracker_getEthQuery.set(this, void 0);
        _PendingTransactionTracker_getTransactions.set(this, void 0);
        _PendingTransactionTracker_isResubmitEnabled.set(this, void 0);
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _PendingTransactionTracker_listener.set(this, void 0);
        _PendingTransactionTracker_nonceTracker.set(this, void 0);
        _PendingTransactionTracker_onStateChange.set(this, void 0);
        _PendingTransactionTracker_publishTransaction.set(this, void 0);
        _PendingTransactionTracker_running.set(this, void 0);
        _PendingTransactionTracker_beforeCheckPendingTransaction.set(this, void 0);
        _PendingTransactionTracker_beforePublish.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _PendingTransactionTracker_approveTransaction, approveTransaction, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_blockTracker, blockTracker, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_droppedBlockCountByHash, new Map(), "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_getChainId, getChainId, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_getEthQuery, getEthQuery, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_getTransactions, getTransactions, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_isResubmitEnabled, isResubmitEnabled !== null && isResubmitEnabled !== void 0 ? isResubmitEnabled : true, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_listener, __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_onLatestBlock).bind(this), "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_nonceTracker, nonceTracker, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_onStateChange, onStateChange, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_publishTransaction, publishTransaction, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_running, false, "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_beforePublish, (_a = hooks === null || hooks === void 0 ? void 0 : hooks.beforePublish) !== null && _a !== void 0 ? _a : (() => true), "f");
        __classPrivateFieldSet(this, _PendingTransactionTracker_beforeCheckPendingTransaction, (_b = hooks === null || hooks === void 0 ? void 0 : hooks.beforeCheckPendingTransaction) !== null && _b !== void 0 ? _b : (() => true), "f");
        __classPrivateFieldGet(this, _PendingTransactionTracker_onStateChange, "f").call(this, () => {
            const pendingTransactions = __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getPendingTransactions).call(this);
            if (pendingTransactions.length) {
                __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_start).call(this);
            }
            else {
                __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_stop).call(this);
            }
        });
    }
}
exports.PendingTransactionTracker = PendingTransactionTracker;
_PendingTransactionTracker_approveTransaction = new WeakMap(), _PendingTransactionTracker_blockTracker = new WeakMap(), _PendingTransactionTracker_droppedBlockCountByHash = new WeakMap(), _PendingTransactionTracker_getChainId = new WeakMap(), _PendingTransactionTracker_getEthQuery = new WeakMap(), _PendingTransactionTracker_getTransactions = new WeakMap(), _PendingTransactionTracker_isResubmitEnabled = new WeakMap(), _PendingTransactionTracker_listener = new WeakMap(), _PendingTransactionTracker_nonceTracker = new WeakMap(), _PendingTransactionTracker_onStateChange = new WeakMap(), _PendingTransactionTracker_publishTransaction = new WeakMap(), _PendingTransactionTracker_running = new WeakMap(), _PendingTransactionTracker_beforeCheckPendingTransaction = new WeakMap(), _PendingTransactionTracker_beforePublish = new WeakMap(), _PendingTransactionTracker_instances = new WeakSet(), _PendingTransactionTracker_start = function _PendingTransactionTracker_start() {
    if (__classPrivateFieldGet(this, _PendingTransactionTracker_running, "f")) {
        return;
    }
    __classPrivateFieldGet(this, _PendingTransactionTracker_blockTracker, "f").on('latest', __classPrivateFieldGet(this, _PendingTransactionTracker_listener, "f"));
    __classPrivateFieldSet(this, _PendingTransactionTracker_running, true, "f");
    log('Started polling');
}, _PendingTransactionTracker_stop = function _PendingTransactionTracker_stop() {
    if (!__classPrivateFieldGet(this, _PendingTransactionTracker_running, "f")) {
        return;
    }
    __classPrivateFieldGet(this, _PendingTransactionTracker_blockTracker, "f").removeListener('latest', __classPrivateFieldGet(this, _PendingTransactionTracker_listener, "f"));
    __classPrivateFieldSet(this, _PendingTransactionTracker_running, false, "f");
    log('Stopped polling');
}, _PendingTransactionTracker_onLatestBlock = function _PendingTransactionTracker_onLatestBlock(latestBlockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const nonceGlobalLock = yield __classPrivateFieldGet(this, _PendingTransactionTracker_nonceTracker, "f").getGlobalLock();
        try {
            yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_checkTransactions).call(this);
        }
        catch (error) {
            /* istanbul ignore next */
            log('Failed to check transactions', error);
        }
        finally {
            nonceGlobalLock.releaseLock();
        }
        try {
            yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_resubmitTransactions).call(this, latestBlockNumber);
        }
        catch (error) {
            /* istanbul ignore next */
            log('Failed to resubmit transactions', error);
        }
    });
}, _PendingTransactionTracker_checkTransactions = function _PendingTransactionTracker_checkTransactions() {
    return __awaiter(this, void 0, void 0, function* () {
        log('Checking transactions');
        const pendingTransactions = __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getPendingTransactions).call(this);
        if (!pendingTransactions.length) {
            log('No pending transactions to check');
            return;
        }
        log('Found pending transactions to check', {
            count: pendingTransactions.length,
            ids: pendingTransactions.map((tx) => tx.id),
        });
        yield Promise.all(pendingTransactions.map((tx) => __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_checkTransaction).call(this, tx)));
    });
}, _PendingTransactionTracker_resubmitTransactions = function _PendingTransactionTracker_resubmitTransactions(latestBlockNumber) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        if (!__classPrivateFieldGet(this, _PendingTransactionTracker_isResubmitEnabled, "f") || !__classPrivateFieldGet(this, _PendingTransactionTracker_running, "f")) {
            return;
        }
        log('Resubmitting transactions');
        const pendingTransactions = __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getPendingTransactions).call(this);
        if (!pendingTransactions.length) {
            log('No pending transactions to resubmit');
            return;
        }
        log('Found pending transactions to resubmit', {
            count: pendingTransactions.length,
            ids: pendingTransactions.map((tx) => tx.id),
        });
        for (const txMeta of pendingTransactions) {
            try {
                yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_resubmitTransaction).call(this, txMeta, latestBlockNumber);
                // TODO: Replace `any` with type
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }
            catch (error) {
                /* istanbul ignore next */
                const errorMessage = ((_b = (_a = error.value) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || error.message.toLowerCase();
                if (__classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_isKnownTransactionError).call(this, errorMessage)) {
                    log('Ignoring known transaction error', errorMessage);
                    return;
                }
                __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_warnTransaction).call(this, txMeta, error.message, 'There was an error when resubmitting this transaction.');
            }
        }
    });
}, _PendingTransactionTracker_isKnownTransactionError = function _PendingTransactionTracker_isKnownTransactionError(errorMessage) {
    return KNOWN_TRANSACTION_ERRORS.some((knownError) => errorMessage.includes(knownError));
}, _PendingTransactionTracker_resubmitTransaction = function _PendingTransactionTracker_resubmitTransaction(txMeta, latestBlockNumber) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!__classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_isResubmitDue).call(this, txMeta, latestBlockNumber)) {
            return;
        }
        log('Resubmitting transaction', txMeta.id);
        const { rawTx } = txMeta;
        if (!__classPrivateFieldGet(this, _PendingTransactionTracker_beforePublish, "f").call(this, txMeta)) {
            return;
        }
        if (!(rawTx === null || rawTx === void 0 ? void 0 : rawTx.length)) {
            log('Approving transaction as no raw value');
            yield __classPrivateFieldGet(this, _PendingTransactionTracker_approveTransaction, "f").call(this, txMeta.id);
            return;
        }
        yield __classPrivateFieldGet(this, _PendingTransactionTracker_publishTransaction, "f").call(this, rawTx);
        txMeta.retryCount = ((_a = txMeta.retryCount) !== null && _a !== void 0 ? _a : 0) + 1;
        __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_updateTransaction).call(this, txMeta, 'PendingTransactionTracker:transaction-retry - Retry count increased');
    });
}, _PendingTransactionTracker_isResubmitDue = function _PendingTransactionTracker_isResubmitDue(txMeta, latestBlockNumber) {
    if (!txMeta.firstRetryBlockNumber) {
        txMeta.firstRetryBlockNumber = latestBlockNumber;
        __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_updateTransaction).call(this, txMeta, 'PendingTransactionTracker:#isResubmitDue - First retry block number set');
    }
    const firstRetryBlockNumber = txMeta.firstRetryBlockNumber || latestBlockNumber;
    const blocksSinceFirstRetry = Number.parseInt(latestBlockNumber, 16) -
        Number.parseInt(firstRetryBlockNumber, 16);
    const retryCount = txMeta.retryCount || 0;
    // Exponential backoff to limit retries at publishing
    // Capped at ~15 minutes between retries
    const requiredBlocksSinceFirstRetry = Math.min(MAX_RETRY_BLOCK_DISTANCE, Math.pow(2, retryCount));
    return blocksSinceFirstRetry >= requiredBlocksSinceFirstRetry;
}, _PendingTransactionTracker_checkTransaction = function _PendingTransactionTracker_checkTransaction(txMeta) {
    return __awaiter(this, void 0, void 0, function* () {
        const { hash, id } = txMeta;
        if (!hash && __classPrivateFieldGet(this, _PendingTransactionTracker_beforeCheckPendingTransaction, "f").call(this, txMeta)) {
            const error = new Error('We had an error while submitting this transaction, please try again.');
            error.name = 'NoTxHashError';
            __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_failTransaction).call(this, txMeta, error);
            return;
        }
        if (__classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_isNonceTaken).call(this, txMeta)) {
            log('Nonce already taken', id);
            __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_dropTransaction).call(this, txMeta);
            return;
        }
        try {
            const receipt = yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getTransactionReceipt).call(this, hash);
            const isSuccess = (receipt === null || receipt === void 0 ? void 0 : receipt.status) === RECEIPT_STATUS_SUCCESS;
            const isFailure = (receipt === null || receipt === void 0 ? void 0 : receipt.status) === RECEIPT_STATUS_FAILURE;
            if (isFailure) {
                log('Transaction receipt has failed status');
                __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_failTransaction).call(this, txMeta, new Error('Transaction dropped or replaced'));
                return;
            }
            const { blockNumber, blockHash } = receipt || {};
            if (isSuccess && blockNumber && blockHash) {
                yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_onTransactionConfirmed).call(this, txMeta, Object.assign(Object.assign({}, receipt), { blockNumber,
                    blockHash }));
                return;
            }
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            log('Failed to check transaction', id, error);
            __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_warnTransaction).call(this, txMeta, error.message, 'There was a problem loading this transaction.');
            return;
        }
        if (yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_isTransactionDropped).call(this, txMeta)) {
            __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_dropTransaction).call(this, txMeta);
        }
    });
}, _PendingTransactionTracker_onTransactionConfirmed = function _PendingTransactionTracker_onTransactionConfirmed(txMeta, receipt) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = txMeta;
        const { blockHash } = receipt;
        log('Transaction confirmed', id);
        const { baseFeePerGas, timestamp: blockTimestamp } = yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getBlockByHash).call(this, blockHash, false);
        txMeta.baseFeePerGas = baseFeePerGas;
        txMeta.blockTimestamp = blockTimestamp;
        txMeta.status = types_1.TransactionStatus.confirmed;
        txMeta.txParams.gasUsed = receipt.gasUsed;
        txMeta.txReceipt = receipt;
        txMeta.verifiedOnBlockchain = true;
        __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_updateTransaction).call(this, txMeta, 'PendingTransactionTracker:#onTransactionConfirmed - Transaction confirmed');
        this.hub.emit('transaction-confirmed', txMeta);
    });
}, _PendingTransactionTracker_isTransactionDropped = function _PendingTransactionTracker_isTransactionDropped(txMeta) {
    return __awaiter(this, void 0, void 0, function* () {
        const { hash, id, txParams: { nonce, from }, } = txMeta;
        /* istanbul ignore next */
        if (!nonce || !hash) {
            return false;
        }
        const networkNextNonceHex = yield __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getNetworkTransactionCount).call(this, from);
        const networkNextNonceNumber = parseInt(networkNextNonceHex, 16);
        const nonceNumber = parseInt(nonce, 16);
        if (nonceNumber >= networkNextNonceNumber) {
            return false;
        }
        let droppedBlockCount = __classPrivateFieldGet(this, _PendingTransactionTracker_droppedBlockCountByHash, "f").get(hash);
        if (droppedBlockCount === undefined) {
            droppedBlockCount = 0;
            __classPrivateFieldGet(this, _PendingTransactionTracker_droppedBlockCountByHash, "f").set(hash, droppedBlockCount);
        }
        if (droppedBlockCount < DROPPED_BLOCK_COUNT) {
            log('Incrementing dropped block count', { id, droppedBlockCount });
            __classPrivateFieldGet(this, _PendingTransactionTracker_droppedBlockCountByHash, "f").set(hash, droppedBlockCount + 1);
            return false;
        }
        log('Hit dropped block count', id);
        __classPrivateFieldGet(this, _PendingTransactionTracker_droppedBlockCountByHash, "f").delete(hash);
        return true;
    });
}, _PendingTransactionTracker_isNonceTaken = function _PendingTransactionTracker_isNonceTaken(txMeta) {
    const { id, txParams } = txMeta;
    return __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getCurrentChainTransactions).call(this).some((tx) => tx.id !== id &&
        tx.txParams.from === txParams.from &&
        tx.status === types_1.TransactionStatus.confirmed &&
        tx.txParams.nonce === txParams.nonce &&
        tx.type !== types_1.TransactionType.incoming);
}, _PendingTransactionTracker_getPendingTransactions = function _PendingTransactionTracker_getPendingTransactions() {
    return __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_getCurrentChainTransactions).call(this).filter((tx) => tx.status === types_1.TransactionStatus.submitted &&
        !tx.verifiedOnBlockchain &&
        !tx.isUserOperation);
}, _PendingTransactionTracker_warnTransaction = function _PendingTransactionTracker_warnTransaction(txMeta, error, message) {
    txMeta.warning = {
        error,
        message,
    };
    __classPrivateFieldGet(this, _PendingTransactionTracker_instances, "m", _PendingTransactionTracker_updateTransaction).call(this, txMeta, 'PendingTransactionTracker:#warnTransaction - Warning added');
}, _PendingTransactionTracker_failTransaction = function _PendingTransactionTracker_failTransaction(txMeta, error) {
    log('Transaction failed', txMeta.id, error);
    this.hub.emit('transaction-failed', txMeta, error);
}, _PendingTransactionTracker_dropTransaction = function _PendingTransactionTracker_dropTransaction(txMeta) {
    log('Transaction dropped', txMeta.id);
    this.hub.emit('transaction-dropped', txMeta);
}, _PendingTransactionTracker_updateTransaction = function _PendingTransactionTracker_updateTransaction(txMeta, note) {
    this.hub.emit('transaction-updated', txMeta, note);
}, _PendingTransactionTracker_getTransactionReceipt = function _PendingTransactionTracker_getTransactionReceipt(txHash) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, controller_utils_1.query)(__classPrivateFieldGet(this, _PendingTransactionTracker_getEthQuery, "f").call(this), 'getTransactionReceipt', [txHash]);
    });
}, _PendingTransactionTracker_getBlockByHash = function _PendingTransactionTracker_getBlockByHash(blockHash, includeTransactionDetails) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, controller_utils_1.query)(__classPrivateFieldGet(this, _PendingTransactionTracker_getEthQuery, "f").call(this), 'getBlockByHash', [
            blockHash,
            includeTransactionDetails,
        ]);
    });
}, _PendingTransactionTracker_getNetworkTransactionCount = function _PendingTransactionTracker_getNetworkTransactionCount(address) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, controller_utils_1.query)(__classPrivateFieldGet(this, _PendingTransactionTracker_getEthQuery, "f").call(this), 'getTransactionCount', [address]);
    });
}, _PendingTransactionTracker_getCurrentChainTransactions = function _PendingTransactionTracker_getCurrentChainTransactions() {
    const currentChainId = __classPrivateFieldGet(this, _PendingTransactionTracker_getChainId, "f").call(this);
    return __classPrivateFieldGet(this, _PendingTransactionTracker_getTransactions, "f").call(this).filter((tx) => tx.chainId === currentChainId);
};
//# sourceMappingURL=PendingTransactionTracker.js.map