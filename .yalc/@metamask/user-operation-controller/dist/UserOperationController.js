"use strict";
/* eslint-disable n/no-process-env */
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
var _UserOperationController_instances, _UserOperationController_blockTracker, _UserOperationController_getGasFeeEstimates, _UserOperationController_getPrivateKey, _UserOperationController_getTransactions, _UserOperationController_pendingTracker, _UserOperationController_provider, _UserOperationController_createMetadata, _UserOperationController_applySnapData, _UserOperationController_updateGasFees, _UserOperationController_updateGas, _UserOperationController_addPaymasterData, _UserOperationController_approveUserOperation, _UserOperationController_signUserOperation, _UserOperationController_submitUserOperation, _UserOperationController_failUserOperation, _UserOperationController_createEmptyUserOperation, _UserOperationController_updateMetadata, _UserOperationController_updateTransaction, _UserOperationController_getState, _UserOperationController_requestApproval;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOperationController = void 0;
const abi_1 = require("@ethersproject/abi");
const constants_1 = require("@ethersproject/constants");
const providers_1 = require("@ethersproject/providers");
const base_controller_1 = require("@metamask/base-controller");
const controller_utils_1 = require("@metamask/controller-utils");
const ethereumjs_util_1 = require("ethereumjs-util");
const events_1 = __importDefault(require("events"));
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const constants_2 = require("./constants");
const Bundler_1 = require("./helpers/Bundler");
const PendingUserOperationTracker_1 = require("./helpers/PendingUserOperationTracker");
const logger_1 = require("./logger");
const snaps_1 = require("./snaps");
const types_1 = require("./types");
const gas_fees_1 = require("./utils/gas-fees");
const transaction_1 = require("./utils/transaction");
const DUMMY_SIGNATURE = '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';
const GAS_BUFFER = 2;
const controllerName = 'UserOperationController';
const stateMetadata = {
    userOperations: { persist: true, anonymous: false },
};
const getDefaultState = () => ({
    userOperations: {},
});
/**
 * Controller for creating and managing the life cycle of user operations.
 */
