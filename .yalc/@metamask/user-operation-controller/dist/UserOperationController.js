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
var _UserOperationController_instances, _UserOperationController_entrypoint, _UserOperationController_getGasFeeEstimates, _UserOperationController_pendingUserOperationTracker, _UserOperationController_addUserOperation, _UserOperationController_prepareAndSubmitUserOperation, _UserOperationController_waitForConfirmation, _UserOperationController_createMetadata, _UserOperationController_prepareUserOperation, _UserOperationController_addPaymasterData, _UserOperationController_approveUserOperation, _UserOperationController_signUserOperation, _UserOperationController_submitUserOperation, _UserOperationController_failUserOperation, _UserOperationController_createEmptyUserOperation, _UserOperationController_updateMetadata, _UserOperationController_deleteMetadata, _UserOperationController_updateTransaction, _UserOperationController_addPendingUserOperationTrackerListeners, _UserOperationController_requestApproval, _UserOperationController_getTransactionType, _UserOperationController_getProvider, _UserOperationController_updateUserOperationAfterApproval, _UserOperationController_regenerateUserOperation;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOperationController = void 0;
const base_controller_1 = require("@metamask/base-controller");
const controller_utils_1 = require("@metamask/controller-utils");
const eth_query_1 = __importDefault(require("@metamask/eth-query"));
const rpc_errors_1 = require("@metamask/rpc-errors");
const transaction_controller_1 = require("@metamask/transaction-controller");
const ethereumjs_util_1 = require("ethereumjs-util");
const events_1 = __importDefault(require("events"));
const lodash_1 = require("lodash");
const uuid_1 = require("uuid");
const constants_1 = require("./constants");
const Bundler_1 = require("./helpers/Bundler");
const PendingUserOperationTracker_1 = require("./helpers/PendingUserOperationTracker");
const SnapSmartContractAccount_1 = require("./helpers/SnapSmartContractAccount");
const logger_1 = require("./logger");
const types_1 = require("./types");
const gas_1 = require("./utils/gas");
const gas_fees_1 = require("./utils/gas-fees");
const transaction_1 = require("./utils/transaction");
const validation_1 = require("./utils/validation");
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
class UserOperationController extends base_controller_1.BaseController {
    /**
     * Construct a UserOperationController instance.
     *
     * @param options - Controller options.
     * @param options.entrypoint - Address of the entrypoint contract.
     * @param options.getGasFeeEstimates - Callback to get gas fee estimates.
     * @param options.messenger - Restricted controller messenger for the user operation controller.
     * @param options.state - Initial state to set on the controller.
     */
    constructor({ entrypoint, getGasFeeEstimates, messenger, state, }) {
        super({
            name: controllerName,
            metadata: stateMetadata,
            messenger,
            state: Object.assign(Object.assign({}, getDefaultState()), state),
        });
        _UserOperationController_instances.add(this);
        _UserOperationController_entrypoint.set(this, void 0);
        _UserOperationController_getGasFeeEstimates.set(this, void 0);
        _UserOperationController_pendingUserOperationTracker.set(this, void 0);
        this.hub = new events_1.default();
        __classPrivateFieldSet(this, _UserOperationController_entrypoint, entrypoint, "f");
        __classPrivateFieldSet(this, _UserOperationController_getGasFeeEstimates, getGasFeeEstimates, "f");
        __classPrivateFieldSet(this, _UserOperationController_pendingUserOperationTracker, new PendingUserOperationTracker_1.PendingUserOperationTracker({
            getUserOperations: () => (0, lodash_1.cloneDeep)(Object.values(this.state.userOperations)),
            messenger,
        }), "f");
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addPendingUserOperationTrackerListeners).call(this);
    }
    /**
     * Create and submit a user operation.
     *
     * @param request - Information required to create a user operation.
     * @param request.data - Data to include in the resulting transaction.
     * @param request.maxFeePerGas - Maximum fee per gas to pay towards the transaction.
     * @param request.maxPriorityFeePerGas - Maximum priority fee per gas to pay towards the transaction.
     * @param request.to - Destination address of the resulting transaction.
     * @param request.value - Value to include in the resulting transaction.
     * @param options - Configuration options when creating a user operation.
     * @param options.networkClientId - ID of the network client used to query the chain.
     * @param options.origin - Origin of the user operation, such as the hostname of a dApp.
     * @param options.requireApproval - Whether to require user approval before submitting the user operation. Defaults to true.
     * @param options.smartContractAccount - Smart contract abstraction to provide the contract specific values such as call data and nonce. Defaults to the current snap account.
     * @param options.swaps - Swap metadata to record with the user operation.
     * @param options.type - Type of the transaction.
     */
    addUserOperation(request, options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, validation_1.validateAddUserOperationRequest)(request);
            (0, validation_1.validateAddUserOperationOptions)(options);
            return yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addUserOperation).call(this, request, options);
        });
    }
    /**
     * Create and submit a user operation equivalent to the provided transaction.
     *
     * @param transaction - Transaction to use as the basis for the user operation.
     * @param options - Configuration options when creating a user operation.
     * @param options.networkClientId - ID of the network client used to query the chain.
     * @param options.origin - Origin of the user operation, such as the hostname of a dApp.
     * @param options.requireApproval - Whether to require user approval before submitting the user operation. Defaults to true.
     * @param options.smartContractAccount - Smart contract abstraction to provide the contract specific values such as call data and nonce. Defaults to the current snap account.
     * @param options.swaps - Swap metadata to record with the user operation.
     * @param options.type - Type of the transaction.
     */
    addUserOperationFromTransaction(transaction, options) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, validation_1.validateAddUserOperationOptions)(options);
            const { data, from, maxFeePerGas, maxPriorityFeePerGas, to, value } = transaction;
            const request = {
                data: data === '' ? undefined : data,
                from,
                maxFeePerGas,
                maxPriorityFeePerGas,
                to,
                value,
            };
            (0, validation_1.validateAddUserOperationRequest)(request);
            return yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addUserOperation).call(this, request, Object.assign(Object.assign({}, options), { transaction }));
        });
    }
    startPollingByNetworkClientId(networkClientId) {
        return __classPrivateFieldGet(this, _UserOperationController_pendingUserOperationTracker, "f").startPollingByNetworkClientId(networkClientId);
    }
}
exports.UserOperationController = UserOperationController;
_UserOperationController_entrypoint = new WeakMap(), _UserOperationController_getGasFeeEstimates = new WeakMap(), _UserOperationController_pendingUserOperationTracker = new WeakMap(), _UserOperationController_instances = new WeakSet(), _UserOperationController_addUserOperation = function _UserOperationController_addUserOperation(request, options) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, logger_1.projectLogger)('Adding user operation', { request, options });
        const { networkClientId, origin, smartContractAccount: requestSmartContractAccount, swaps, transaction, } = options;
        const { chainId, provider } = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_getProvider).call(this, networkClientId);
        const metadata = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_createMetadata).call(this, chainId, origin, transaction, swaps);
        const smartContractAccount = requestSmartContractAccount !== null && requestSmartContractAccount !== void 0 ? requestSmartContractAccount : new SnapSmartContractAccount_1.SnapSmartContractAccount(this.messagingSystem);
        const cache = {
            chainId,
            metadata,
            options: Object.assign(Object.assign({}, options), { smartContractAccount }),
            provider,
            request,
            transaction,
        };
        const { id } = metadata;
        let throwError = false;
        const hashValue = (() => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_prepareAndSubmitUserOperation).call(this, cache);
            }
            catch (error) {
                __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_failUserOperation).call(this, metadata, error);
                if (throwError) {
                    throw error;
                }
                return undefined;
            }
        }))();
        const hash = () => __awaiter(this, void 0, void 0, function* () {
            throwError = true;
            return yield hashValue;
        });
        const transactionHash = () => __awaiter(this, void 0, void 0, function* () {
            yield hash();
            const { transactionHash: finalTransactionHash } = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_waitForConfirmation).call(this, metadata);
            return finalTransactionHash;
        });
        return {
            id,
            hash,
            transactionHash,
        };
    });
}, _UserOperationController_prepareAndSubmitUserOperation = function _UserOperationController_prepareAndSubmitUserOperation(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadata, options } = cache;
        const { requireApproval, smartContractAccount } = options;
        let resultCallbacks;
        try {
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_prepareUserOperation).call(this, cache);
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addPaymasterData).call(this, metadata, smartContractAccount);
            this.hub.emit('user-operation-added', metadata);
            if (requireApproval !== false) {
                resultCallbacks = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_approveUserOperation).call(this, cache);
            }
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_signUserOperation).call(this, metadata, smartContractAccount);
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_submitUserOperation).call(this, metadata);
            resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.success();
            return metadata.hash;
        }
        catch (error) {
            /* istanbul ignore next */
            resultCallbacks === null || resultCallbacks === void 0 ? void 0 : resultCallbacks.error(error);
            throw error;
        }
    });
}, _UserOperationController_waitForConfirmation = function _UserOperationController_waitForConfirmation(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, hash } = metadata;
        (0, logger_1.projectLogger)('Waiting for confirmation', id, hash);
        return new Promise((resolve, reject) => {
            this.hub.once(`${id}:confirmed`, (finalMetadata) => {
                resolve(finalMetadata);
            });
            this.hub.once(`${id}:failed`, (_finalMetadata, error) => {
                reject(error);
            });
        });
    });
}, _UserOperationController_createMetadata = function _UserOperationController_createMetadata(chainId, origin, transaction, swaps) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
        const metadata = {
            actualGasCost: null,
            actualGasUsed: null,
            baseFeePerGas: null,
            bundlerUrl: null,
            chainId,
            error: null,
            hash: null,
            id: (0, uuid_1.v1)(),
            origin,
            status: types_1.UserOperationStatus.Unapproved,
            swapsMetadata: swaps
                ? {
                    approvalTxId: (_a = swaps.approvalTxId) !== null && _a !== void 0 ? _a : null,
                    destinationTokenAddress: (_b = swaps.destinationTokenAddress) !== null && _b !== void 0 ? _b : null,
                    destinationTokenDecimals: (_c = swaps.destinationTokenDecimals) !== null && _c !== void 0 ? _c : null,
                    destinationTokenSymbol: (_d = swaps.destinationTokenSymbol) !== null && _d !== void 0 ? _d : null,
                    estimatedBaseFee: (_e = swaps.estimatedBaseFee) !== null && _e !== void 0 ? _e : null,
                    sourceTokenSymbol: (_f = swaps.sourceTokenSymbol) !== null && _f !== void 0 ? _f : null,
                    swapMetaData: (_g = swaps.swapMetaData) !== null && _g !== void 0 ? _g : null,
                    swapTokenValue: (_h = swaps.swapTokenValue) !== null && _h !== void 0 ? _h : null,
                }
                : null,
            time: Date.now(),
            transactionHash: null,
            transactionParams: (_j = transaction) !== null && _j !== void 0 ? _j : null,
            transactionType: null,
            userFeeLevel: null,
            userOperation: __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_createEmptyUserOperation).call(this, transaction),
        };
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
        (0, logger_1.projectLogger)('Added user operation', metadata.id);
        return metadata;
    });
}, _UserOperationController_prepareUserOperation = function _UserOperationController_prepareUserOperation(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        const { chainId, metadata, options, provider, request, transaction } = cache;
        const { data, from, to, value } = request;
        const { id, transactionParams, userOperation } = metadata;
        const { smartContractAccount } = options;
        (0, logger_1.projectLogger)('Preparing user operation', { id });
        const transactionType = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_getTransactionType).call(this, transaction, provider, options);
        metadata.transactionType = transactionType !== null && transactionType !== void 0 ? transactionType : null;
        (0, logger_1.projectLogger)('Determined transaction type', transactionType);
        yield (0, gas_fees_1.updateGasFees)({
            getGasFeeEstimates: __classPrivateFieldGet(this, _UserOperationController_getGasFeeEstimates, "f"),
            metadata,
            originalRequest: request,
            provider,
            transaction: transactionParams !== null && transactionParams !== void 0 ? transactionParams : undefined,
        });
        const response = yield smartContractAccount.prepareUserOperation({
            chainId,
            data,
            from,
            to,
            value,
        });
        (0, validation_1.validatePrepareUserOperationResponse)(response);
        const { bundler: bundlerUrl, callData, dummyPaymasterAndData, dummySignature, initCode, nonce, sender, } = response;
        userOperation.callData = callData;
        userOperation.initCode = initCode !== null && initCode !== void 0 ? initCode : constants_1.EMPTY_BYTES;
        userOperation.nonce = nonce;
        userOperation.paymasterAndData = dummyPaymasterAndData !== null && dummyPaymasterAndData !== void 0 ? dummyPaymasterAndData : constants_1.EMPTY_BYTES;
        userOperation.sender = sender;
        userOperation.signature = dummySignature !== null && dummySignature !== void 0 ? dummySignature : constants_1.EMPTY_BYTES;
        metadata.bundlerUrl = bundlerUrl;
        yield (0, gas_1.updateGas)(metadata, response, __classPrivateFieldGet(this, _UserOperationController_entrypoint, "f"));
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_addPaymasterData = function _UserOperationController_addPaymasterData(metadata, smartContractAccount) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { id, userOperation } = metadata;
        (0, logger_1.projectLogger)('Requesting paymaster data', { id });
        const response = yield smartContractAccount.updateUserOperation({
            userOperation,
        });
        (0, validation_1.validateUpdateUserOperationResponse)(response);
        userOperation.paymasterAndData = (_a = response.paymasterAndData) !== null && _a !== void 0 ? _a : constants_1.EMPTY_BYTES;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_approveUserOperation = function _UserOperationController_approveUserOperation(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, logger_1.projectLogger)('Requesting approval');
        const { metadata } = cache;
        const { resultCallbacks, value } = yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_requestApproval).call(this, metadata);
        const updatedTransaction = value === null || value === void 0 ? void 0 : value.txMeta;
        if (updatedTransaction) {
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateUserOperationAfterApproval).call(this, cache, updatedTransaction);
        }
        metadata.status = types_1.UserOperationStatus.Approved;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
        return resultCallbacks;
    });
}, _UserOperationController_signUserOperation = function _UserOperationController_signUserOperation(metadata, smartContractAccount) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, chainId, userOperation } = metadata;
        (0, logger_1.projectLogger)('Signing user operation', id, userOperation);
        const response = yield smartContractAccount.signUserOperation({
            userOperation,
            chainId,
        });
        (0, validation_1.validateSignUserOperationResponse)(response);
        const { signature } = response;
        userOperation.signature = signature;
        (0, logger_1.projectLogger)('Signed user operation', signature);
        metadata.status = types_1.UserOperationStatus.Signed;
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_submitUserOperation = function _UserOperationController_submitUserOperation(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { userOperation } = metadata;
        (0, logger_1.projectLogger)('Submitting user operation', userOperation);
        const bundler = new Bundler_1.Bundler(metadata.bundlerUrl);
        const hash = yield bundler.sendUserOperation(userOperation, __classPrivateFieldGet(this, _UserOperationController_entrypoint, "f"));
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
        rpc: rawError.value,
    };
    metadata.status = types_1.UserOperationStatus.Failed;
    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    if (String(rawError.code) === String(rpc_errors_1.errorCodes.provider.userRejectedRequest)) {
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_deleteMetadata).call(this, id);
    }
}, _UserOperationController_createEmptyUserOperation = function _UserOperationController_createEmptyUserOperation(transaction) {
    var _a, _b;
    return {
        callData: constants_1.EMPTY_BYTES,
        callGasLimit: constants_1.EMPTY_BYTES,
        initCode: constants_1.EMPTY_BYTES,
        maxFeePerGas: (_a = transaction === null || transaction === void 0 ? void 0 : transaction.maxFeePerGas) !== null && _a !== void 0 ? _a : constants_1.EMPTY_BYTES,
        maxPriorityFeePerGas: (_b = transaction === null || transaction === void 0 ? void 0 : transaction.maxPriorityFeePerGas) !== null && _b !== void 0 ? _b : constants_1.EMPTY_BYTES,
        nonce: constants_1.EMPTY_BYTES,
        paymasterAndData: constants_1.EMPTY_BYTES,
        preVerificationGas: constants_1.EMPTY_BYTES,
        sender: constants_1.ADDRESS_ZERO,
        signature: constants_1.EMPTY_BYTES,
        verificationGasLimit: constants_1.EMPTY_BYTES,
    };
}, _UserOperationController_updateMetadata = function _UserOperationController_updateMetadata(metadata) {
    const { id } = metadata;
    this.update((state) => {
        state.userOperations[id] = (0, lodash_1.cloneDeep)(metadata);
    });
    __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateTransaction).call(this, metadata);
}, _UserOperationController_deleteMetadata = function _UserOperationController_deleteMetadata(id) {
    this.update((state) => {
        delete state.userOperations[id];
    });
}, _UserOperationController_updateTransaction = function _UserOperationController_updateTransaction(metadata) {
    if (!metadata.transactionParams) {
        return;
    }
    const transactionMetadata = (0, transaction_1.getTransactionMetadata)(metadata);
    this.hub.emit('transaction-updated', transactionMetadata);
}, _UserOperationController_addPendingUserOperationTrackerListeners = function _UserOperationController_addPendingUserOperationTrackerListeners() {
    __classPrivateFieldGet(this, _UserOperationController_pendingUserOperationTracker, "f").hub.on('user-operation-confirmed', (metadata) => {
        (0, logger_1.projectLogger)('In listener...');
        this.hub.emit('user-operation-confirmed', metadata);
        this.hub.emit(`${metadata.id}:confirmed`, metadata);
    });
    __classPrivateFieldGet(this, _UserOperationController_pendingUserOperationTracker, "f").hub.on('user-operation-failed', (metadata, error) => {
        this.hub.emit('user-operation-failed', metadata, error);
        this.hub.emit(`${metadata.id}:failed`, metadata, error);
    });
    __classPrivateFieldGet(this, _UserOperationController_pendingUserOperationTracker, "f").hub.on('user-operation-updated', (metadata) => {
        __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_updateMetadata).call(this, metadata);
    });
}, _UserOperationController_requestApproval = function _UserOperationController_requestApproval(metadata) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, origin } = metadata;
        const type = controller_utils_1.ApprovalType.Transaction;
        const requestData = { txId: id };
        return (yield this.messagingSystem.call('ApprovalController:addRequest', {
            id,
            origin,
            type,
            requestData,
            expectsResult: true,
        }, true));
    });
}, _UserOperationController_getTransactionType = function _UserOperationController_getTransactionType(transaction, provider, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!transaction) {
            return undefined;
        }
        if (options.type) {
            return options.type;
        }
        const ethQuery = new eth_query_1.default(provider);
        const result = (0, transaction_controller_1.determineTransactionType)(transaction, ethQuery);
        return (yield result).type;
    });
}, _UserOperationController_getProvider = function _UserOperationController_getProvider(networkClientId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { provider, configuration } = this.messagingSystem.call('NetworkController:getNetworkClientById', networkClientId);
        const { chainId } = configuration;
        return { provider, chainId };
    });
}, _UserOperationController_updateUserOperationAfterApproval = function _UserOperationController_updateUserOperationAfterApproval(cache, updatedTransaction) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        (0, logger_1.projectLogger)('Found updated transaction in approval', { updatedTransaction });
        const { metadata, request } = cache;
        const { userOperation } = metadata;
        const usingPaymaster = userOperation.paymasterAndData !== constants_1.EMPTY_BYTES;
        const updatedMaxFeePerGas = (0, ethereumjs_util_1.addHexPrefix)(updatedTransaction.txParams.maxFeePerGas);
        const updatedMaxPriorityFeePerGas = (0, ethereumjs_util_1.addHexPrefix)(updatedTransaction.txParams.maxPriorityFeePerGas);
        let regenerateUserOperation = false;
        const previousMaxFeePerGas = userOperation.maxFeePerGas;
        const previousMaxPriorityFeePerGas = userOperation.maxPriorityFeePerGas;
        if (previousMaxFeePerGas !== updatedMaxFeePerGas ||
            previousMaxPriorityFeePerGas !== updatedMaxPriorityFeePerGas) {
            (0, logger_1.projectLogger)('Gas fees updated during approval', {
                previousMaxFeePerGas,
                previousMaxPriorityFeePerGas,
                updatedMaxFeePerGas,
                updatedMaxPriorityFeePerGas,
            });
            userOperation.maxFeePerGas = updatedMaxFeePerGas;
            userOperation.maxPriorityFeePerGas = updatedMaxPriorityFeePerGas;
            regenerateUserOperation = usingPaymaster;
        }
        const previousData = (_a = request.data) !== null && _a !== void 0 ? _a : constants_1.EMPTY_BYTES;
        const updatedData = (_b = updatedTransaction.txParams.data) !== null && _b !== void 0 ? _b : constants_1.EMPTY_BYTES;
        if (previousData !== updatedData) {
            (0, logger_1.projectLogger)('Data updated during approval', { previousData, updatedData });
            regenerateUserOperation = true;
        }
        const previousValue = (_c = request.value) !== null && _c !== void 0 ? _c : constants_1.VALUE_ZERO;
        const updatedValue = (_d = updatedTransaction.txParams.value) !== null && _d !== void 0 ? _d : constants_1.VALUE_ZERO;
        if (previousValue !== updatedValue) {
            (0, logger_1.projectLogger)('Value updated during approval', { previousValue, updatedValue });
            regenerateUserOperation = true;
        }
        if (regenerateUserOperation) {
            const updatedRequest = Object.assign(Object.assign({}, request), { data: updatedData, maxFeePerGas: updatedMaxFeePerGas, maxPriorityFeePerGas: updatedMaxPriorityFeePerGas, value: updatedValue });
            yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_regenerateUserOperation).call(this, Object.assign(Object.assign({}, cache), { request: updatedRequest }));
        }
    });
}, _UserOperationController_regenerateUserOperation = function _UserOperationController_regenerateUserOperation(cache) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, logger_1.projectLogger)('Regenerating user operation as parameters were updated during approval');
        const { options: { smartContractAccount }, metadata, } = cache;
        yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_prepareUserOperation).call(this, cache);
        yield __classPrivateFieldGet(this, _UserOperationController_instances, "m", _UserOperationController_addPaymasterData).call(this, metadata, smartContractAccount);
        (0, logger_1.projectLogger)('Regenerated user operation', metadata.userOperation);
    });
};
//# sourceMappingURL=UserOperationController.js.map