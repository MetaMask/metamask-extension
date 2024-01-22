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
var _IncomingTransactionHelper_instances, _IncomingTransactionHelper_blockTracker, _IncomingTransactionHelper_getCurrentAccount, _IncomingTransactionHelper_getLastFetchedBlockNumbers, _IncomingTransactionHelper_getLocalTransactions, _IncomingTransactionHelper_getNetworkState, _IncomingTransactionHelper_isEnabled, _IncomingTransactionHelper_isRunning, _IncomingTransactionHelper_mutex, _IncomingTransactionHelper_onLatestBlock, _IncomingTransactionHelper_queryEntireHistory, _IncomingTransactionHelper_remoteTransactionSource, _IncomingTransactionHelper_transactionLimit, _IncomingTransactionHelper_updateTransactions, _IncomingTransactionHelper_sortTransactionsByTime, _IncomingTransactionHelper_getNewTransactions, _IncomingTransactionHelper_getUpdatedTransactions, _IncomingTransactionHelper_isTransactionOutdated, _IncomingTransactionHelper_getFromBlock, _IncomingTransactionHelper_updateLastFetchedBlockNumber, _IncomingTransactionHelper_getBlockNumberKey, _IncomingTransactionHelper_canStart, _IncomingTransactionHelper_getCurrentChainId;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingTransactionHelper = void 0;
const async_mutex_1 = require("async-mutex");
const events_1 = __importDefault(require("events"));
const logger_1 = require("../logger");
const RECENT_HISTORY_BLOCK_RANGE = 10;
// TODO: Replace `any` with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UPDATE_CHECKS = [
    (txMeta) => txMeta.status,
    (txMeta) => txMeta.txParams.gasUsed,
];
class IncomingTransactionHelper {
    constructor({ blockTracker, getCurrentAccount, getLastFetchedBlockNumbers, getLocalTransactions, getNetworkState, isEnabled, queryEntireHistory, remoteTransactionSource, transactionLimit, updateTransactions, }) {
        _IncomingTransactionHelper_instances.add(this);
        _IncomingTransactionHelper_blockTracker.set(this, void 0);
        _IncomingTransactionHelper_getCurrentAccount.set(this, void 0);
        _IncomingTransactionHelper_getLastFetchedBlockNumbers.set(this, void 0);
        _IncomingTransactionHelper_getLocalTransactions.set(this, void 0);
        _IncomingTransactionHelper_getNetworkState.set(this, void 0);
        _IncomingTransactionHelper_isEnabled.set(this, void 0);
        _IncomingTransactionHelper_isRunning.set(this, void 0);
        _IncomingTransactionHelper_mutex.set(this, new async_mutex_1.Mutex());
        _IncomingTransactionHelper_onLatestBlock.set(this, void 0);
        _IncomingTransactionHelper_queryEntireHistory.set(this, void 0);
        _IncomingTransactionHelper_remoteTransactionSource.set(this, void 0);
        _IncomingTransactionHelper_transactionLimit.set(this, void 0);
        _IncomingTransactionHelper_updateTransactions.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _IncomingTransactionHelper_blockTracker, blockTracker, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_getCurrentAccount, getCurrentAccount, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_getLastFetchedBlockNumbers, getLastFetchedBlockNumbers, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_getLocalTransactions, getLocalTransactions || (() => []), "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_getNetworkState, getNetworkState, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_isEnabled, isEnabled !== null && isEnabled !== void 0 ? isEnabled : (() => true), "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_isRunning, false, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_queryEntireHistory, queryEntireHistory !== null && queryEntireHistory !== void 0 ? queryEntireHistory : true, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_remoteTransactionSource, remoteTransactionSource, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_transactionLimit, transactionLimit, "f");
        __classPrivateFieldSet(this, _IncomingTransactionHelper_updateTransactions, updateTransactions !== null && updateTransactions !== void 0 ? updateTransactions : false, "f");
        // Using a property instead of a method to provide a listener reference
        // with the correct scope that we can remove later if stopped.
        __classPrivateFieldSet(this, _IncomingTransactionHelper_onLatestBlock, (blockNumberHex) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.update(blockNumberHex);
            }
            catch (error) {
                console.error('Error while checking incoming transactions', error);
            }
        }), "f");
    }
    start() {
        if (__classPrivateFieldGet(this, _IncomingTransactionHelper_isRunning, "f")) {
            return;
        }
        if (!__classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_canStart).call(this)) {
            return;
        }
        __classPrivateFieldGet(this, _IncomingTransactionHelper_blockTracker, "f").addListener('latest', __classPrivateFieldGet(this, _IncomingTransactionHelper_onLatestBlock, "f"));
        __classPrivateFieldSet(this, _IncomingTransactionHelper_isRunning, true, "f");
    }
    stop() {
        __classPrivateFieldGet(this, _IncomingTransactionHelper_blockTracker, "f").removeListener('latest', __classPrivateFieldGet(this, _IncomingTransactionHelper_onLatestBlock, "f"));
        __classPrivateFieldSet(this, _IncomingTransactionHelper_isRunning, false, "f");
    }
    update(latestBlockNumberHex) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield __classPrivateFieldGet(this, _IncomingTransactionHelper_mutex, "f").acquire();
            (0, logger_1.incomingTransactionsLogger)('Checking for incoming transactions');
            try {
                if (!__classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_canStart).call(this)) {
                    return;
                }
                const latestBlockNumber = parseInt(latestBlockNumberHex || (yield __classPrivateFieldGet(this, _IncomingTransactionHelper_blockTracker, "f").getLatestBlock()), 16);
                const additionalLastFetchedKeys = (_c = (_b = (_a = __classPrivateFieldGet(this, _IncomingTransactionHelper_remoteTransactionSource, "f")).getLastBlockVariations) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
                const fromBlock = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getFromBlock).call(this, latestBlockNumber, additionalLastFetchedKeys);
                const address = __classPrivateFieldGet(this, _IncomingTransactionHelper_getCurrentAccount, "f").call(this);
                const currentChainId = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getCurrentChainId).call(this);
                let remoteTransactions = [];
                try {
                    remoteTransactions =
                        yield __classPrivateFieldGet(this, _IncomingTransactionHelper_remoteTransactionSource, "f").fetchTransactions({
                            address,
                            currentChainId,
                            fromBlock,
                            limit: __classPrivateFieldGet(this, _IncomingTransactionHelper_transactionLimit, "f"),
                        });
                    // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }
                catch (error) {
                    (0, logger_1.incomingTransactionsLogger)('Error while fetching remote transactions', error);
                    return;
                }
                if (!__classPrivateFieldGet(this, _IncomingTransactionHelper_updateTransactions, "f")) {
                    remoteTransactions = remoteTransactions.filter((tx) => { var _a; return ((_a = tx.txParams.to) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === address.toLowerCase(); });
                }
                const localTransactions = !__classPrivateFieldGet(this, _IncomingTransactionHelper_updateTransactions, "f")
                    ? []
                    : __classPrivateFieldGet(this, _IncomingTransactionHelper_getLocalTransactions, "f").call(this);
                const newTransactions = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getNewTransactions).call(this, remoteTransactions, localTransactions);
                const updatedTransactions = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getUpdatedTransactions).call(this, remoteTransactions, localTransactions);
                if (newTransactions.length > 0 || updatedTransactions.length > 0) {
                    __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_sortTransactionsByTime).call(this, newTransactions);
                    __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_sortTransactionsByTime).call(this, updatedTransactions);
                    (0, logger_1.incomingTransactionsLogger)('Found incoming transactions', {
                        new: newTransactions,
                        updated: updatedTransactions,
                    });
                    this.hub.emit('transactions', {
                        added: newTransactions,
                        updated: updatedTransactions,
                    });
                }
                __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_updateLastFetchedBlockNumber).call(this, remoteTransactions, additionalLastFetchedKeys);
            }
            finally {
                releaseLock();
            }
        });
    }
}
exports.IncomingTransactionHelper = IncomingTransactionHelper;
_IncomingTransactionHelper_blockTracker = new WeakMap(), _IncomingTransactionHelper_getCurrentAccount = new WeakMap(), _IncomingTransactionHelper_getLastFetchedBlockNumbers = new WeakMap(), _IncomingTransactionHelper_getLocalTransactions = new WeakMap(), _IncomingTransactionHelper_getNetworkState = new WeakMap(), _IncomingTransactionHelper_isEnabled = new WeakMap(), _IncomingTransactionHelper_isRunning = new WeakMap(), _IncomingTransactionHelper_mutex = new WeakMap(), _IncomingTransactionHelper_onLatestBlock = new WeakMap(), _IncomingTransactionHelper_queryEntireHistory = new WeakMap(), _IncomingTransactionHelper_remoteTransactionSource = new WeakMap(), _IncomingTransactionHelper_transactionLimit = new WeakMap(), _IncomingTransactionHelper_updateTransactions = new WeakMap(), _IncomingTransactionHelper_instances = new WeakSet(), _IncomingTransactionHelper_sortTransactionsByTime = function _IncomingTransactionHelper_sortTransactionsByTime(transactions) {
    transactions.sort((a, b) => (a.time < b.time ? -1 : 1));
}, _IncomingTransactionHelper_getNewTransactions = function _IncomingTransactionHelper_getNewTransactions(remoteTxs, localTxs) {
    return remoteTxs.filter((tx) => !localTxs.some(({ hash }) => hash === tx.hash));
}, _IncomingTransactionHelper_getUpdatedTransactions = function _IncomingTransactionHelper_getUpdatedTransactions(remoteTxs, localTxs) {
    return remoteTxs.filter((remoteTx) => localTxs.some((localTx) => remoteTx.hash === localTx.hash &&
        __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_isTransactionOutdated).call(this, remoteTx, localTx)));
}, _IncomingTransactionHelper_isTransactionOutdated = function _IncomingTransactionHelper_isTransactionOutdated(remoteTx, localTx) {
    return UPDATE_CHECKS.some((getValue) => getValue(remoteTx) !== getValue(localTx));
}, _IncomingTransactionHelper_getFromBlock = function _IncomingTransactionHelper_getFromBlock(latestBlockNumber, additionalKeys) {
    const lastFetchedKey = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getBlockNumberKey).call(this, additionalKeys);
    const lastFetchedBlockNumber = __classPrivateFieldGet(this, _IncomingTransactionHelper_getLastFetchedBlockNumbers, "f").call(this)[lastFetchedKey];
    if (lastFetchedBlockNumber) {
        return lastFetchedBlockNumber + 1;
    }
    return __classPrivateFieldGet(this, _IncomingTransactionHelper_queryEntireHistory, "f")
        ? undefined
        : latestBlockNumber - RECENT_HISTORY_BLOCK_RANGE;
}, _IncomingTransactionHelper_updateLastFetchedBlockNumber = function _IncomingTransactionHelper_updateLastFetchedBlockNumber(remoteTxs, additionalKeys) {
    let lastFetchedBlockNumber = -1;
    for (const tx of remoteTxs) {
        const currentBlockNumberValue = tx.blockNumber
            ? parseInt(tx.blockNumber, 10)
            : -1;
        lastFetchedBlockNumber = Math.max(lastFetchedBlockNumber, currentBlockNumberValue);
    }
    if (lastFetchedBlockNumber === -1) {
        return;
    }
    const lastFetchedKey = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getBlockNumberKey).call(this, additionalKeys);
    const lastFetchedBlockNumbers = __classPrivateFieldGet(this, _IncomingTransactionHelper_getLastFetchedBlockNumbers, "f").call(this);
    const previousValue = lastFetchedBlockNumbers[lastFetchedKey];
    if (previousValue >= lastFetchedBlockNumber) {
        return;
    }
    lastFetchedBlockNumbers[lastFetchedKey] = lastFetchedBlockNumber;
    this.hub.emit('updatedLastFetchedBlockNumbers', {
        lastFetchedBlockNumbers,
        blockNumber: lastFetchedBlockNumber,
    });
}, _IncomingTransactionHelper_getBlockNumberKey = function _IncomingTransactionHelper_getBlockNumberKey(additionalKeys) {
    var _a;
    const currentChainId = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getCurrentChainId).call(this);
    const currentAccount = (_a = __classPrivateFieldGet(this, _IncomingTransactionHelper_getCurrentAccount, "f").call(this)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    return [currentChainId, currentAccount, ...additionalKeys].join('#');
}, _IncomingTransactionHelper_canStart = function _IncomingTransactionHelper_canStart() {
    const isEnabled = __classPrivateFieldGet(this, _IncomingTransactionHelper_isEnabled, "f").call(this);
    const currentChainId = __classPrivateFieldGet(this, _IncomingTransactionHelper_instances, "m", _IncomingTransactionHelper_getCurrentChainId).call(this);
    const isSupportedNetwork = __classPrivateFieldGet(this, _IncomingTransactionHelper_remoteTransactionSource, "f").isSupportedNetwork(currentChainId);
    return isEnabled && isSupportedNetwork;
}, _IncomingTransactionHelper_getCurrentChainId = function _IncomingTransactionHelper_getCurrentChainId() {
    return __classPrivateFieldGet(this, _IncomingTransactionHelper_getNetworkState, "f").call(this).providerConfig.chainId;
};
//# sourceMappingURL=IncomingTransactionHelper.js.map