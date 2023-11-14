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
var _PendingUserOperationTracker_instances, _PendingUserOperationTracker_blockTracker, _PendingUserOperationTracker_getBlockByHash, _PendingUserOperationTracker_getUserOperations, _PendingUserOperationTracker_listener, _PendingUserOperationTracker_onStateChange, _PendingUserOperationTracker_running, _PendingUserOperationTracker_start, _PendingUserOperationTracker_stop, _PendingUserOperationTracker_onLatestBlock, _PendingUserOperationTracker_checkUserOperations, _PendingUserOperationTracker_checkUserOperation, _PendingUserOperationTracker_onUserOperationConfirmed, _PendingUserOperationTracker_onUserOperationFailed, _PendingUserOperationTracker_getPendingUserOperations, _PendingUserOperationTracker_updateUserOperation, _PendingUserOperationTracker_getUserOperationReceipt;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingUserOperationTracker = void 0;
const utils_1 = require("@metamask/utils");
const events_1 = __importDefault(require("events"));
const logger_1 = require("../logger");
const types_1 = require("../types");
const Bundler_1 = require("./Bundler");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'pending-user-operations');
class PendingUserOperationTracker {
    constructor({ blockTracker, getBlockByHash, getUserOperations, onStateChange, }) {
        _PendingUserOperationTracker_instances.add(this);
        _PendingUserOperationTracker_blockTracker.set(this, void 0);
        _PendingUserOperationTracker_getBlockByHash.set(this, void 0);
        _PendingUserOperationTracker_getUserOperations.set(this, void 0);
        _PendingUserOperationTracker_listener.set(this, void 0);
        _PendingUserOperationTracker_onStateChange.set(this, void 0);
        _PendingUserOperationTracker_running.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _PendingUserOperationTracker_blockTracker, blockTracker, "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_getBlockByHash, getBlockByHash, "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_getUserOperations, getUserOperations, "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_listener, __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_onLatestBlock).bind(this), "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_onStateChange, onStateChange, "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_running, false, "f");
        __classPrivateFieldGet(this, _PendingUserOperationTracker_onStateChange, "f").call(this, (state) => {
            const pendingUserOperations = __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_getPendingUserOperations).call(this, Object.values(state.userOperations));
            if (pendingUserOperations.length) {
                __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_start).call(this);
            }
            else {
                __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_stop).call(this);
            }
        });
    }
}
exports.PendingUserOperationTracker = PendingUserOperationTracker;
_PendingUserOperationTracker_blockTracker = new WeakMap(), _PendingUserOperationTracker_getBlockByHash = new WeakMap(), _PendingUserOperationTracker_getUserOperations = new WeakMap(), _PendingUserOperationTracker_listener = new WeakMap(), _PendingUserOperationTracker_onStateChange = new WeakMap(), _PendingUserOperationTracker_running = new WeakMap(), _PendingUserOperationTracker_instances = new WeakSet(), _PendingUserOperationTracker_start = function _PendingUserOperationTracker_start() {
    if (__classPrivateFieldGet(this, _PendingUserOperationTracker_running, "f")) {
        return;
    }
    __classPrivateFieldGet(this, _PendingUserOperationTracker_blockTracker, "f").on('latest', __classPrivateFieldGet(this, _PendingUserOperationTracker_listener, "f"));
    __classPrivateFieldSet(this, _PendingUserOperationTracker_running, true, "f");
    log('Started polling');
}, _PendingUserOperationTracker_stop = function _PendingUserOperationTracker_stop() {
    if (!__classPrivateFieldGet(this, _PendingUserOperationTracker_running, "f")) {
        return;
    }
    __classPrivateFieldGet(this, _PendingUserOperationTracker_blockTracker, "f").removeListener('latest', __classPrivateFieldGet(this, _PendingUserOperationTracker_listener, "f"));
    __classPrivateFieldSet(this, _PendingUserOperationTracker_running, false, "f");
    log('Stopped polling');
}, _PendingUserOperationTracker_onLatestBlock = function _PendingUserOperationTracker_onLatestBlock(latestBlockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            log('Checking latest block', latestBlockNumber);
            yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_checkUserOperations).call(this);
        }
        catch (error) {
            /* istanbul ignore next */
            log('Failed to check user operations', error);
        }
    });
}, _PendingUserOperationTracker_checkUserOperations = function _PendingUserOperationTracker_checkUserOperations() {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingUserOperations = __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_getPendingUserOperations).call(this);
        if (!pendingUserOperations.length) {
            log('No pending user operations to check');
            return;
        }
        log('Found pending user operations to check', {
            count: pendingUserOperations.length,
            ids: pendingUserOperations.map((userOperation) => userOperation.id),
        });
        yield Promise.all(pendingUserOperations.map((userOperation) => __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_checkUserOperation).call(this, userOperation)));
    });
}, _PendingUserOperationTracker_checkUserOperation = function _PendingUserOperationTracker_checkUserOperation(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, hash, id } = metadata;
        if (!hash) {
            log('Skipping user operation as no hash', id);
            return;
        }
        try {
            const receipt = yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_getUserOperationReceipt).call(this, hash, chainId);
            const isSuccess = receipt === null || receipt === void 0 ? void 0 : receipt.success;
            if (receipt && !isSuccess) {
                __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_onUserOperationFailed).call(this, metadata, receipt);
                return;
            }
            if (isSuccess) {
                yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_onUserOperationConfirmed).call(this, metadata, receipt);
                return;
            }
            log('No receipt found for user operation', { id, hash });
        }
        catch (error) {
            log('Failed to check user operation', id, error);
        }
    });
}, _PendingUserOperationTracker_onUserOperationConfirmed = function _PendingUserOperationTracker_onUserOperationConfirmed(metadata, receipt) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = metadata;
        const { actualGasCost, actualGasUsed, receipt: { blockHash, transactionHash }, } = receipt;
        log('User operation confirmed', id, transactionHash);
        const block = yield __classPrivateFieldGet(this, _PendingUserOperationTracker_getBlockByHash, "f").call(this, blockHash);
        metadata.baseFeePerGas = block.baseFeePerGas.toHexString();
        metadata.actualGasCost = actualGasCost;
        metadata.actualGasUsed = actualGasUsed;
        metadata.status = types_1.UserOperationStatus.Confirmed;
        metadata.transactionHash = transactionHash || null;
        __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_updateUserOperation).call(this, metadata);
        this.hub.emit(`${id}:confirmed`, metadata);
    });
}, _PendingUserOperationTracker_onUserOperationFailed = function _PendingUserOperationTracker_onUserOperationFailed(metadata, _receipt) {
    const { id } = metadata;
    log('User operation failed', id);
    metadata.status = types_1.UserOperationStatus.Failed;
    __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_updateUserOperation).call(this, metadata);
    this.hub.emit(`${id}:failed`, metadata, new Error('User operation receipt has failed status'));
}, _PendingUserOperationTracker_getPendingUserOperations = function _PendingUserOperationTracker_getPendingUserOperations(userOperations) {
    return (userOperations !== null && userOperations !== void 0 ? userOperations : __classPrivateFieldGet(this, _PendingUserOperationTracker_getUserOperations, "f").call(this)).filter((userOperation) => userOperation.status === types_1.UserOperationStatus.Submitted);
}, _PendingUserOperationTracker_updateUserOperation = function _PendingUserOperationTracker_updateUserOperation(metadata) {
    this.hub.emit('user-operation-updated', metadata);
}, _PendingUserOperationTracker_getUserOperationReceipt = function _PendingUserOperationTracker_getUserOperationReceipt(hash, chainId) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundler = (0, Bundler_1.getBundler)(chainId);
        return bundler.getUserOperationReceipt(hash);
    });
};
//# sourceMappingURL=PendingUserOperationTracker.js.map