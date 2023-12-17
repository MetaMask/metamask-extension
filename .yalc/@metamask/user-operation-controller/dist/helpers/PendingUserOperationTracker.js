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
var _PendingUserOperationTracker_instances, _PendingUserOperationTracker_getUserOperations, _PendingUserOperationTracker_messenger, _PendingUserOperationTracker_checkUserOperations, _PendingUserOperationTracker_checkUserOperation, _PendingUserOperationTracker_onUserOperationConfirmed, _PendingUserOperationTracker_onUserOperationFailed, _PendingUserOperationTracker_getPendingUserOperations, _PendingUserOperationTracker_updateUserOperation, _PendingUserOperationTracker_getUserOperationReceipt;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendingUserOperationTracker = void 0;
const controller_utils_1 = require("@metamask/controller-utils");
const eth_query_1 = __importDefault(require("@metamask/eth-query"));
const polling_controller_1 = require("@metamask/polling-controller");
const utils_1 = require("@metamask/utils");
const events_1 = __importDefault(require("events"));
const logger_1 = require("../logger");
const types_1 = require("../types");
const Bundler_1 = require("./Bundler");
const log = (0, utils_1.createModuleLogger)(logger_1.projectLogger, 'pending-user-operations');
/**
 * A helper class to periodically query the bundlers
 * and update the status of any submitted user operations.
 */
class PendingUserOperationTracker extends polling_controller_1.BlockTrackerPollingControllerOnly {
    constructor({ getUserOperations, messenger, }) {
        super();
        _PendingUserOperationTracker_instances.add(this);
        _PendingUserOperationTracker_getUserOperations.set(this, void 0);
        _PendingUserOperationTracker_messenger.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _PendingUserOperationTracker_getUserOperations, getUserOperations, "f");
        __classPrivateFieldSet(this, _PendingUserOperationTracker_messenger, messenger, "f");
    }
    _executePoll(networkClientId, _options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { blockTracker, configuration, provider } = this._getNetworkClientById(networkClientId);
                log('Polling', {
                    blockNumber: blockTracker.getCurrentBlock(),
                    chainId: configuration.chainId,
                });
                yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_checkUserOperations).call(this, configuration.chainId, provider);
            }
            catch (error) {
                /* istanbul ignore next */
                log('Failed to check user operations', error);
            }
        });
    }
    _getNetworkClientById(networkClientId) {
        return __classPrivateFieldGet(this, _PendingUserOperationTracker_messenger, "f").call('NetworkController:getNetworkClientById', networkClientId);
    }
}
exports.PendingUserOperationTracker = PendingUserOperationTracker;
_PendingUserOperationTracker_getUserOperations = new WeakMap(), _PendingUserOperationTracker_messenger = new WeakMap(), _PendingUserOperationTracker_instances = new WeakSet(), _PendingUserOperationTracker_checkUserOperations = function _PendingUserOperationTracker_checkUserOperations(chainId, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const pendingUserOperations = __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_getPendingUserOperations).call(this).filter((metadata) => metadata.chainId === chainId);
        if (!pendingUserOperations.length) {
            log('No pending user operations to check');
            return;
        }
        log('Found pending user operations to check', {
            count: pendingUserOperations.length,
            ids: pendingUserOperations.map((userOperation) => userOperation.id),
        });
        yield Promise.all(pendingUserOperations.map((userOperation) => __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_checkUserOperation).call(this, userOperation, provider)));
    });
}, _PendingUserOperationTracker_checkUserOperation = function _PendingUserOperationTracker_checkUserOperation(metadata, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const { bundlerUrl, hash, id } = metadata;
        if (!hash || !bundlerUrl) {
            log('Skipping user operation as missing hash or bundler', id);
            return;
        }
        try {
            const receipt = yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_getUserOperationReceipt).call(this, hash, bundlerUrl);
            const isSuccess = receipt === null || receipt === void 0 ? void 0 : receipt.success;
            if (receipt && !isSuccess) {
                __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_onUserOperationFailed).call(this, metadata, receipt);
                return;
            }
            if (isSuccess) {
                yield __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_onUserOperationConfirmed).call(this, metadata, receipt, provider);
                return;
            }
            log('No receipt found for user operation', { id, hash });
        }
        catch (error) {
            log('Failed to check user operation', id, error);
        }
    });
}, _PendingUserOperationTracker_onUserOperationConfirmed = function _PendingUserOperationTracker_onUserOperationConfirmed(metadata, receipt, provider) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = metadata;
        const { actualGasCost, actualGasUsed, receipt: { blockHash, transactionHash }, } = receipt;
        log('User operation confirmed', id, transactionHash);
        const { baseFeePerGas } = yield (0, controller_utils_1.query)(new eth_query_1.default(provider), 'getBlockByHash', [blockHash, false]);
        metadata.actualGasCost = actualGasCost;
        metadata.actualGasUsed = actualGasUsed;
        metadata.baseFeePerGas = baseFeePerGas;
        metadata.status = types_1.UserOperationStatus.Confirmed;
        metadata.transactionHash = transactionHash;
        __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_updateUserOperation).call(this, metadata);
        this.hub.emit('user-operation-confirmed', metadata);
    });
}, _PendingUserOperationTracker_onUserOperationFailed = function _PendingUserOperationTracker_onUserOperationFailed(metadata, _receipt) {
    const { id } = metadata;
    log('User operation failed', id);
    metadata.status = types_1.UserOperationStatus.Failed;
    __classPrivateFieldGet(this, _PendingUserOperationTracker_instances, "m", _PendingUserOperationTracker_updateUserOperation).call(this, metadata);
    this.hub.emit('user-operation-failed', metadata, new Error('User operation receipt has failed status'));
}, _PendingUserOperationTracker_getPendingUserOperations = function _PendingUserOperationTracker_getPendingUserOperations() {
    return __classPrivateFieldGet(this, _PendingUserOperationTracker_getUserOperations, "f").call(this).filter((userOperation) => userOperation.status === types_1.UserOperationStatus.Submitted);
}, _PendingUserOperationTracker_updateUserOperation = function _PendingUserOperationTracker_updateUserOperation(metadata) {
    this.hub.emit('user-operation-updated', metadata);
}, _PendingUserOperationTracker_getUserOperationReceipt = function _PendingUserOperationTracker_getUserOperationReceipt(hash, bundlerUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const bundler = new Bundler_1.Bundler(bundlerUrl);
        return bundler.getUserOperationReceipt(hash);
    });
};
//# sourceMappingURL=PendingUserOperationTracker.js.map