class UserOperationController extends base_controller_1.BaseControllerV2 {
    /**
     * Construct a UserOperation controller.
     *
     * @param options - Controller options.
     * @param options.blockTracker -
     * @param options.getGasFeeEstimates -
     * @param options.getPrivateKey -
     * @param options.getTransactions -
     * @param options.messenger - Restricted controller messenger for the user operation controller.
     * @param options.provider -
     * @param options.state - Initial state to set on the controller.
     */
    constructor({ blockTracker, getGasFeeEstimates, getPrivateKey, getTransactions, messenger, provider, state, }) {
        super({
            name: controllerName,
            metadata: stateMetadata,
            messenger,
            state: Object.assign(Object.assign({}, getDefaultState()), state),
        });
        _UserOperationController_instances.add(this);
        _UserOperationController_blockTracker.set(this, void 0);
        _UserOperationController_getGasFeeEstimates.set(this, void 0);
        _UserOperationController_getPrivateKey.set(this, void 0);
        _UserOperationController_getTransactions.set(this, void 0);
        _UserOperationController_pendingTracker.set(this, void 0);
        _UserOperationController_provider.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _UserOperationController_blockTracker, blockTracker, "f");
        __classPrivateFieldSet(this, _UserOperationController_getGasFeeEstimates, getGasFeeEstimates, "f");
        __classPrivateFieldSet(this, _UserOperationController_getPrivateKey, getPrivateKey, "f");
        __classPrivateFieldSet(this, _UserOperationController_getTransactions, getTransactions, "f");
        __classPrivateFieldSet(this, _UserOperationController_provider, provider, "f");
        __classPrivateFieldSet(this, _UserOperationController_pendingTracker, new PendingUserOperationTracker_1.PendingUserOperationTracker({
            blockTracker: __classPrivateFieldGet(this, _UserOperationController_blockTracker, "f"),
            getBlockByHash: (hash) => new providers_1.Web3Provider(__classPrivateFieldGet(this, _UserOperationController_provider, "f")).getBlock(hash),
            getUserOperations: () => Object.values(__classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_getState).call(this).userOperations),
            onStateChange: (listener) => this.hub.on('user-operations-updated', (newState) => {
                listener(newState);
            }),
        }), "f");
        __classPrivateFieldGet(this, _UserOperationController_pendingTracker, "f").hub.on('user-operation-updated', (metadata) => {
            __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
        });
    }
    addUserOperationFromTransaction(transaction, { chainId, snapId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const bundler = (0, Bundler_1.getBundler)(chainId);
            const metadata = __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_createMetadata).call(this, chainId);
            const { id } = metadata;
            const hash = (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_applySnapData).call(this, metadata, transaction, snapId);
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateGasFees).call(this, metadata);
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateGas).call(this, metadata, bundler);
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addPaymasterData).call(this, metadata, snapId);
                    const resultCallbacks = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_approveUserOperation).call(this, metadata);
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_signUserOperation).call(this, metadata, snapId);
                    yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_submitUserOperation).call(this, metadata, bundler);
                    resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.success();
                    return metadata.hash;
                }
                catch (error) {
                    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_failUserOperation).call(this, metadata, error);
                    throw error;
                }
            }))();
            const transactionHash = new Promise((resolve, reject) => {
                __classPrivateFieldGet(this, _UserOperationController_pendingTracker, "f").hub.once(`${id}:confirmed`, (meta) => {
                    resolve(meta.transactionHash);
                });
                __classPrivateFieldGet(this, _UserOperationController_pendingTracker, "f").hub.once(`${id}:failed`, (_metadata, error) => {
                    reject(error);
                });
            });
            return {
                id,
                hash,
                transactionHash,
            };
        });
    }
}
exports.UserOperationController = UserOperationController;
_UserOperationController_blockTracker = new WeakMap(), _UserOperationController_getGasFeeEstimates = new WeakMap(), _UserOperationController_getPrivateKey = new WeakMap(), _UserOperationController_getTransactions = new WeakMap(), _UserOperationController_pendingTracker = new WeakMap(), _UserOperationController_provider = new WeakMap(), _UserOperationController_instances = new WeakSet(), _UserOperationController_createMetadata = function _UserOperationController_createMetadata(chainId) {
    const metadata = {
        actualGasCost: null,
        actualGasUsed: null,
        baseFeePerGas: null,
        chainId,
        error: null,
        hash: null,
        id: (0, uuid_1.v1)(),
        status: types_1.UserOperationStatus.Unapproved,
        time: Date.now(),
        transactionHash: null,
        transactionParams: null,
        userOperation: __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_createEmptyUserOperation).call(this),
        userFeeLevel: null,
    };
    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    (0, logger_1.projectLogger)('Added user operation', metadata.id);
    return metadata;
}, _UserOperationController_applySnapData = function _UserOperationController_applySnapData(metadata, transaction, snapId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, userOperation } = metadata;
        (0, logger_1.projectLogger)('Requesting data from snap', { id, snapId });
        const provider = new providers_1.Web3Provider(__classPrivateFieldGet(this, _UserOperationController_provider, "f"));
        const ethereum = {
            request: ({ method, params }) => provider.send(method, params),
        };
        const response = yield (0, snaps_1.sendSnapUserOperationRequest)(snapId, {
            ethereum,
            to: transaction.to,
            value: transaction.value,
            data: transaction.data,
        });
        userOperation.callData = response.callData;
        userOperation.initCode = response.initCode;
        userOperation.nonce = response.nonce;
        userOperation.sender = response.sender;
        metadata.transactionParams = transaction;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_updateGasFees = function _UserOperationController_updateGasFees(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, gas_fees_1.updateGasFees)({
            getGasFeeEstimates: __classPrivateFieldGet(this, _UserOperationController_getGasFeeEstimates, "f"),
            metadata,
            provider: new providers_1.Web3Provider(__classPrivateFieldGet(this, _UserOperationController_provider, "f")),
        });
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_updateGas = function _UserOperationController_updateGas(metadata, bundler) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, userOperation } = metadata;
        (0, logger_1.projectLogger)('Updating gas', id);
        const paymasterAddress = process.env.PAYMASTER_ADDRESS;
        const encodedValidUntilAfter = (0, ethereumjs_util_1.stripHexPrefix)(abi_1.defaultAbiCoder.encode(['uint48', 'uint48'], [0, 0]));
        const dummyPaymasterData = `${paymasterAddress}${encodedValidUntilAfter}${(0, ethereumjs_util_1.stripHexPrefix)(DUMMY_SIGNATURE)}`;
        const payload = Object.assign(Object.assign({}, userOperation), { callGasLimit: '0x1', preVerificationGas: '0x1', verificationGasLimit: '0x1', signature: DUMMY_SIGNATURE, paymasterAndData: dummyPaymasterData });
        (0, logger_1.projectLogger)('Estimating gas', {
            paymasterAddress,
            encodedValidUntilAfter,
            dummySignature: payload.signature,
            dummyPaymasterData: payload.paymasterAndData,
        });
        const estimatedGas = yield bundler.estimateUserOperationGas(payload, constants_2.ENTRYPOINT);
        userOperation.preVerificationGas = (0, controller_utils_1.toHex)(Math.round(estimatedGas.preVerificationGas * GAS_BUFFER));
        userOperation.verificationGasLimit = (0, controller_utils_1.toHex)(Math.round(estimatedGas.verificationGasLimit * GAS_BUFFER));
        userOperation.callGasLimit = (0, controller_utils_1.toHex)(Math.round(estimatedGas.callGasLimit * GAS_BUFFER));
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_addPaymasterData = function _UserOperationController_addPaymasterData(metadata, snapId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, userOperation } = metadata;
        (0, logger_1.projectLogger)('Requesting paymaster from snap', { id, snapId });
        const provider = new providers_1.Web3Provider(__classPrivateFieldGet(this, _UserOperationController_provider, "f"));
        const ethereum = {
            request: ({ method, params }) => provider.send(method, params),
        };
        const response = yield (0, snaps_1.sendSnapPaymasterRequest)(snapId, {
            ethereum,
            userOperation,
            privateKey: yield __classPrivateFieldGet(this, _UserOperationController_getPrivateKey, "f").call(this),
        });
        userOperation.paymasterAndData = response.paymasterAndData;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_approveUserOperation = function _UserOperationController_approveUserOperation(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { resultCallbacks } = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_requestApproval).call(this, metadata);
        const transaction = __classPrivateFieldGet(this, _UserOperationController_getTransactions, "f").call(this).find((tx) => tx.id === metadata.id);
        const { userOperation } = metadata;
        if ((transaction === null || transaction === void 0 ? void 0 : transaction.txParams.maxFeePerGas) &&
            (transaction === null || transaction === void 0 ? void 0 : transaction.txParams.maxPriorityFeePerGas)) {
            userOperation.maxFeePerGas = transaction.txParams.maxFeePerGas;
            userOperation.maxPriorityFeePerGas =
                transaction.txParams.maxPriorityFeePerGas;
            (0, logger_1.projectLogger)('Updated gas fees after approval', {
                maxFeePerGas: userOperation.maxFeePerGas,
                maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
            });
        }
        metadata.status = types_1.UserOperationStatus.Approved;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
        return resultCallbacks;
    });
}, _UserOperationController_signUserOperation = function _UserOperationController_signUserOperation(metadata, snapId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, chainId, userOperation } = metadata;
        (0, logger_1.projectLogger)('Signing user operation', id, userOperation);
        const { signature } = yield (0, snaps_1.sendSnapUserOperationSignatureRequest)(snapId, {
            userOperation,
            chainId,
            privateKey: yield __classPrivateFieldGet(this, _UserOperationController_getPrivateKey, "f").call(this),
        });
        userOperation.signature = signature;
        (0, logger_1.projectLogger)('Signed user operation', signature);
        metadata.status = types_1.UserOperationStatus.Signed;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_submitUserOperation = function _UserOperationController_submitUserOperation(metadata, bundler) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userOperation } = metadata;
        const hash = yield bundler.sendUserOperation(userOperation, constants_2.ENTRYPOINT);
        metadata.hash = hash;
        metadata.status = types_1.UserOperationStatus.Submitted;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_failUserOperation = function _UserOperationController_failUserOperation(metadata, error) {
    const { id } = metadata;
    const rawError = error;
    (0, logger_1.projectLogger)('User operation failed', id, error);
    metadata.error = {
        name: rawError.name,
        message: rawError.message,
        stack: rawError.stack,
        code: rawError.code,
        rpc: rawError.rpc,
    };
    metadata.status = types_1.UserOperationStatus.Failed;
    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
}, _UserOperationController_createEmptyUserOperation = function _UserOperationController_createEmptyUserOperation() {
    return {
        callData: '0x',
        callGasLimit: '0x',
        initCode: '0x',
        maxFeePerGas: '0x',
        maxPriorityFeePerGas: '0x',
        nonce: '0x',
        paymasterAndData: '0x',
        preVerificationGas: '0x',
        sender: constants_1.AddressZero,
        signature: '0x',
        verificationGasLimit: '0x',
    };
}, _UserOperationController_updateMetadata = function _UserOperationController_updateMetadata(metadata) {
    const { id } = metadata;
    this.update((state) => {
        state.userOperations[id] = (0, lodash_1.cloneDeep)(metadata);
    });
    this.hub.emit('user-operations-updated', __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_getState).call(this));
    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateTransaction).call(this, metadata);
}, _UserOperationController_updateTransaction = function _UserOperationController_updateTransaction(metadata) {
    if (!metadata.transactionParams) {
        return;
    }
    const transactionMetadata = (0, transaction_1.getTransactionMetadata)(metadata);
    this.hub.emit('transaction-updated', transactionMetadata);
}, _UserOperationController_getState = function _UserOperationController_getState() {
    return (0, lodash_1.cloneDeep)(this.state);
}, _UserOperationController_requestApproval = function _UserOperationController_requestApproval(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id } = metadata;
        const type = controller_utils_1.ApprovalType.Transaction;
        const requestData = { txId: id };
        return (yield this.messagingSystem.call('ApprovalController:addRequest', {
            id,
            origin: controller_utils_1.ORIGIN_METAMASK,
            type,
            requestData,
            expectsResult: true,
        }, true));
    });
};
//# sourceMappingURL=UserOperationController.js.map