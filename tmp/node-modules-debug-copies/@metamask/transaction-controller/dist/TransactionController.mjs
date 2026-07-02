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
var _TransactionController_instances, _TransactionController_afterAdd, _TransactionController_afterSign, _TransactionController_afterSimulate, _TransactionController_approvingTransactionIds, _TransactionController_beforeCheckPendingTransaction, _TransactionController_beforePublish, _TransactionController_beforeSign, _TransactionController_gasFeeFlows, _TransactionController_getAdditionalSignArguments, _TransactionController_getCurrentAccountEIP1559Compatibility, _TransactionController_getCurrentNetworkEIP1559Compatibility, _TransactionController_getExternalPendingTransactions, _TransactionController_getGasFeeEstimates, _TransactionController_getNetworkState, _TransactionController_getPermittedAccounts, _TransactionController_getSavedGasFees, _TransactionController_getSimulationConfig, _TransactionController_incomingTransactionHelper, _TransactionController_incomingTransactionOptions, _TransactionController_internalEvents, _TransactionController_isAutomaticGasFeeUpdateEnabled, _TransactionController_isEIP7702GasFeeTokensEnabled, _TransactionController_isFirstTimeInteractionEnabled, _TransactionController_isSimulationEnabled, _TransactionController_isSwapsDisabled, _TransactionController_isTimeoutEnabled, _TransactionController_layer1GasFeeFlows, _TransactionController_methodDataHelper, _TransactionController_multichainTrackingHelper, _TransactionController_pendingTransactionOptions, _TransactionController_publicKeyEIP7702, _TransactionController_publish, _TransactionController_publishBatchHook, _TransactionController_securityProviderRequest, _TransactionController_sign, _TransactionController_signAbortCallbacks, _TransactionController_skipSimulationTransactionIds, _TransactionController_testGasFeeFlows, _TransactionController_trace, _TransactionController_retryTransaction, _TransactionController_signExternalTransaction, _TransactionController_addMetadata, _TransactionController_updateGasProperties, _TransactionController_onBootCleanup, _TransactionController_failIncompleteTransactions, _TransactionController_processApproval, _TransactionController_approveTransaction, _TransactionController_publishTransaction, _TransactionController_rejectTransaction, _TransactionController_trimTransactionsForState, _TransactionController_isFinalState, _TransactionController_isLocalFinalState, _TransactionController_requestApproval, _TransactionController_getTransaction, _TransactionController_getTransactionOrThrow, _TransactionController_getApprovalId, _TransactionController_isTransactionCompleted, _TransactionController_onIncomingTransactions, _TransactionController_generateDappSuggestedGasFees, _TransactionController_addExternalTransaction, _TransactionController_markNonceDuplicatesDropped, _TransactionController_setTransactionStatusDropped, _TransactionController_waitForTransactionFinished, _TransactionController_updateTransactionMetaRSV, _TransactionController_getEIP1559Compatibility, _TransactionController_signTransaction, _TransactionController_onTransactionStatusChange, _TransactionController_getNonceTrackerTransactions, _TransactionController_onConfirmedTransaction, _TransactionController_updatePostBalance, _TransactionController_createNonceTracker, _TransactionController_createPendingTransactionTracker, _TransactionController_checkForPendingTransactionAndStartPolling, _TransactionController_stopAllTracking, _TransactionController_addIncomingTransactionHelperListeners, _TransactionController_removePendingTransactionTrackerListeners, _TransactionController_addPendingTransactionTrackerListeners, _TransactionController_getNonceTrackerPendingTransactions, _TransactionController_publishTransactionForRetry, _TransactionController_isTransactionAlreadyConfirmedError, _TransactionController_getGasFeeFlows, _TransactionController_getLayer1GasFeeFlows, _TransactionController_updateTransactionInternal, _TransactionController_updateSimulationData, _TransactionController_onGasFeePollerTransactionUpdate, _TransactionController_onGasFeePollerTransactionBatchUpdate, _TransactionController_updateTransactionBatch, _TransactionController_getSelectedAccount, _TransactionController_getInternalAccounts, _TransactionController_updateSubmitHistory, _TransactionController_updateGasEstimate, _TransactionController_registerActionHandlers, _TransactionController_deleteTransaction, _TransactionController_isRejectError, _TransactionController_rejectTransactionAndThrow, _TransactionController_hasUserRejectedMessage, _TransactionController_failTransaction, _TransactionController_runAfterSimulateHook, _TransactionController_defaultPublishHook, _TransactionController_getGasFeeTokens;
import { BaseController } from "@metamask/base-controller";
import { ApprovalType, ORIGIN_METAMASK, convertHexToDecimal } from "@metamask/controller-utils";
import { NetworkClientType } from "@metamask/network-controller";
import { NonceTracker } from "@metamask/nonce-tracker";
import { errorCodes, rpcErrors, providerErrors, JsonRpcError } from "@metamask/rpc-errors";
import { add0x } from "@metamask/utils";
// This package purposefully relies on Node's EventEmitter module.
// eslint-disable-next-line import-x/no-nodejs-modules
import { EventEmitter } from "events";
import $lodash from "lodash";
const { cloneDeep, mapValues, merge, noop, pickBy, sortBy } = $lodash;
import { v1 as random } from "uuid";
import { DefaultGasFeeFlow } from "./gas-flows/DefaultGasFeeFlow.mjs";
import { LineaGasFeeFlow } from "./gas-flows/LineaGasFeeFlow.mjs";
import { OptimismLayer1GasFeeFlow } from "./gas-flows/OptimismLayer1GasFeeFlow.mjs";
import { RandomisedEstimationsGasFeeFlow } from "./gas-flows/RandomisedEstimationsGasFeeFlow.mjs";
import { ScrollLayer1GasFeeFlow } from "./gas-flows/ScrollLayer1GasFeeFlow.mjs";
import { TestGasFeeFlow } from "./gas-flows/TestGasFeeFlow.mjs";
import { AccountsApiRemoteTransactionSource } from "./helpers/AccountsApiRemoteTransactionSource.mjs";
import { GasFeePoller, updateTransactionGasProperties, updateTransactionGasEstimates } from "./helpers/GasFeePoller.mjs";
import { IncomingTransactionHelper } from "./helpers/IncomingTransactionHelper.mjs";
import { MethodDataHelper } from "./helpers/MethodDataHelper.mjs";
import { MultichainTrackingHelper } from "./helpers/MultichainTrackingHelper.mjs";
import { PendingTransactionTracker } from "./helpers/PendingTransactionTracker.mjs";
import { ResimulateHelper, hasSimulationDataChanged, shouldResimulate } from "./helpers/ResimulateHelper.mjs";
import { ExtraTransactionsPublishHook } from "./hooks/ExtraTransactionsPublishHook.mjs";
import { projectLogger as log } from "./logger.mjs";
import { GasFeeEstimateLevel, TransactionEnvelopeType, TransactionType, TransactionStatus, SimulationErrorCode } from "./types.mjs";
import { getBalanceChanges } from "./utils/balance-changes.mjs";
import { addTransactionBatch, isAtomicBatchSupported } from "./utils/batch.mjs";
import { generateEIP7702BatchTransaction, getDelegationAddress, signAuthorizationList } from "./utils/eip7702.mjs";
import { validateConfirmedExternalTransaction } from "./utils/external-transactions.mjs";
import { getSubmitHistoryLimit, getTransactionHistoryLimit } from "./utils/feature-flags.mjs";
import { updateFirstTimeInteraction } from "./utils/first-time-interaction.mjs";
import { addGasBuffer, estimateGas, estimateGasBatch, updateGas } from "./utils/gas.mjs";
import { checkGasFeeTokenBeforePublish, getGasFeeTokens } from "./utils/gas-fee-tokens.mjs";
import { updateGasFees } from "./utils/gas-fees.mjs";
import { getGasFeeFlow } from "./utils/gas-flow.mjs";
import { getTransactionLayer1GasFee, updateTransactionLayer1GasFee } from "./utils/layer1-gas-fee-flow.mjs";
import { getAndFormatTransactionsForNonceTracker, getNextNonce } from "./utils/nonce.mjs";
import { prepareTransaction, serializeTransaction } from "./utils/prepare.mjs";
import { getChainId, getNetworkClientId, rpcRequest } from "./utils/provider.mjs";
import { getTransactionParamsWithIncreasedGasFee } from "./utils/retry.mjs";
import { updatePostTransactionBalance, updateSwapsTransaction } from "./utils/swaps.mjs";
import { determineTransactionType } from "./utils/transaction-type.mjs";
import { normalizeTransactionParams, isEIP1559Transaction, validateGasValues, validateIfTransactionUnapproved, validateIfTransactionUnapprovedOrSubmitted, normalizeTxError, normalizeGasFeeValues, setEnvelopeType } from "./utils/utils.mjs";
import { ErrorCode, validateTransactionOrigin, validateTxParams } from "./utils/validation.mjs";
/**
 * Metadata for the TransactionController state, describing how to "anonymize"
 * the state and which parts should be persisted.
 */
const metadata = {
    transactions: {
        includeInStateLogs: true,
        persist: true,
        includeInDebugSnapshot: false,
        usedInUi: true,
    },
    transactionBatches: {
        includeInStateLogs: true,
        persist: true,
        includeInDebugSnapshot: false,
        usedInUi: true,
    },
    methodData: {
        includeInStateLogs: true,
        persist: true,
        includeInDebugSnapshot: false,
        usedInUi: true,
    },
    lastFetchedBlockNumbers: {
        includeInStateLogs: true,
        persist: true,
        includeInDebugSnapshot: false,
        usedInUi: false,
    },
    submitHistory: {
        includeInStateLogs: true,
        persist: true,
        includeInDebugSnapshot: false,
        usedInUi: false,
    },
};
/**
 * Multiplier used to determine a transaction's increased gas fee during cancellation
 */
export const CANCEL_RATE = 1.1;
/**
 * Multiplier used to determine a transaction's increased gas fee during speed up
 */
export const SPEED_UP_RATE = 1.1;
/**
 * The name of the {@link TransactionController}.
 */
const controllerName = 'TransactionController';
/**
 * Possible states of the approve transaction step.
 */
export var ApprovalState;
(function (ApprovalState) {
    ApprovalState["Approved"] = "approved";
    ApprovalState["NotApproved"] = "not-approved";
    ApprovalState["SkippedViaBeforePublishHook"] = "skipped-via-before-publish-hook";
})(ApprovalState || (ApprovalState = {}));
/**
 * Get the default TransactionsController state.
 *
 * @returns The default TransactionsController state.
 */
function getDefaultTransactionControllerState() {
    return {
        methodData: {},
        transactions: [],
        transactionBatches: [],
        lastFetchedBlockNumbers: {},
        submitHistory: [],
    };
}
// === MESSENGER ===
const MESSENGER_EXPOSED_METHODS = [
    'abortTransactionSigning',
    'addTransaction',
    'addTransactionBatch',
    'approveTransactionsWithSameNonce',
    'clearUnapprovedTransactions',
    'confirmExternalTransaction',
    'emulateNewTransaction',
    'emulateTransactionUpdate',
    'estimateGas',
    'estimateGasBatch',
    'estimateGasBuffered',
    'estimateGasFee',
    'getGasFeeTokens',
    'getLayer1GasFee',
    'getNonceLock',
    'getTransactions',
    'handleMethodData',
    'isAtomicBatchSupported',
    'setTransactionActive',
    'speedUpTransaction',
    'startIncomingTransactionPolling',
    'stopIncomingTransactionPolling',
    'stopTransaction',
    'updateAtomicBatchData',
    'updateCustodialTransaction',
    'updateEditableParams',
    'updateIncomingTransactions',
    'updateTransaction',
];
/**
 * Controller responsible for submitting and managing transactions.
 */
export class TransactionController extends BaseController {
    /**
     * Constructs a TransactionController.
     *
     * @param options - The controller options.
     */
    constructor(options) {
        const { disableSwaps, getCurrentAccountEIP1559Compatibility, getCurrentNetworkEIP1559Compatibility, getExternalPendingTransactions, getGasFeeEstimates, getNetworkClientRegistry, getNetworkState, getPermittedAccounts, getSavedGasFees, getSimulationConfig, hooks, incomingTransactions = {}, isAutomaticGasFeeUpdateEnabled, isEIP7702GasFeeTokensEnabled, isFirstTimeInteractionEnabled, isSimulationEnabled, messenger, pendingTransactions = {}, publicKeyEIP7702, securityProviderRequest, sign, state, testGasFeeFlows, trace, } = options;
        super({
            name: controllerName,
            metadata,
            messenger,
            state: {
                ...getDefaultTransactionControllerState(),
                ...state,
            },
        });
        _TransactionController_instances.add(this);
        _TransactionController_afterAdd.set(this, void 0);
        _TransactionController_afterSign.set(this, void 0);
        _TransactionController_afterSimulate.set(this, void 0);
        _TransactionController_approvingTransactionIds.set(this, new Set());
        _TransactionController_beforeCheckPendingTransaction.set(this, void 0);
        _TransactionController_beforePublish.set(this, void 0);
        _TransactionController_beforeSign.set(this, void 0);
        _TransactionController_gasFeeFlows.set(this, void 0);
        _TransactionController_getAdditionalSignArguments.set(this, void 0);
        _TransactionController_getCurrentAccountEIP1559Compatibility.set(this, void 0);
        _TransactionController_getCurrentNetworkEIP1559Compatibility.set(this, void 0);
        _TransactionController_getExternalPendingTransactions.set(this, void 0);
        _TransactionController_getGasFeeEstimates.set(this, void 0);
        _TransactionController_getNetworkState.set(this, void 0);
        _TransactionController_getPermittedAccounts.set(this, void 0);
        _TransactionController_getSavedGasFees.set(this, void 0);
        _TransactionController_getSimulationConfig.set(this, void 0);
        _TransactionController_incomingTransactionHelper.set(this, void 0);
        _TransactionController_incomingTransactionOptions.set(this, void 0);
        _TransactionController_internalEvents.set(this, new EventEmitter());
        _TransactionController_isAutomaticGasFeeUpdateEnabled.set(this, void 0);
        _TransactionController_isEIP7702GasFeeTokensEnabled.set(this, void 0);
        _TransactionController_isFirstTimeInteractionEnabled.set(this, void 0);
        _TransactionController_isSimulationEnabled.set(this, void 0);
        _TransactionController_isSwapsDisabled.set(this, void 0);
        _TransactionController_isTimeoutEnabled.set(this, void 0);
        _TransactionController_layer1GasFeeFlows.set(this, void 0);
        _TransactionController_methodDataHelper.set(this, void 0);
        _TransactionController_multichainTrackingHelper.set(this, void 0);
        _TransactionController_pendingTransactionOptions.set(this, void 0);
        _TransactionController_publicKeyEIP7702.set(this, void 0);
        _TransactionController_publish.set(this, void 0);
        _TransactionController_publishBatchHook.set(this, void 0);
        _TransactionController_securityProviderRequest.set(this, void 0);
        _TransactionController_sign.set(this, void 0);
        _TransactionController_signAbortCallbacks.set(this, new Map());
        _TransactionController_skipSimulationTransactionIds.set(this, new Set());
        _TransactionController_testGasFeeFlows.set(this, void 0);
        _TransactionController_trace.set(this, void 0);
        _TransactionController_checkForPendingTransactionAndStartPolling.set(this, () => {
            __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").checkForPendingTransactionAndStartPolling();
        });
        this.messenger = messenger;
        __classPrivateFieldSet(this, _TransactionController_afterAdd, hooks?.afterAdd ?? (() => Promise.resolve({})), "f");
        __classPrivateFieldSet(this, _TransactionController_afterSign, hooks?.afterSign ?? (() => true), "f");
        __classPrivateFieldSet(this, _TransactionController_afterSimulate, hooks?.afterSimulate ??
            (() => Promise.resolve({})), "f");
        __classPrivateFieldSet(this, _TransactionController_beforeCheckPendingTransaction, 
        /* istanbul ignore next */
        hooks?.beforeCheckPendingTransaction ??
            (() => Promise.resolve(true)), "f");
        __classPrivateFieldSet(this, _TransactionController_beforePublish, hooks?.beforePublish ?? (() => Promise.resolve(true)), "f");
        __classPrivateFieldSet(this, _TransactionController_beforeSign, hooks?.beforeSign ??
            (() => Promise.resolve({})), "f");
        __classPrivateFieldSet(this, _TransactionController_getAdditionalSignArguments, hooks?.getAdditionalSignArguments ??
            (() => []), "f");
        __classPrivateFieldSet(this, _TransactionController_getCurrentAccountEIP1559Compatibility, getCurrentAccountEIP1559Compatibility ??
            (() => Promise.resolve(true)), "f");
        __classPrivateFieldSet(this, _TransactionController_getCurrentNetworkEIP1559Compatibility, getCurrentNetworkEIP1559Compatibility, "f");
        __classPrivateFieldSet(this, _TransactionController_getExternalPendingTransactions, getExternalPendingTransactions ?? (() => []), "f");
        __classPrivateFieldSet(this, _TransactionController_getGasFeeEstimates, getGasFeeEstimates ??
            (() => Promise.resolve({})), "f");
        __classPrivateFieldSet(this, _TransactionController_getNetworkState, getNetworkState, "f");
        __classPrivateFieldSet(this, _TransactionController_getPermittedAccounts, getPermittedAccounts, "f");
        __classPrivateFieldSet(this, _TransactionController_getSavedGasFees, getSavedGasFees ?? ((_chainId) => undefined), "f");
        __classPrivateFieldSet(this, _TransactionController_getSimulationConfig, getSimulationConfig ??
            (() => Promise.resolve({})), "f");
        __classPrivateFieldSet(this, _TransactionController_incomingTransactionOptions, incomingTransactions, "f");
        __classPrivateFieldSet(this, _TransactionController_isAutomaticGasFeeUpdateEnabled, isAutomaticGasFeeUpdateEnabled ??
            ((_txMeta) => false), "f");
        __classPrivateFieldSet(this, _TransactionController_isEIP7702GasFeeTokensEnabled, isEIP7702GasFeeTokensEnabled ??
            (() => Promise.resolve(false)), "f");
        __classPrivateFieldSet(this, _TransactionController_isFirstTimeInteractionEnabled, isFirstTimeInteractionEnabled ?? (() => true), "f");
        __classPrivateFieldSet(this, _TransactionController_isSimulationEnabled, isSimulationEnabled ?? (() => true), "f");
        __classPrivateFieldSet(this, _TransactionController_isSwapsDisabled, disableSwaps ?? false, "f");
        __classPrivateFieldSet(this, _TransactionController_isTimeoutEnabled, hooks?.isTimeoutEnabled ?? (() => true), "f");
        __classPrivateFieldSet(this, _TransactionController_pendingTransactionOptions, pendingTransactions, "f");
        __classPrivateFieldSet(this, _TransactionController_publicKeyEIP7702, publicKeyEIP7702, "f");
        __classPrivateFieldSet(this, _TransactionController_publish, hooks?.publish ??
            (() => Promise.resolve({ transactionHash: undefined })), "f");
        __classPrivateFieldSet(this, _TransactionController_publishBatchHook, hooks?.publishBatch, "f");
        __classPrivateFieldSet(this, _TransactionController_securityProviderRequest, securityProviderRequest, "f");
        __classPrivateFieldSet(this, _TransactionController_sign, sign, "f");
        __classPrivateFieldSet(this, _TransactionController_testGasFeeFlows, testGasFeeFlows === true, "f");
        __classPrivateFieldSet(this, _TransactionController_trace, trace ?? ((_request, fn) => fn?.()), "f");
        const findNetworkClientIdByChainId = (chainId) => {
            return this.messenger.call(`NetworkController:findNetworkClientIdByChainId`, chainId);
        };
        __classPrivateFieldSet(this, _TransactionController_multichainTrackingHelper, new MultichainTrackingHelper({
            findNetworkClientIdByChainId,
            getNetworkClientById: ((networkClientId) => {
                return this.messenger.call(`NetworkController:getNetworkClientById`, networkClientId);
            }),
            getNetworkClientRegistry,
            removePendingTransactionTrackerListeners: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_removePendingTransactionTrackerListeners).bind(this),
            createNonceTracker: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_createNonceTracker).bind(this),
            createPendingTransactionTracker: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_createPendingTransactionTracker).bind(this),
            onNetworkStateChange: (listener) => {
                this.messenger.subscribe('NetworkController:stateChange', listener);
            },
        }), "f");
        __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").initialize();
        __classPrivateFieldSet(this, _TransactionController_gasFeeFlows, __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getGasFeeFlows).call(this), "f");
        __classPrivateFieldSet(this, _TransactionController_layer1GasFeeFlows, __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getLayer1GasFeeFlows).call(this), "f");
        const gasFeePoller = new GasFeePoller({
            gasFeeFlows: __classPrivateFieldGet(this, _TransactionController_gasFeeFlows, "f"),
            getGasFeeControllerEstimates: __classPrivateFieldGet(this, _TransactionController_getGasFeeEstimates, "f"),
            getTransactions: () => this.state.transactions,
            getTransactionBatches: () => this.state.transactionBatches,
            layer1GasFeeFlows: __classPrivateFieldGet(this, _TransactionController_layer1GasFeeFlows, "f"),
            messenger: this.messenger,
            onStateChange: (listener) => {
                this.messenger.subscribe('TransactionController:stateChange', listener);
            },
        });
        gasFeePoller.hub.on('transaction-updated', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onGasFeePollerTransactionUpdate).bind(this));
        gasFeePoller.hub.on('transaction-batch-updated', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onGasFeePollerTransactionBatchUpdate).bind(this));
        __classPrivateFieldSet(this, _TransactionController_methodDataHelper, new MethodDataHelper({
            messenger: this.messenger,
            getState: () => this.state.methodData,
        }), "f");
        __classPrivateFieldGet(this, _TransactionController_methodDataHelper, "f").hub.on('update', ({ fourBytePrefix, methodData }) => {
            this.update((_state) => {
                _state.methodData[fourBytePrefix] = methodData;
            });
        });
        __classPrivateFieldSet(this, _TransactionController_incomingTransactionHelper, new IncomingTransactionHelper({
            client: __classPrivateFieldGet(this, _TransactionController_incomingTransactionOptions, "f").client,
            getCurrentAccount: () => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getSelectedAccount).call(this),
            getLocalTransactions: () => this.state.transactions,
            includeTokenTransfers: __classPrivateFieldGet(this, _TransactionController_incomingTransactionOptions, "f").includeTokenTransfers,
            isEnabled: __classPrivateFieldGet(this, _TransactionController_incomingTransactionOptions, "f").isEnabled,
            messenger: this.messenger,
            remoteTransactionSource: new AccountsApiRemoteTransactionSource(),
            trimTransactions: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).bind(this),
            updateTransactions: __classPrivateFieldGet(this, _TransactionController_incomingTransactionOptions, "f").updateTransactions,
        }), "f");
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_addIncomingTransactionHelperListeners).call(this, __classPrivateFieldGet(this, _TransactionController_incomingTransactionHelper, "f"));
        // when transactionsController state changes
        // check for pending transactions and start polling if there are any
        this.messenger.subscribe('TransactionController:stateChange', __classPrivateFieldGet(this, _TransactionController_checkForPendingTransactionAndStartPolling, "f"));
        // eslint-disable-next-line no-new
        new ResimulateHelper({
            simulateTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateSimulationData).bind(this),
            onTransactionsUpdate: (listener) => {
                this.messenger.subscribe('TransactionController:stateChange', listener, (controllerState) => controllerState.transactions);
            },
            getTransactions: () => this.state.transactions,
        });
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onBootCleanup).call(this);
        __classPrivateFieldGet(this, _TransactionController_checkForPendingTransactionAndStartPolling, "f").call(this);
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_registerActionHandlers).call(this);
    }
    /**
     * Stops polling and removes listeners to prepare the controller for garbage collection.
     */
    destroy() {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_stopAllTracking).call(this);
    }
    /**
     * Handle new method data request.
     *
     * @param fourBytePrefix - The method prefix.
     * @param networkClientId - The ID of the network client used to fetch the method data.
     * @returns The method data object corresponding to the given signature prefix.
     */
    async handleMethodData(fourBytePrefix, networkClientId) {
        return __classPrivateFieldGet(this, _TransactionController_methodDataHelper, "f").lookup(fourBytePrefix, networkClientId);
    }
    /**
     * Add a batch of transactions to be submitted after approval.
     *
     * @param request - Request object containing the transactions to add.
     * @returns Result object containing the generated batch ID.
     */
    async addTransactionBatch(request) {
        const { blockTracker } = this.messenger.call(`NetworkController:getNetworkClientById`, request.networkClientId);
        return await addTransactionBatch({
            addTransaction: this.addTransaction.bind(this),
            estimateGas: this.estimateGas.bind(this),
            getGasFeeEstimates: __classPrivateFieldGet(this, _TransactionController_getGasFeeEstimates, "f"),
            getInternalAccounts: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getInternalAccounts).bind(this),
            getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f").bind(this),
            getPendingTransactionTracker: (networkClientId) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_createPendingTransactionTracker).call(this, {
                blockTracker,
                networkClientId,
            }),
            getTransaction: (transactionId) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId),
            isSimulationEnabled: __classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f"),
            messenger: this.messenger,
            publishBatchHook: __classPrivateFieldGet(this, _TransactionController_publishBatchHook, "f"),
            publicKeyEIP7702: __classPrivateFieldGet(this, _TransactionController_publicKeyEIP7702, "f"),
            publishTransaction: (transactionMeta) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_publishTransaction).call(this, transactionMeta),
            request,
            signTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_signTransaction).bind(this),
            update: this.update.bind(this),
            updateTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).bind(this),
        });
    }
    /**
     * Determine which chains support atomic batch transactions with the given account address.
     *
     * @param request - Request object containing the account address and other parameters.
     * @returns  Result object containing the supported chains and related information.
     */
    async isAtomicBatchSupported(request) {
        return isAtomicBatchSupported({
            ...request,
            messenger: this.messenger,
            publicKeyEIP7702: __classPrivateFieldGet(this, _TransactionController_publicKeyEIP7702, "f"),
        });
    }
    /**
     * Add a new unapproved transaction to state. Parameters will be validated, a
     * unique transaction ID will be generated, and `gas` and `gasPrice` will be calculated
     * if not provided. A `<tx.id>:unapproved` hub event will be emitted once added.
     *
     * @param txParams - Standard parameters for an Ethereum transaction.
     * @param options - Additional options to control how the transaction is added.
     * @returns Object containing a promise resolving to the transaction hash if approved.
     */
    async addTransaction(txParams, options) {
        log('Adding transaction', txParams, options);
        const { actionId, assetsFiatValues, batchId, deviceConfirmedOn, disableGasBuffer, gasFeeToken, isGasFeeIncluded, isGasFeeSponsored, isStateOnly, method, nestedTransactions, networkClientId, origin, publishHook, requestId, requiredAssets, requireApproval, securityAlertResponse, skipInitialGasEstimate, swaps = {}, traceContext, type, } = options;
        // eslint-disable-next-line no-param-reassign
        txParams = normalizeTransactionParams(txParams);
        if (!__classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").has(networkClientId)) {
            throw new Error(`Network client not found - ${networkClientId}`);
        }
        const chainId = getChainId({ messenger: this.messenger, networkClientId });
        const permittedAddresses = origin === undefined
            ? undefined
            : await __classPrivateFieldGet(this, _TransactionController_getPermittedAccounts, "f")?.call(this, origin);
        const internalAccounts = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getInternalAccounts).call(this);
        await validateTransactionOrigin({
            data: txParams.data,
            from: txParams.from,
            internalAccounts,
            origin,
            permittedAddresses,
            txParams,
            type,
        });
        const delegationAddressPromise = getDelegationAddress(txParams.from, this.messenger, networkClientId).catch(() => undefined);
        const isEIP1559Compatible = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getEIP1559Compatibility).call(this, networkClientId);
        validateTxParams(txParams, isEIP1559Compatible, chainId);
        if (!txParams.type) {
            // Determine transaction type based on transaction parameters and network compatibility
            setEnvelopeType(txParams, isEIP1559Compatible);
        }
        const isDuplicateBatchId = batchId?.length &&
            this.state.transactions.some((tx) => tx.batchId?.toLowerCase() === batchId?.toLowerCase());
        if (isDuplicateBatchId && origin && origin !== ORIGIN_METAMASK) {
            throw new JsonRpcError(ErrorCode.DuplicateBundleId, 'Batch ID already exists');
        }
        const dappSuggestedGasFees = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_generateDappSuggestedGasFees).call(this, txParams, origin);
        const transactionType = type ??
            (await determineTransactionType(txParams, {
                messenger: this.messenger,
                networkClientId,
            })).type;
        let addedTransactionMeta = {
            actionId,
            assetsFiatValues,
            batchId,
            chainId,
            dappSuggestedGasFees,
            deviceConfirmedOn,
            disableGasBuffer,
            id: random(),
            isGasFeeTokenIgnoredIfBalance: Boolean(gasFeeToken),
            isGasFeeIncluded,
            isGasFeeSponsored,
            isFirstTimeInteraction: undefined,
            isStateOnly,
            nestedTransactions,
            networkClientId,
            origin,
            requestId,
            requiredAssets,
            securityAlertResponse,
            selectedGasFeeToken: gasFeeToken,
            status: TransactionStatus.unapproved,
            time: Date.now(),
            txParams,
            type: transactionType,
            userEditedGasLimit: false,
            verifiedOnBlockchain: false,
        };
        const { updateTransaction } = await __classPrivateFieldGet(this, _TransactionController_afterAdd, "f").call(this, {
            transactionMeta: addedTransactionMeta,
        });
        if (updateTransaction) {
            log('Updating transaction using afterAdd hook');
            addedTransactionMeta.txParamsOriginal = cloneDeep(addedTransactionMeta.txParams);
            updateTransaction(addedTransactionMeta);
        }
        // eslint-disable-next-line no-negated-condition
        if (!skipInitialGasEstimate) {
            await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Estimate Gas Properties', parentContext: traceContext }, (context) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateGasProperties).call(this, addedTransactionMeta, {
                traceContext: context,
            }));
        }
        else {
            const newTransactionMeta = cloneDeep(addedTransactionMeta);
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateGasProperties).call(this, newTransactionMeta)
                .then(() => {
                __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
                    transactionId: newTransactionMeta.id,
                    skipResimulateCheck: true,
                    skipValidation: true,
                }, (tx) => {
                    tx.txParams.gas = newTransactionMeta.txParams.gas;
                    tx.txParams.gasPrice = newTransactionMeta.txParams.gasPrice;
                    tx.txParams.maxFeePerGas =
                        newTransactionMeta.txParams.maxFeePerGas;
                    tx.txParams.maxPriorityFeePerGas =
                        newTransactionMeta.txParams.maxPriorityFeePerGas;
                });
                return undefined;
            })
                .catch(noop);
        }
        // Set security provider response
        if (method && __classPrivateFieldGet(this, _TransactionController_securityProviderRequest, "f")) {
            const securityProviderResponse = await __classPrivateFieldGet(this, _TransactionController_securityProviderRequest, "f").call(this, addedTransactionMeta, method);
            // eslint-disable-next-line require-atomic-updates
            addedTransactionMeta.securityProviderResponse = securityProviderResponse;
        }
        addedTransactionMeta = updateSwapsTransaction(addedTransactionMeta, transactionType, swaps, {
            isSwapsDisabled: __classPrivateFieldGet(this, _TransactionController_isSwapsDisabled, "f"),
            cancelTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_rejectTransaction).bind(this),
            messenger: this.messenger,
        });
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_addMetadata).call(this, addedTransactionMeta);
        delegationAddressPromise
            .then((delegationAddress) => {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
                transactionId: addedTransactionMeta.id,
                skipResimulateCheck: true,
                skipValidation: true,
            }, (tx) => {
                tx.delegationAddress = delegationAddress;
            });
            return undefined;
        })
            .catch(noop);
        if (requireApproval !== false && !isStateOnly) {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateSimulationData).call(this, addedTransactionMeta, {
                traceContext,
            }).catch((error) => {
                log('Error while updating simulation data', error);
                throw error;
            });
            updateFirstTimeInteraction({
                existingTransactions: this.state.transactions,
                getTransaction: (transactionId) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId),
                isFirstTimeInteractionEnabled: __classPrivateFieldGet(this, _TransactionController_isFirstTimeInteractionEnabled, "f"),
                trace: __classPrivateFieldGet(this, _TransactionController_trace, "f"),
                traceContext,
                transactionMeta: addedTransactionMeta,
                updateTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).bind(this),
            }).catch((error) => {
                log('Error while updating first interaction properties', error);
            });
        }
        else {
            log('Skipping simulation & first interaction update as approval not required');
        }
        this.messenger.publish(`${controllerName}:unapprovedTransactionAdded`, addedTransactionMeta);
        return {
            result: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_processApproval).call(this, addedTransactionMeta, {
                actionId,
                publishHook,
                requireApproval,
                traceContext,
            }),
            transactionMeta: addedTransactionMeta,
        };
    }
    /**
     * Starts polling for incoming transactions from the remote transaction source.
     */
    startIncomingTransactionPolling() {
        __classPrivateFieldGet(this, _TransactionController_incomingTransactionHelper, "f").start();
    }
    /**
     * Stops polling for incoming transactions from the remote transaction source.
     */
    stopIncomingTransactionPolling() {
        __classPrivateFieldGet(this, _TransactionController_incomingTransactionHelper, "f").stop();
    }
    /**
     * Update the incoming transactions by polling the remote transaction source.
     *
     * @param request - Request object.
     * @param request.tags - Additional tags to identify the source of the request.
     */
    async updateIncomingTransactions({ tags, } = {}) {
        await __classPrivateFieldGet(this, _TransactionController_incomingTransactionHelper, "f").update({ tags });
    }
    /**
     * Attempts to cancel a transaction based on its ID by setting its status to "rejected"
     * and emitting a `<tx.id>:finished` hub event.
     *
     * @param transactionId - The ID of the transaction to cancel.
     * @param gasValues - The gas values to use for the cancellation transaction.
     * @param options - The options for the cancellation transaction.
     * @param options.actionId - Unique ID persisted on transaction metadata.
     * @param options.estimatedBaseFee - The estimated base fee of the transaction.
     */
    async stopTransaction(transactionId, gasValues, { estimatedBaseFee, actionId, } = {}) {
        await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_retryTransaction).call(this, {
            actionId,
            estimatedBaseFee,
            gasValues,
            label: 'cancel',
            rate: CANCEL_RATE,
            transactionId,
            transactionType: TransactionType.cancel,
            prepareTransactionParams: (txParams) => {
                delete txParams.data;
                txParams.to = txParams.from;
                txParams.value = '0x0';
            },
            afterSubmit: (newTransactionMeta) => {
                this.messenger.publish(`${controllerName}:transactionFinished`, newTransactionMeta);
                __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").emit(`${newTransactionMeta.id}:finished`, newTransactionMeta);
            },
        });
    }
    /**
     * Attempts to speed up a transaction increasing transaction gasPrice by ten percent.
     *
     * @param transactionId - The ID of the transaction to speed up.
     * @param gasValues - The gas values to use for the speed up transaction.
     * @param options - The options for the speed up transaction.
     * @param options.actionId - Unique ID persisted on transaction metadata.
     * @param options.estimatedBaseFee - The estimated base fee of the transaction.
     */
    async speedUpTransaction(transactionId, gasValues, { actionId, estimatedBaseFee, } = {}) {
        await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_retryTransaction).call(this, {
            actionId,
            estimatedBaseFee,
            gasValues,
            label: 'speed up',
            rate: SPEED_UP_RATE,
            transactionId,
            transactionType: TransactionType.retry,
            afterSubmit: (newTransactionMeta) => {
                this.messenger.publish(`${controllerName}:speedupTransactionAdded`, newTransactionMeta);
            },
        });
    }
    /**
     * Estimates required gas for a given transaction.
     *
     * @param transaction - The transaction to estimate gas for.
     * @param networkClientId - The network client id to use for the estimate.
     * @param options - Additional options for the estimate.
     * @param options.ignoreDelegationSignatures - Ignore signature errors if submitting delegations to the DelegationManager.
     * @returns The gas and gas price.
     */
    async estimateGas(transaction, networkClientId, { ignoreDelegationSignatures, } = {}) {
        const { estimatedGas, simulationFails } = await estimateGas({
            ignoreDelegationSignatures,
            isSimulationEnabled: __classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f").call(this),
            getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f"),
            messenger: this.messenger,
            networkClientId,
            txParams: transaction,
        });
        return { gas: estimatedGas, simulationFails };
    }
    /**
     * Estimates required gas for a batch of transactions.
     *
     * @param request - Request object.
     * @param request.chainId - Chain ID of the transactions.
     * @param request.from - Address of the sender.
     * @param request.transactions - Array of transactions within a batch request.
     * @returns Object containing the gas limit.
     */
    async estimateGasBatch({ chainId, from, transactions, }) {
        return estimateGasBatch({
            from,
            getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f"),
            isAtomicBatchSupported: this.isAtomicBatchSupported.bind(this),
            messenger: this.messenger,
            networkClientId: getNetworkClientId({
                messenger: this.messenger,
                chainId,
            }),
            transactions,
        });
    }
    /**
     * Estimates required gas for a given transaction and add additional gas buffer with the given multiplier.
     *
     * @param transaction - The transaction params to estimate gas for.
     * @param multiplier - The multiplier to use for the gas buffer.
     * @param networkClientId - The network client id to use for the estimate.
     * @returns The buffered estimated gas and whether the estimation failed.
     */
    async estimateGasBuffered(transaction, multiplier, networkClientId) {
        const { blockGasLimit, estimatedGas, simulationFails } = await estimateGas({
            isSimulationEnabled: __classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f").call(this),
            getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f"),
            messenger: this.messenger,
            networkClientId,
            txParams: transaction,
        });
        const gas = addGasBuffer(estimatedGas, blockGasLimit, multiplier);
        return {
            gas,
            simulationFails,
        };
    }
    /**
     * Updates an existing transaction in state.
     *
     * @param transactionMeta - The new transaction to store in state.
     * @param note - A note or update reason to be logged.
     */
    updateTransaction(transactionMeta, note) {
        const { id: transactionId } = transactionMeta;
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId }, () => ({
            ...transactionMeta,
        }));
        log('Transaction updated', { transactionId, note });
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
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update security alert response as no transaction metadata found`);
        }
        const updatedTransactionMeta = {
            ...transactionMeta,
            securityAlertResponse,
        };
        this.updateTransaction(updatedTransactionMeta, `${controllerName}:updatesecurityAlertResponse - securityAlertResponse updated`);
    }
    /**
     * Remove transactions from state.
     *
     * @param options - The options bag.
     * @param options.address - Remove transactions from this account only. Defaults to all accounts.
     * @param options.chainId - Remove transactions for the specified chain only. Defaults to all chains.
     */
    wipeTransactions({ address, chainId, } = {}) {
        if (!chainId && !address) {
            this.update((state) => {
                state.transactions = [];
            });
            return;
        }
        const newTransactions = this.state.transactions.filter(({ chainId: txChainId, txParams, type }) => {
            const isMatchingNetwork = !chainId || chainId === txChainId;
            if (!isMatchingNetwork) {
                return true;
            }
            const isMatchingAddress = !address ||
                txParams.from?.toLowerCase() === address.toLowerCase() ||
                (type === TransactionType.incoming &&
                    txParams.to?.toLowerCase() === address.toLowerCase());
            return !isMatchingAddress;
        });
        this.update((state) => {
            state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, newTransactions);
        });
    }
    /**
     * @deprecated No longer used. Kept only to avoid breaking changes. It now performs no operations.
     * @param transactionID - The ID of the transaction to update.
     * @param _currentSendFlowHistoryLength - The length of the current sendFlowHistory array.
     * @param _sendFlowHistoryToAdd - The sendFlowHistory entries to add.
     * @returns The transactionMeta.
     */
    updateTransactionSendFlowHistory(transactionID, _currentSendFlowHistoryLength, _sendFlowHistoryToAdd) {
        // Return the transaction unchanged
        return __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionID);
    }
    /**
     * Adds external provided transaction to state as confirmed transaction.
     *
     * @param transactionMeta - TransactionMeta to add transactions.
     * @param transactionReceipt - TransactionReceipt of the external transaction.
     * @param baseFeePerGas - Base fee per gas of the external transaction.
     */
    async confirmExternalTransaction(transactionMeta, transactionReceipt, baseFeePerGas) {
        // Run validation and add external transaction to state.
        const newTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_addExternalTransaction).call(this, transactionMeta);
        try {
            const transactionId = newTransactionMeta.id;
            // Make sure status is confirmed and define gasUsed as in receipt.
            const updatedTransactionMeta = {
                ...newTransactionMeta,
                status: TransactionStatus.confirmed,
                txReceipt: transactionReceipt,
            };
            if (baseFeePerGas) {
                updatedTransactionMeta.baseFeePerGas = baseFeePerGas;
            }
            // Update same nonce local transactions as dropped and define replacedBy properties.
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_markNonceDuplicatesDropped).call(this, transactionId);
            // Update external provided transaction with updated gas values and confirmed status.
            this.updateTransaction(updatedTransactionMeta, `${controllerName}:confirmExternalTransaction - Add external transaction`);
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, updatedTransactionMeta);
            // Intentional given potential duration of process.
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updatePostBalance).call(this, updatedTransactionMeta).catch((error) => {
                /* istanbul ignore next */
                log('Error while updating post balance', error);
                throw error;
            });
            this.messenger.publish(`${controllerName}:transactionConfirmed`, updatedTransactionMeta);
        }
        catch (error) {
            console.error('Failed to confirm external transaction', error);
        }
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
    updateTransactionGasFees(transactionId, { defaultGasEstimates, estimateUsed, estimateSuggested, gas, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas, originalGasEstimate, userEditedGasLimit, userFeeLevel: userFeeLevelParam, }) {
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update transaction as no transaction metadata found`);
        }
        validateIfTransactionUnapprovedOrSubmitted(transactionMeta, 'updateTransactionGasFees');
        const clonedTransactionMeta = cloneDeep(transactionMeta);
        const isTransactionGasFeeEstimatesExists = transactionMeta.gasFeeEstimates;
        const isAutomaticGasFeeUpdateEnabled = __classPrivateFieldGet(this, _TransactionController_isAutomaticGasFeeUpdateEnabled, "f").call(this, transactionMeta);
        const userFeeLevel = userFeeLevelParam;
        const isOneOfFeeLevelSelected = Object.values(GasFeeEstimateLevel).includes(userFeeLevel);
        const shouldUpdateTxParamsGasFees = isTransactionGasFeeEstimatesExists &&
            isAutomaticGasFeeUpdateEnabled &&
            isOneOfFeeLevelSelected;
        if (shouldUpdateTxParamsGasFees) {
            updateTransactionGasEstimates({
                txMeta: clonedTransactionMeta,
                userFeeLevel,
            });
        }
        const txParamsUpdate = {
            gas,
            gasLimit,
        };
        if (shouldUpdateTxParamsGasFees) {
            // Get updated values from clonedTransactionMeta if we're using automated fee updates
            Object.assign(txParamsUpdate, {
                gasPrice: clonedTransactionMeta.txParams.gasPrice,
                maxPriorityFeePerGas: clonedTransactionMeta.txParams.maxPriorityFeePerGas,
                maxFeePerGas: clonedTransactionMeta.txParams.maxFeePerGas,
            });
        }
        else {
            Object.assign(txParamsUpdate, {
                gasPrice,
                maxPriorityFeePerGas,
                maxFeePerGas,
            });
        }
        const transactionGasFees = {
            txParams: pickBy(txParamsUpdate),
            defaultGasEstimates,
            estimateUsed,
            estimateSuggested,
            originalGasEstimate,
            userEditedGasLimit,
            userFeeLevel,
        };
        const filteredTransactionGasFees = pickBy(transactionGasFees);
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
            skipResimulateCheck: true,
        }, (draftTxMeta) => {
            const { txParams, ...otherProps } = filteredTransactionGasFees;
            Object.assign(draftTxMeta, otherProps);
            if (txParams) {
                Object.assign(draftTxMeta.txParams, txParams);
            }
        });
        return __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    }
    /**
     * Update the previous gas values of a transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param previousGas - Previous gas values to update.
     * @param previousGas.gasLimit - Maximum number of units of gas to use for this transaction.
     * @param previousGas.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
     * @param previousGas.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
     * @returns The updated transactionMeta.
     */
    updatePreviousGasParams(transactionId, { gasLimit, maxFeePerGas, maxPriorityFeePerGas, }) {
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update transaction as no transaction metadata found`);
        }
        validateIfTransactionUnapprovedOrSubmitted(transactionMeta, 'updatePreviousGasParams');
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
        transactionPreviousGas.previousGas = pickBy(transactionPreviousGas.previousGas);
        // merge updated previous gas values with existing transaction meta
        const updatedMeta = merge({}, transactionMeta, transactionPreviousGas);
        this.updateTransaction(updatedMeta, `${controllerName}:updatePreviousGasParams - Previous gas values updated`);
        return __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    }
    /**
     * Acquires a nonce lock for the given address on the specified network,
     * ensuring that nonces are assigned sequentially without conflicts.
     *
     * @param address - The account address for which to acquire the nonce lock.
     * @param networkClientId - The ID of the network client to use.
     * @returns A promise that resolves to a nonce lock containing the next nonce and a release function.
     */
    async getNonceLock(address, networkClientId) {
        return __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").getNonceLock(address, networkClientId);
    }
    /**
     * Updates the editable parameters of a transaction.
     *
     * @param txId - The ID of the transaction to update.
     * @param params - The editable parameters to update.
     * @param params.containerTypes - Container types applied to the parameters.
     * @param params.data - Data to pass with the transaction.
     * @param params.from - Address to send the transaction from.
     * @param params.gas - Maximum number of units of gas to use for the transaction.
     * @param params.gasPrice - Price per gas for legacy transactions.
     * @param params.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
     * @param params.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
     * @param params.updateType - Whether to update the transaction type. Defaults to `true`.
     * @param params.to - Address to send the transaction to.
     * @param params.value - Value associated with the transaction.
     * @returns The updated transaction metadata.
     */
    async updateEditableParams(txId, { containerTypes, data, from, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, to, updateType, value, }) {
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, txId);
        if (!transactionMeta) {
            throw new Error(`Cannot update editable params as no transaction metadata found`);
        }
        validateIfTransactionUnapproved(transactionMeta, 'updateEditableParams');
        const editableParams = {
            txParams: {
                data,
                from,
                to,
                value,
                gas,
                gasPrice,
                maxFeePerGas,
                maxPriorityFeePerGas,
            },
        };
        editableParams.txParams = pickBy(editableParams.txParams);
        const updatedTransaction = merge({}, transactionMeta, editableParams);
        const { networkClientId } = transactionMeta;
        if (updateType !== false) {
            const { type } = await determineTransactionType(updatedTransaction.txParams, {
                messenger: this.messenger,
                networkClientId,
            });
            updatedTransaction.type = type;
        }
        if (containerTypes) {
            updatedTransaction.containerTypes = containerTypes;
        }
        await updateTransactionLayer1GasFee({
            layer1GasFeeFlows: __classPrivateFieldGet(this, _TransactionController_layer1GasFeeFlows, "f"),
            messenger: this.messenger,
            transactionMeta: updatedTransaction,
        });
        this.updateTransaction(updatedTransaction, `Update Editable Params for ${txId}`);
        return __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, txId);
    }
    /**
     * Update the isActive state of a transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param isActive - The active state.
     */
    setTransactionActive(transactionId, isActive) {
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Transaction with id ${transactionId} not found`);
        }
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
            skipValidation: true,
            skipResimulateCheck: true,
        }, (updatedTransactionMeta) => {
            updatedTransactionMeta.isActive = isActive;
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
    async approveTransactionsWithSameNonce(listOfTxParams = [], { hasNonce } = {}) {
        log('Approving transactions with same nonce', {
            transactions: listOfTxParams,
        });
        if (listOfTxParams.length === 0) {
            return '';
        }
        const initialTx = listOfTxParams[0];
        const { chainId } = initialTx;
        const networkClientId = getNetworkClientId({
            messenger: this.messenger,
            chainId,
        });
        const initialTxAsEthTx = prepareTransaction(chainId, initialTx);
        const initialTxAsSerializedHex = serializeTransaction(initialTxAsEthTx);
        if (__classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").has(initialTxAsSerializedHex)) {
            return '';
        }
        __classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").add(initialTxAsSerializedHex);
        let rawTransactions, nonceLock;
        try {
            // TODO: we should add a check to verify that all transactions have the same from address
            const fromAddress = initialTx.from;
            const requiresNonce = hasNonce !== true;
            nonceLock = requiresNonce
                ? await this.getNonceLock(fromAddress, networkClientId)
                : undefined;
            const nonce = nonceLock
                ? add0x(nonceLock.nextNonce.toString(16))
                : initialTx.nonce;
            if (nonceLock) {
                log('Using nonce from nonce tracker', nonce, nonceLock.nonceDetails);
            }
            rawTransactions = await Promise.all(listOfTxParams.map((txParams) => {
                txParams.nonce = nonce;
                return __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_signExternalTransaction).call(this, txParams.chainId, txParams);
            }));
        }
        catch (error) {
            log('Error while signing transactions with same nonce', error);
            // Must set transaction to submitted/failed before releasing lock
            // continue with error chain
            throw error;
        }
        finally {
            nonceLock?.releaseLock();
            __classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").delete(initialTxAsSerializedHex);
        }
        return rawTransactions;
    }
    /**
     * Update a custodial transaction.
     *
     * @param request - The custodial transaction update request.
     *
     * @returns The updated transaction metadata.
     */
    updateCustodialTransaction(request) {
        const { transactionId, errorMessage, hash, status, gasLimit, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, type, } = request;
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot update custodial transaction as no transaction metadata found`);
        }
        if (status &&
            ![
                TransactionStatus.submitted,
                TransactionStatus.signed,
                TransactionStatus.failed,
            ].includes(status)) {
            throw new Error(`Cannot update custodial transaction with status: ${status}`);
        }
        const updatedTransactionMeta = merge({}, transactionMeta, pickBy({ hash, status }));
        if (updatedTransactionMeta.status === TransactionStatus.submitted) {
            updatedTransactionMeta.submittedTime = new Date().getTime();
        }
        if (updatedTransactionMeta.status === TransactionStatus.failed) {
            updatedTransactionMeta.error = normalizeTxError(new Error(errorMessage));
        }
        // Update txParams properties with a single pickBy operation
        updatedTransactionMeta.txParams = merge({}, updatedTransactionMeta.txParams, pickBy({
            gasLimit,
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            nonce,
            type,
        }));
        // Special case for type change to legacy
        if (type === TransactionEnvelopeType.legacy) {
            delete updatedTransactionMeta.txParams.maxFeePerGas;
            delete updatedTransactionMeta.txParams.maxPriorityFeePerGas;
        }
        this.updateTransaction(updatedTransactionMeta, `${controllerName}:updateCustodialTransaction - Custodial transaction updated`);
        if (status &&
            [TransactionStatus.submitted, TransactionStatus.failed].includes(status)) {
            this.messenger.publish(`${controllerName}:transactionFinished`, updatedTransactionMeta);
            __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").emit(`${updatedTransactionMeta.id}:finished`, updatedTransactionMeta);
        }
        return updatedTransactionMeta;
    }
    /**
     * Search transaction metadata for matching entries.
     *
     * @param opts - Options bag.
     * @param opts.initialList - The transactions to search. Defaults to the current state.
     * @param opts.limit - The maximum number of transactions to return. No limit by default.
     * @param opts.searchCriteria - An object containing values or functions for transaction properties to filter transactions with.
     * @returns An array of transactions matching the provided options.
     */
    getTransactions({ initialList, limit, searchCriteria = {}, } = {}) {
        // searchCriteria is an object that might have values that aren't predicate
        // methods. When providing any other value type (string, number, etc), we
        // consider this shorthand for "check the value at key for strict equality
        // with the provided value". To conform this object to be only methods, we
        // mapValues (lodash) such that every value on the object is a method that
        // returns a boolean.
        const predicateMethods = mapValues(searchCriteria, (predicate) => {
            return typeof predicate === 'function'
                ? predicate
                : // TODO: Replace `any` with type
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (value) => value === predicate;
        });
        const transactionsToFilter = initialList ?? this.state.transactions;
        // Combine sortBy and pickBy to transform our state object into an array of
        // matching transactions that are sorted by time.
        const filteredTransactions = sortBy(pickBy(transactionsToFilter, (transaction) => {
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
    /**
     * Estimates the gas fees for a transaction.
     *
     * @param args - The arguments for estimating gas fees.
     * @param args.transactionParams - The transaction parameters to estimate fees for.
     * @param args.chainId - The chain ID to use. If not provided, the network client ID is used to determine the chain.
     * @param args.networkClientId - The network client ID to use for the estimation.
     * @returns A promise that resolves to the estimated gas fee response.
     */
    async estimateGasFee({ transactionParams, chainId, networkClientId: requestNetworkClientId, }) {
        const { id: networkClientId } = __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").getNetworkClient({
            chainId,
            networkClientId: requestNetworkClientId,
        });
        const transactionMeta = {
            txParams: transactionParams,
            chainId,
            networkClientId,
        };
        // Guaranteed as the default gas fee flow matches all transactions.
        const gasFeeFlow = getGasFeeFlow(transactionMeta, __classPrivateFieldGet(this, _TransactionController_gasFeeFlows, "f"), this.messenger);
        const gasFeeControllerData = await __classPrivateFieldGet(this, _TransactionController_getGasFeeEstimates, "f").call(this, {
            networkClientId,
        });
        return gasFeeFlow.getGasFees({
            gasFeeControllerData,
            messenger: this.messenger,
            transactionMeta,
        });
    }
    /**
     * Determine the layer 1 gas fee for the given transaction parameters.
     *
     * @param request - The request object.
     * @param request.transactionParams - The transaction parameters to estimate the layer 1 gas fee for.
     * @param request.chainId - The ID of the chain where the transaction will be executed.
     * @param request.networkClientId - The ID of a specific network client to process the transaction.
     * @returns The layer 1 gas fee.
     */
    async getLayer1GasFee({ transactionParams, chainId, networkClientId, }) {
        const resolvedNetworkClientId = getNetworkClientId({
            messenger: this.messenger,
            chainId,
            networkClientId,
        });
        return await getTransactionLayer1GasFee({
            layer1GasFeeFlows: __classPrivateFieldGet(this, _TransactionController_layer1GasFeeFlows, "f"),
            messenger: this.messenger,
            transactionMeta: {
                txParams: transactionParams,
                chainId,
                networkClientId: resolvedNetworkClientId,
            },
        });
    }
    /**
     * Removes unapproved transactions from state.
     */
    clearUnapprovedTransactions() {
        const transactions = this.state.transactions.filter(({ status }) => status !== TransactionStatus.unapproved);
        this.update((state) => {
            state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, transactions);
        });
    }
    /**
     * Stop the signing process for a specific transaction.
     * Throws an error causing the transaction status to be set to failed.
     *
     * @param transactionId - The ID of the transaction to stop signing.
     */
    abortTransactionSigning(transactionId) {
        const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
        if (!transactionMeta) {
            throw new Error(`Cannot abort signing as no transaction metadata found`);
        }
        const abortCallback = __classPrivateFieldGet(this, _TransactionController_signAbortCallbacks, "f").get(transactionId);
        if (!abortCallback) {
            throw new Error(`Cannot abort signing as transaction is not waiting for signing`);
        }
        abortCallback();
        __classPrivateFieldGet(this, _TransactionController_signAbortCallbacks, "f").delete(transactionId);
    }
    /**
     * Update the transaction data of a single nested transaction within an atomic batch transaction.
     *
     * @param options - The options bag.
     * @param options.transactionId - ID of the atomic batch transaction.
     * @param options.transactionIndex - Index of the nested transaction within the atomic batch transaction.
     * @param options.transactionData - New data to set for the nested transaction.
     * @returns The updated data for the atomic batch transaction.
     */
    async updateAtomicBatchData({ transactionId, transactionIndex, transactionData, }) {
        log('Updating atomic batch data', {
            transactionId,
            transactionIndex,
            transactionData,
        });
        const updatedTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
        }, (transactionMeta) => {
            const { nestedTransactions, txParams } = transactionMeta;
            const from = txParams.from;
            const nestedTransaction = nestedTransactions?.[transactionIndex];
            if (!nestedTransaction) {
                throw new Error(`Nested transaction not found with index - ${transactionIndex}`);
            }
            nestedTransaction.data = transactionData;
            const batchTransaction = generateEIP7702BatchTransaction(from, nestedTransactions);
            transactionMeta.txParams.data = batchTransaction.data;
        });
        const draftTransaction = cloneDeep({
            ...updatedTransactionMeta,
            txParams: {
                ...updatedTransactionMeta.txParams,
                // Clear existing gas to force estimation
                gas: undefined,
            },
        });
        await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateGasEstimate).call(this, draftTransaction);
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
        }, (transactionMeta) => {
            transactionMeta.txParams.gas = draftTransaction.txParams.gas;
            transactionMeta.simulationFails = draftTransaction.simulationFails;
            transactionMeta.gasLimitNoBuffer = draftTransaction.gasLimitNoBuffer;
        });
        return updatedTransactionMeta.txParams.data;
    }
    /**
     * Update the batch transactions associated with a transaction.
     * These transactions will be submitted with the main transaction as a batch.
     *
     * @param request - The request object.
     * @param request.transactionId - The ID of the transaction to update.
     * @param request.batchTransactions - The new batch transactions.
     */
    updateBatchTransactions({ transactionId, batchTransactions, }) {
        log('Updating batch transactions', { transactionId, batchTransactions });
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
        }, (transactionMeta) => {
            transactionMeta.batchTransactions = batchTransactions;
        });
    }
    /**
     * Update the selected gas fee token for a transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param contractAddress - The contract address of the selected gas fee token.
     */
    updateSelectedGasFeeToken(transactionId, contractAddress) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId }, (transactionMeta) => {
            const hasMatchingGasFeeToken = transactionMeta.gasFeeTokens?.some((token) => token.tokenAddress.toLowerCase() === contractAddress?.toLowerCase());
            if (contractAddress && !hasMatchingGasFeeToken) {
                throw new Error(`No matching gas fee token found with address - ${contractAddress}`);
            }
            transactionMeta.selectedGasFeeToken = contractAddress;
        });
    }
    /**
     * Update the required transaction IDs for a transaction.
     *
     * @param request - The request object.
     * @param request.transactionId - The ID of the transaction to update.
     * @param request.requiredTransactionIds - The additional required transaction IDs.
     * @param request.append - Whether to append the IDs to any existing values. Defaults to true.
     */
    updateRequiredTransactionIds({ transactionId, requiredTransactionIds, append, }) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId }, (transactionMeta) => {
            const { requiredTransactionIds: existing } = transactionMeta;
            transactionMeta.requiredTransactionIds = [
                ...(existing && append !== false ? existing : []),
                ...requiredTransactionIds,
            ];
        });
    }
    /**
     * Emulate a new transaction.
     *
     * @param transactionId - The transaction ID.
     */
    emulateNewTransaction(transactionId) {
        const transactionMeta = this.state.transactions.find((tx) => tx.id === transactionId);
        if (!transactionMeta) {
            return;
        }
        if (transactionMeta.type === TransactionType.swap) {
            this.messenger.publish('TransactionController:transactionNewSwap', {
                transactionMeta,
            });
        }
        else if (transactionMeta.type === TransactionType.swapApproval) {
            this.messenger.publish('TransactionController:transactionNewSwapApproval', { transactionMeta });
        }
    }
    /**
     * Emulate a transaction update.
     *
     * @param transactionMeta - Transaction metadata.
     */
    emulateTransactionUpdate(transactionMeta) {
        const updatedTransactionMeta = {
            ...transactionMeta,
            txParams: {
                ...transactionMeta.txParams,
                from: this.messenger.call('AccountsController:getSelectedAccount')
                    .address,
            },
        };
        const transactionExists = this.state.transactions.some((tx) => tx.id === updatedTransactionMeta.id);
        if (!transactionExists) {
            this.update((state) => {
                state.transactions.push(updatedTransactionMeta);
            });
        }
        this.updateTransaction(updatedTransactionMeta, 'Generated from user operation');
        this.messenger.publish('TransactionController:transactionStatusUpdated', {
            transactionMeta: updatedTransactionMeta,
        });
    }
    /**
     * Retrieve available gas fee tokens for a transaction.
     *
     * @param request - The request object containing transaction details.
     * @returns The list of available gas fee tokens.
     */
    async getGasFeeTokens(request) {
        const { chainId, data, from, to, value } = request;
        const networkClientId = getNetworkClientId({
            messenger: this.messenger,
            chainId,
        });
        const delegationAddress = await getDelegationAddress(from, this.messenger, networkClientId);
        const transaction = {
            chainId,
            delegationAddress,
            isExternalSign: true,
            txParams: {
                data,
                from,
                to,
                value,
            },
        };
        const result = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getGasFeeTokens).call(this, transaction);
        return result.gasFeeTokens;
    }
}
_TransactionController_afterAdd = new WeakMap(), _TransactionController_afterSign = new WeakMap(), _TransactionController_afterSimulate = new WeakMap(), _TransactionController_approvingTransactionIds = new WeakMap(), _TransactionController_beforeCheckPendingTransaction = new WeakMap(), _TransactionController_beforePublish = new WeakMap(), _TransactionController_beforeSign = new WeakMap(), _TransactionController_gasFeeFlows = new WeakMap(), _TransactionController_getAdditionalSignArguments = new WeakMap(), _TransactionController_getCurrentAccountEIP1559Compatibility = new WeakMap(), _TransactionController_getCurrentNetworkEIP1559Compatibility = new WeakMap(), _TransactionController_getExternalPendingTransactions = new WeakMap(), _TransactionController_getGasFeeEstimates = new WeakMap(), _TransactionController_getNetworkState = new WeakMap(), _TransactionController_getPermittedAccounts = new WeakMap(), _TransactionController_getSavedGasFees = new WeakMap(), _TransactionController_getSimulationConfig = new WeakMap(), _TransactionController_incomingTransactionHelper = new WeakMap(), _TransactionController_incomingTransactionOptions = new WeakMap(), _TransactionController_internalEvents = new WeakMap(), _TransactionController_isAutomaticGasFeeUpdateEnabled = new WeakMap(), _TransactionController_isEIP7702GasFeeTokensEnabled = new WeakMap(), _TransactionController_isFirstTimeInteractionEnabled = new WeakMap(), _TransactionController_isSimulationEnabled = new WeakMap(), _TransactionController_isSwapsDisabled = new WeakMap(), _TransactionController_isTimeoutEnabled = new WeakMap(), _TransactionController_layer1GasFeeFlows = new WeakMap(), _TransactionController_methodDataHelper = new WeakMap(), _TransactionController_multichainTrackingHelper = new WeakMap(), _TransactionController_pendingTransactionOptions = new WeakMap(), _TransactionController_publicKeyEIP7702 = new WeakMap(), _TransactionController_publish = new WeakMap(), _TransactionController_publishBatchHook = new WeakMap(), _TransactionController_securityProviderRequest = new WeakMap(), _TransactionController_sign = new WeakMap(), _TransactionController_signAbortCallbacks = new WeakMap(), _TransactionController_skipSimulationTransactionIds = new WeakMap(), _TransactionController_testGasFeeFlows = new WeakMap(), _TransactionController_trace = new WeakMap(), _TransactionController_checkForPendingTransactionAndStartPolling = new WeakMap(), _TransactionController_instances = new WeakSet(), _TransactionController_retryTransaction = async function _TransactionController_retryTransaction({ actionId, afterSubmit, estimatedBaseFee, gasValues, label, prepareTransactionParams, rate, transactionId, transactionType, }) {
    if (gasValues) {
        // Not good practice to reassign a parameter but temporarily avoiding a larger refactor.
        // eslint-disable-next-line no-param-reassign
        gasValues = normalizeGasFeeValues(gasValues);
        validateGasValues(gasValues);
    }
    log(`Creating ${label} transaction`, transactionId, gasValues);
    const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    /* istanbul ignore next */
    if (!transactionMeta) {
        return;
    }
    /* istanbul ignore next */
    if (!__classPrivateFieldGet(this, _TransactionController_sign, "f")) {
        throw new Error('No sign method defined.');
    }
    const newTxParams = getTransactionParamsWithIncreasedGasFee(transactionMeta.txParams, rate, gasValues);
    prepareTransactionParams?.(newTxParams);
    const unsignedEthTx = prepareTransaction(transactionMeta.chainId, newTxParams);
    const signedTx = await __classPrivateFieldGet(this, _TransactionController_sign, "f").call(this, unsignedEthTx, transactionMeta.txParams.from);
    const transactionMetaWithRsv = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionMetaRSV).call(this, transactionMeta, signedTx);
    const rawTx = serializeTransaction(signedTx);
    const newFee = newTxParams.maxFeePerGas ?? newTxParams.gasPrice;
    const oldFee = newTxParams.maxFeePerGas
        ? transactionMetaWithRsv.txParams.maxFeePerGas
        : transactionMetaWithRsv.txParams.gasPrice;
    log(`Submitting ${label} transaction`, {
        oldFee,
        newFee,
        txParams: newTxParams,
    });
    const newTransactionMeta = {
        ...transactionMetaWithRsv,
        actionId,
        estimatedBaseFee,
        id: random(),
        originalGasEstimate: transactionMeta.txParams.gas,
        originalType: transactionMeta.type,
        rawTx,
        time: Date.now(),
        txParams: newTxParams,
        type: transactionType,
    };
    const hash = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_publishTransactionForRetry).call(this, {
        ...newTransactionMeta,
        origin: label,
    });
    newTransactionMeta.hash = hash;
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_addMetadata).call(this, newTransactionMeta);
    // speedUpTransaction has no approval request, so we assume the user has already approved the transaction
    this.messenger.publish(`${controllerName}:transactionApproved`, {
        transactionMeta: newTransactionMeta,
        actionId,
    });
    this.messenger.publish(`${controllerName}:transactionSubmitted`, {
        transactionMeta: newTransactionMeta,
        actionId,
    });
    afterSubmit?.(newTransactionMeta);
}, _TransactionController_signExternalTransaction = async function _TransactionController_signExternalTransaction(chainId, transactionParams) {
    if (!__classPrivateFieldGet(this, _TransactionController_sign, "f")) {
        throw new Error('No sign method defined.');
    }
    const normalizedTransactionParams = normalizeTransactionParams(transactionParams);
    const type = isEIP1559Transaction(normalizedTransactionParams)
        ? TransactionEnvelopeType.feeMarket
        : TransactionEnvelopeType.legacy;
    const updatedTransactionParams = {
        ...normalizedTransactionParams,
        type,
        gasLimit: normalizedTransactionParams.gas,
        chainId,
    };
    const { from } = updatedTransactionParams;
    const unsignedTransaction = prepareTransaction(chainId, updatedTransactionParams);
    const signedTransaction = await __classPrivateFieldGet(this, _TransactionController_sign, "f").call(this, unsignedTransaction, from);
    const rawTransaction = serializeTransaction(signedTransaction);
    return rawTransaction;
}, _TransactionController_addMetadata = function _TransactionController_addMetadata(transactionMeta) {
    validateTxParams(transactionMeta.txParams);
    this.update((state) => {
        state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, [
            ...state.transactions,
            transactionMeta,
        ]);
    });
}, _TransactionController_updateGasProperties = async function _TransactionController_updateGasProperties(transactionMeta, { traceContext } = {}) {
    const isEIP1559Compatible = transactionMeta.txParams.type !== TransactionEnvelopeType.legacy &&
        (await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getEIP1559Compatibility).call(this, transactionMeta.networkClientId));
    await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Update Gas', parentContext: traceContext }, async () => {
        await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateGasEstimate).call(this, transactionMeta);
    });
    await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Update Gas Fees', parentContext: traceContext }, async () => await updateGasFees({
        eip1559: isEIP1559Compatible,
        gasFeeFlows: __classPrivateFieldGet(this, _TransactionController_gasFeeFlows, "f"),
        getGasFeeEstimates: __classPrivateFieldGet(this, _TransactionController_getGasFeeEstimates, "f"),
        getSavedGasFees: __classPrivateFieldGet(this, _TransactionController_getSavedGasFees, "f").bind(this),
        messenger: this.messenger,
        txMeta: transactionMeta,
    }));
    await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Update Layer 1 Gas Fees', parentContext: traceContext }, async () => await updateTransactionLayer1GasFee({
        layer1GasFeeFlows: __classPrivateFieldGet(this, _TransactionController_layer1GasFeeFlows, "f"),
        messenger: this.messenger,
        transactionMeta,
    }));
}, _TransactionController_onBootCleanup = function _TransactionController_onBootCleanup() {
    this.clearUnapprovedTransactions();
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failIncompleteTransactions).call(this);
}, _TransactionController_failIncompleteTransactions = function _TransactionController_failIncompleteTransactions() {
    const incompleteTransactions = this.state.transactions.filter((transaction) => [TransactionStatus.approved, TransactionStatus.signed].includes(transaction.status));
    for (const transactionMeta of incompleteTransactions) {
        const requiredTransactionIds = transactionMeta.requiredTransactionIds ?? [];
        const allRequiredConfirmed = requiredTransactionIds.length > 0 &&
            requiredTransactionIds.every((id) => {
                const tx = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, id);
                return tx?.status === TransactionStatus.confirmed;
            });
        const message = allRequiredConfirmed
            ? 'Transaction incomplete at startup with all required transactions confirmed'
            : 'Transaction incomplete at startup';
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, transactionMeta, new Error(message));
        for (const requiredTransactionId of requiredTransactionIds) {
            const requiredTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, requiredTransactionId);
            if (!requiredTransactionMeta ||
                __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isFinalState).call(this, requiredTransactionMeta.status)) {
                continue;
            }
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, requiredTransactionMeta, new Error('Parent transaction incomplete at startup'));
        }
    }
}, _TransactionController_processApproval = async function _TransactionController_processApproval(transactionMeta, { actionId, publishHook, requireApproval, shouldShowRequest = true, traceContext, }) {
    const { id: transactionId, isStateOnly } = transactionMeta;
    if (isStateOnly) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId, skipValidation: true }, (tx) => {
            tx.status = TransactionStatus.submitted;
            tx.submittedTime = new Date().getTime();
        });
        return '';
    }
    let resultCallbacks;
    const { meta, isCompleted } = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isTransactionCompleted).call(this, transactionId);
    const finishedPromise = isCompleted
        ? Promise.resolve(meta)
        : __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_waitForTransactionFinished).call(this, transactionId);
    if (meta && !isCompleted) {
        try {
            if (requireApproval !== false) {
                const acceptResult = await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Await Approval', parentContext: traceContext }, (context) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_requestApproval).call(this, transactionMeta, {
                    shouldShowRequest,
                    traceContext: context,
                }));
                resultCallbacks = acceptResult.resultCallbacks;
                const approvalValue = acceptResult.value;
                const updatedTransaction = approvalValue?.txMeta;
                if (updatedTransaction) {
                    log('Updating transaction with approval data', {
                        customNonce: updatedTransaction.customNonceValue,
                        params: updatedTransaction.txParams,
                    });
                    this.updateTransaction(updatedTransaction, 'TransactionController#processApproval - Updated with approval data');
                }
            }
            const { isCompleted: isTxCompleted } = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isTransactionCompleted).call(this, transactionId);
            if (!isTxCompleted) {
                const approvalResult = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_approveTransaction).call(this, transactionId, traceContext, publishHook);
                if (approvalResult === ApprovalState.SkippedViaBeforePublishHook &&
                    resultCallbacks) {
                    resultCallbacks.success();
                }
                const updatedTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
                if (approvalResult === ApprovalState.Approved) {
                    this.messenger.publish(`${controllerName}:transactionApproved`, {
                        transactionMeta: updatedTransactionMeta,
                        actionId,
                    });
                }
            }
        }
        catch (rawError) {
            const error = rawError;
            const { isCompleted: isTxCompleted } = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isTransactionCompleted).call(this, transactionId);
            if (!isTxCompleted) {
                if (__classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isRejectError).call(this, error)) {
                    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_rejectTransactionAndThrow).call(this, transactionId, actionId, error);
                }
                else {
                    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, meta, error, actionId);
                }
            }
        }
        finally {
            __classPrivateFieldGet(this, _TransactionController_skipSimulationTransactionIds, "f").delete(transactionId);
        }
    }
    const finalMeta = await finishedPromise;
    switch (finalMeta?.status) {
        case TransactionStatus.failed: {
            const error = finalMeta.error;
            resultCallbacks?.error(error);
            throw rpcErrors.internal(error.message);
        }
        case TransactionStatus.submitted:
            resultCallbacks?.success();
            return finalMeta.hash;
        default: {
            const internalError = rpcErrors.internal(`MetaMask Tx Signature: Unknown problem: ${JSON.stringify(finalMeta ?? transactionId)}`);
            resultCallbacks?.error(internalError);
            throw internalError;
        }
    }
}, _TransactionController_approveTransaction = 
/**
 * Approves a transaction and updates it's status in state. If this is not a
 * retry transaction, a nonce will be generated. The transaction is signed
 * using the sign configuration property, then published to the blockchain.
 * A `<tx.id>:finished` hub event is fired after success or failure.
 *
 * @param transactionId - The ID of the transaction to approve.
 * @param traceContext - The parent context for any new traces.
 * @param publishHookOverride - Custom logic to publish the transaction.
 * @returns The state of the approval.
 */
async function _TransactionController_approveTransaction(transactionId, traceContext, publishHookOverride) {
    let clearApprovingTransactionId;
    let clearNonceLock;
    let transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
    log('Approving transaction', transactionMeta);
    try {
        if (!__classPrivateFieldGet(this, _TransactionController_sign, "f")) {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, transactionMeta, new Error('No sign method defined.'));
            return ApprovalState.NotApproved;
        }
        else if (!transactionMeta.chainId) {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, transactionMeta, new Error('No chainId defined.'));
            return ApprovalState.NotApproved;
        }
        if (__classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").has(transactionId)) {
            log('Skipping approval as signing in progress', transactionId);
            return ApprovalState.NotApproved;
        }
        __classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").add(transactionId);
        clearApprovingTransactionId = () => __classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").delete(transactionId);
        const { networkClientId } = transactionMeta;
        const [nonce, releaseNonce] = await getNextNonce(transactionMeta, (address) => __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").getNonceLock(address, transactionMeta.networkClientId));
        clearNonceLock = releaseNonce;
        // eslint-disable-next-line require-atomic-updates
        transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
        }, (draftTxMeta) => {
            const { chainId, txParams } = draftTxMeta;
            const { gas, type } = txParams;
            draftTxMeta.status = TransactionStatus.approved;
            draftTxMeta.txParams.chainId = chainId;
            draftTxMeta.txParams.gasLimit = gas;
            draftTxMeta.txParams.nonce = nonce;
            if (!type && isEIP1559Transaction(txParams)) {
                draftTxMeta.txParams.type = TransactionEnvelopeType.feeMarket;
            }
        });
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, transactionMeta);
        const rawTx = await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Sign', parentContext: traceContext }, () => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_signTransaction).call(this, transactionMeta));
        // eslint-disable-next-line require-atomic-updates
        transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
        if (!(await __classPrivateFieldGet(this, _TransactionController_beforePublish, "f").call(this, transactionMeta))) {
            log('Skipping publishing transaction based on hook');
            this.messenger.publish(`${controllerName}:transactionPublishingSkipped`, transactionMeta);
            return ApprovalState.SkippedViaBeforePublishHook;
        }
        if (!rawTx && !transactionMeta.isExternalSign) {
            return ApprovalState.NotApproved;
        }
        let preTxBalance;
        const shouldUpdatePreTxBalance = transactionMeta.type === TransactionType.swap;
        if (shouldUpdatePreTxBalance) {
            log('Determining pre-transaction balance');
            preTxBalance = (await rpcRequest({
                messenger: this.messenger,
                networkClientId,
                method: 'eth_getBalance',
                params: [transactionMeta.txParams.from, 'latest'],
            }));
        }
        log('Publishing transaction', transactionMeta.txParams);
        clearNonceLock?.();
        clearNonceLock = undefined;
        let publishHook = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_defaultPublishHook).bind(this, {
            networkClientId,
            publishHookOverride,
            traceContext,
        });
        if (transactionMeta.batchTransactions?.length) {
            log('Found batch transactions', transactionMeta.batchTransactions);
            const extraTransactionsPublishHook = new ExtraTransactionsPublishHook({
                addTransactionBatch: this.addTransactionBatch.bind(this),
                getTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).bind(this),
                originalPublishHook: publishHook,
            });
            publishHook = extraTransactionsPublishHook.getHook();
        }
        const { transactionHash: hash } = await publishHook(transactionMeta, rawTx ?? '0x');
        // eslint-disable-next-line require-atomic-updates
        transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId,
        }, (draftTxMeta) => {
            draftTxMeta.hash = hash;
            draftTxMeta.status = TransactionStatus.submitted;
            draftTxMeta.submittedTime = new Date().getTime();
            if (shouldUpdatePreTxBalance) {
                draftTxMeta.preTxBalance = preTxBalance;
                log('Updated pre-transaction balance', preTxBalance);
            }
        });
        this.messenger.publish(`${controllerName}:transactionSubmitted`, {
            transactionMeta,
        });
        this.messenger.publish(`${controllerName}:transactionFinished`, transactionMeta);
        __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").emit(`${transactionId}:finished`, transactionMeta);
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, transactionMeta);
        return ApprovalState.Approved;
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (error) {
        if (__classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isRejectError).call(this, error)) {
            // If user rejected signing on the hardware wallet, preserve rejection semantics.
            // `#processApproval` is responsible for turning this into a `rejected` tx and
            // throwing the normalized `userRejectedRequest` (4001) error.
            throw providerErrors.userRejectedRequest({
                message: 'MetaMask Tx Signature: User denied transaction signature.',
                data: error?.data,
            });
        }
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).call(this, transactionMeta, error);
        return ApprovalState.NotApproved;
    }
    finally {
        clearApprovingTransactionId?.();
        clearNonceLock?.();
    }
}, _TransactionController_publishTransaction = async function _TransactionController_publishTransaction(transactionMeta, { skipSubmitHistory } = {}) {
    try {
        const { networkClientId, rawTx } = transactionMeta;
        if (!rawTx) {
            throw new Error('Missing raw transaction');
        }
        const transactionHash = (await rpcRequest({
            messenger: this.messenger,
            networkClientId,
            method: 'eth_sendRawTransaction',
            params: [rawTx],
        }));
        if (skipSubmitHistory !== true) {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateSubmitHistory).call(this, transactionMeta, transactionHash);
        }
        return transactionHash;
    }
    catch (error) {
        const errorObject = error;
        const errorMessage = errorObject?.data?.message ?? errorObject?.message ?? String(error);
        throw new Error(errorMessage);
    }
}, _TransactionController_rejectTransaction = function _TransactionController_rejectTransaction(transactionId, actionId, error) {
    const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    if (!transactionMeta) {
        return;
    }
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_deleteTransaction).call(this, transactionId);
    const updatedTransactionMeta = {
        ...transactionMeta,
        status: TransactionStatus.rejected,
        error: normalizeTxError(error ?? providerErrors.userRejectedRequest()),
    };
    this.messenger.publish(`${controllerName}:transactionFinished`, updatedTransactionMeta);
    __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").emit(`${transactionMeta.id}:finished`, updatedTransactionMeta);
    this.messenger.publish(`${controllerName}:transactionRejected`, {
        transactionMeta: updatedTransactionMeta,
        actionId,
    });
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, updatedTransactionMeta);
}, _TransactionController_trimTransactionsForState = function _TransactionController_trimTransactionsForState(transactions) {
    const nonceNetworkSet = new Set();
    const transactionHistoryLimit = getTransactionHistoryLimit(this.messenger);
    const txsToKeep = [...transactions]
        .sort((a, b) => (a.time > b.time ? -1 : 1)) // Descending time order
        .filter((tx) => {
        const { chainId, status, txParams, time } = tx;
        if (txParams) {
            const key = `${String(txParams.nonce)}-${convertHexToDecimal(chainId)}-${new Date(time).toDateString()}`;
            if (nonceNetworkSet.has(key)) {
                return true;
            }
            else if (nonceNetworkSet.size < transactionHistoryLimit ||
                !__classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isFinalState).call(this, status)) {
                nonceNetworkSet.add(key);
                return true;
            }
        }
        return false;
    });
    txsToKeep.reverse(); // Ascending time order
    return txsToKeep;
}, _TransactionController_isFinalState = function _TransactionController_isFinalState(status) {
    return (status === TransactionStatus.rejected ||
        status === TransactionStatus.confirmed ||
        status === TransactionStatus.failed ||
        status === TransactionStatus.dropped);
}, _TransactionController_isLocalFinalState = function _TransactionController_isLocalFinalState(status) {
    return [
        TransactionStatus.confirmed,
        TransactionStatus.failed,
        TransactionStatus.rejected,
        TransactionStatus.submitted,
    ].includes(status);
}, _TransactionController_requestApproval = async function _TransactionController_requestApproval(txMeta, { shouldShowRequest, traceContext, }) {
    const id = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getApprovalId).call(this, txMeta);
    const { origin } = txMeta;
    const type = ApprovalType.Transaction;
    const requestData = { txId: txMeta.id };
    await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, {
        name: 'Notification Display',
        id,
        parentContext: traceContext,
    });
    return (await this.messenger.call('ApprovalController:addRequest', {
        id,
        origin: origin ?? ORIGIN_METAMASK,
        type,
        requestData,
        expectsResult: true,
    }, shouldShowRequest));
}, _TransactionController_getTransaction = function _TransactionController_getTransaction(transactionId) {
    const { transactions } = this.state;
    return transactions.find(({ id }) => id === transactionId);
}, _TransactionController_getTransactionOrThrow = function _TransactionController_getTransactionOrThrow(transactionId, errorMessagePrefix = 'TransactionController') {
    const txMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    if (!txMeta) {
        throw new Error(`${errorMessagePrefix}: No transaction found with id ${transactionId}`);
    }
    return txMeta;
}, _TransactionController_getApprovalId = function _TransactionController_getApprovalId(txMeta) {
    return String(txMeta.id);
}, _TransactionController_isTransactionCompleted = function _TransactionController_isTransactionCompleted(transactionId) {
    const transaction = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    if (!transaction) {
        return { meta: undefined, isCompleted: false };
    }
    const isCompleted = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isLocalFinalState).call(this, transaction.status);
    return { meta: transaction, isCompleted };
}, _TransactionController_onIncomingTransactions = function _TransactionController_onIncomingTransactions(transactions) {
    if (!transactions.length) {
        return;
    }
    const finalTransactions = [];
    for (const tx of transactions) {
        const { chainId } = tx;
        try {
            const networkClientId = getNetworkClientId({
                messenger: this.messenger,
                chainId,
            });
            finalTransactions.push({
                ...tx,
                networkClientId,
            });
        }
        catch (error) {
            log('Failed to get network client ID for incoming transaction', {
                chainId,
                error,
            });
        }
    }
    this.update((state) => {
        const { transactions: currentTransactions } = state;
        state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, [
            ...finalTransactions,
            ...currentTransactions,
        ]);
        log('Added incoming transactions to state', finalTransactions.length, finalTransactions);
    });
    this.messenger.publish(`${controllerName}:incomingTransactionsReceived`, finalTransactions);
}, _TransactionController_generateDappSuggestedGasFees = function _TransactionController_generateDappSuggestedGasFees(txParams, origin) {
    if (!origin || origin === ORIGIN_METAMASK) {
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
}, _TransactionController_addExternalTransaction = function _TransactionController_addExternalTransaction(transactionMeta) {
    const { chainId } = transactionMeta;
    const { transactions } = this.state;
    const fromAddress = transactionMeta?.txParams?.from;
    const sameFromAndNetworkTransactions = transactions.filter((transaction) => transaction.txParams.from === fromAddress &&
        transaction.chainId === chainId);
    const confirmedTxs = sameFromAndNetworkTransactions.filter((transaction) => transaction.status === TransactionStatus.confirmed);
    const pendingTxs = sameFromAndNetworkTransactions.filter((transaction) => transaction.status === TransactionStatus.submitted);
    validateConfirmedExternalTransaction(transactionMeta, confirmedTxs, pendingTxs);
    this.update((state) => {
        state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, [
            ...state.transactions,
            transactionMeta,
        ]);
    });
    return transactionMeta;
}, _TransactionController_markNonceDuplicatesDropped = function _TransactionController_markNonceDuplicatesDropped(transactionId) {
    const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    if (!transactionMeta) {
        return;
    }
    const nonce = transactionMeta.txParams?.nonce;
    const from = transactionMeta.txParams?.from;
    const { chainId } = transactionMeta;
    const sameNonceTransactions = this.state.transactions.filter((transaction) => transaction.id !== transactionId &&
        transaction.txParams.from === from &&
        nonce &&
        transaction.txParams.nonce === nonce &&
        transaction.chainId === chainId &&
        transaction.type !== TransactionType.incoming &&
        transaction.isTransfer === undefined);
    const sameNonceTransactionIds = sameNonceTransactions.map((transaction) => transaction.id);
    if (sameNonceTransactions.length === 0) {
        return;
    }
    this.update((state) => {
        for (const transaction of state.transactions) {
            if (sameNonceTransactionIds.includes(transaction.id)) {
                transaction.replacedBy = transactionMeta?.hash;
                transaction.replacedById = transactionMeta?.id;
            }
        }
    });
    for (const transaction of this.state.transactions) {
        if (sameNonceTransactionIds.includes(transaction.id) &&
            transaction.status !== TransactionStatus.failed) {
            __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_setTransactionStatusDropped).call(this, transaction);
        }
    }
}, _TransactionController_setTransactionStatusDropped = function _TransactionController_setTransactionStatusDropped(transactionMeta) {
    const updatedTransactionMeta = {
        ...transactionMeta,
        status: TransactionStatus.dropped,
    };
    this.messenger.publish(`${controllerName}:transactionDropped`, {
        transactionMeta: updatedTransactionMeta,
    });
    this.updateTransaction(updatedTransactionMeta, 'TransactionController#setTransactionStatusDropped - Transaction dropped');
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, updatedTransactionMeta);
}, _TransactionController_waitForTransactionFinished = async function _TransactionController_waitForTransactionFinished(transactionId) {
    return new Promise((resolve) => {
        __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").once(`${transactionId}:finished`, (txMeta) => {
            resolve(txMeta);
        });
    });
}, _TransactionController_updateTransactionMetaRSV = function _TransactionController_updateTransactionMetaRSV(transactionMeta, signedTx) {
    const transactionMetaWithRsv = cloneDeep(transactionMeta);
    for (const key of ['r', 's', 'v']) {
        const value = signedTx[key];
        if (value === undefined || value === null) {
            continue;
        }
        transactionMetaWithRsv[key] = add0x(value.toString(16));
    }
    return transactionMetaWithRsv;
}, _TransactionController_getEIP1559Compatibility = async function _TransactionController_getEIP1559Compatibility(networkClientId) {
    const currentNetworkIsEIP1559Compatible = await __classPrivateFieldGet(this, _TransactionController_getCurrentNetworkEIP1559Compatibility, "f").call(this, networkClientId);
    const currentAccountIsEIP1559Compatible = await __classPrivateFieldGet(this, _TransactionController_getCurrentAccountEIP1559Compatibility, "f").call(this);
    return (currentNetworkIsEIP1559Compatible && currentAccountIsEIP1559Compatible);
}, _TransactionController_signTransaction = async function _TransactionController_signTransaction(originalTransactionMeta) {
    let transactionMeta = originalTransactionMeta;
    const { id: transactionId } = transactionMeta;
    log('Calling before sign hook', transactionMeta);
    const { updateTransaction } = (await __classPrivateFieldGet(this, _TransactionController_beforeSign, "f").call(this, { transactionMeta })) ?? {};
    if (updateTransaction) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId, skipResimulateCheck: true }, updateTransaction);
        log('Updated transaction after before sign hook');
    }
    transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
    const { networkClientId } = transactionMeta;
    await checkGasFeeTokenBeforePublish({
        messenger: this.messenger,
        networkClientId,
        fetchGasFeeTokens: async (tx) => (await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getGasFeeTokens).call(this, tx)).gasFeeTokens,
        transaction: transactionMeta,
        updateTransaction: (txId, fn) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId: txId }, fn),
    });
    transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
    const { chainId, isExternalSign, txParams } = transactionMeta;
    if (isExternalSign) {
        log('Skipping sign as signed externally');
        return undefined;
    }
    const { authorizationList, from } = txParams;
    const signedAuthorizationList = await signAuthorizationList({
        authorizationList,
        messenger: this.messenger,
        transactionMeta,
    });
    if (signedAuthorizationList) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId }, (txMeta) => {
            txMeta.txParams.authorizationList = signedAuthorizationList;
        });
    }
    transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
    const finalTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransactionOrThrow).call(this, transactionId);
    const { txParams: finalTxParams } = finalTransactionMeta;
    const unsignedEthTx = prepareTransaction(chainId, finalTxParams);
    __classPrivateFieldGet(this, _TransactionController_approvingTransactionIds, "f").add(transactionId);
    log('Signing transaction', finalTxParams);
    const signedTx = await new Promise((resolve, reject) => {
        __classPrivateFieldGet(this, _TransactionController_sign, "f")?.call(this, unsignedEthTx, from, ...__classPrivateFieldGet(this, _TransactionController_getAdditionalSignArguments, "f").call(this, finalTransactionMeta)).then(resolve, reject);
        __classPrivateFieldGet(this, _TransactionController_signAbortCallbacks, "f").set(transactionId, () => reject(new Error('Signing aborted by user')));
    });
    __classPrivateFieldGet(this, _TransactionController_signAbortCallbacks, "f").delete(transactionId);
    if (!signedTx) {
        log('Skipping signed status as no signed transaction');
        return undefined;
    }
    const transactionMetaFromHook = cloneDeep(finalTransactionMeta);
    if (!__classPrivateFieldGet(this, _TransactionController_afterSign, "f").call(this, transactionMetaFromHook, signedTx)) {
        this.updateTransaction(transactionMetaFromHook, 'TransactionController#signTransaction - Update after sign');
        log('Skipping signed status based on hook');
        return undefined;
    }
    const transactionMetaWithRsv = {
        ...__classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionMetaRSV).call(this, transactionMetaFromHook, signedTx),
        status: TransactionStatus.signed,
        txParams: finalTxParams,
    };
    this.updateTransaction(transactionMetaWithRsv, 'TransactionController#approveTransaction - Transaction signed');
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, transactionMetaWithRsv);
    const rawTx = serializeTransaction(signedTx);
    const transactionMetaWithRawTx = merge({}, transactionMetaWithRsv, {
        rawTx,
    });
    this.updateTransaction(transactionMetaWithRawTx, 'TransactionController#approveTransaction - RawTransaction added');
    return rawTx;
}, _TransactionController_onTransactionStatusChange = function _TransactionController_onTransactionStatusChange(transactionMeta) {
    this.messenger.publish(`${controllerName}:transactionStatusUpdated`, {
        transactionMeta,
    });
}, _TransactionController_getNonceTrackerTransactions = function _TransactionController_getNonceTrackerTransactions(statuses, address, chainId) {
    return getAndFormatTransactionsForNonceTracker(chainId, address, statuses, this.state.transactions);
}, _TransactionController_onConfirmedTransaction = function _TransactionController_onConfirmedTransaction(transactionMeta) {
    log('Processing confirmed transaction', transactionMeta.id);
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_markNonceDuplicatesDropped).call(this, transactionMeta.id);
    this.messenger.publish(`${controllerName}:transactionConfirmed`, transactionMeta);
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, transactionMeta);
    // Intentional given potential duration of process.
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updatePostBalance).call(this, transactionMeta).catch((error) => {
        log('Error while updating post balance', error);
        throw error;
    });
}, _TransactionController_updatePostBalance = async function _TransactionController_updatePostBalance(transactionMeta) {
    try {
        const { networkClientId, type } = transactionMeta;
        if (type !== TransactionType.swap) {
            return;
        }
        const { updatedTransactionMeta, approvalTransactionMeta } = await updatePostTransactionBalance(transactionMeta, {
            messenger: this.messenger,
            networkClientId,
            getTransaction: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).bind(this),
            updateTransaction: this.updateTransaction.bind(this),
        });
        this.messenger.publish(`${controllerName}:postTransactionBalanceUpdated`, {
            transactionMeta: updatedTransactionMeta,
            approvalTransactionMeta,
        });
    }
    catch (error) {
        /* istanbul ignore next */
        log('Error while updating post transaction balance', error);
    }
}, _TransactionController_createNonceTracker = function _TransactionController_createNonceTracker({ provider, blockTracker, chainId, }) {
    return new NonceTracker({
        // TODO: Fix types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        provider: provider,
        // TODO: Fix types
        blockTracker,
        getPendingTransactions: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getNonceTrackerPendingTransactions).bind(this, chainId),
        getConfirmedTransactions: __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getNonceTrackerTransactions).bind(this, [TransactionStatus.confirmed], chainId),
    });
}, _TransactionController_createPendingTransactionTracker = function _TransactionController_createPendingTransactionTracker({ blockTracker, networkClientId, }) {
    const chainId = getChainId({ messenger: this.messenger, networkClientId });
    const pendingTransactionTracker = new PendingTransactionTracker({
        blockTracker,
        getGlobalLock: () => __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").acquireNonceLockForChainIdKey({
            chainId,
        }),
        getTransactions: () => this.state.transactions,
        hooks: {
            beforeCheckPendingTransaction: __classPrivateFieldGet(this, _TransactionController_beforeCheckPendingTransaction, "f").bind(this),
        },
        isResubmitEnabled: __classPrivateFieldGet(this, _TransactionController_pendingTransactionOptions, "f").isResubmitEnabled,
        isTimeoutEnabled: __classPrivateFieldGet(this, _TransactionController_isTimeoutEnabled, "f"),
        messenger: this.messenger,
        networkClientId,
        publishTransaction: (transactionMeta) => __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_publishTransaction).call(this, transactionMeta, {
            skipSubmitHistory: true,
        }),
    });
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_addPendingTransactionTrackerListeners).call(this, pendingTransactionTracker);
    return pendingTransactionTracker;
}, _TransactionController_stopAllTracking = function _TransactionController_stopAllTracking() {
    __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").stopAllTracking();
}, _TransactionController_addIncomingTransactionHelperListeners = function _TransactionController_addIncomingTransactionHelperListeners(incomingTransactionHelper) {
    incomingTransactionHelper.hub.on('transactions', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onIncomingTransactions).bind(this));
}, _TransactionController_removePendingTransactionTrackerListeners = function _TransactionController_removePendingTransactionTrackerListeners(pendingTransactionTracker) {
    pendingTransactionTracker.hub.removeAllListeners('transaction-confirmed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-dropped');
    pendingTransactionTracker.hub.removeAllListeners('transaction-failed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-updated');
}, _TransactionController_addPendingTransactionTrackerListeners = function _TransactionController_addPendingTransactionTrackerListeners(pendingTransactionTracker) {
    pendingTransactionTracker.hub.on('transaction-confirmed', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onConfirmedTransaction).bind(this));
    pendingTransactionTracker.hub.on('transaction-dropped', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_setTransactionStatusDropped).bind(this));
    pendingTransactionTracker.hub.on('transaction-failed', __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_failTransaction).bind(this));
    pendingTransactionTracker.hub.on('transaction-updated', this.updateTransaction.bind(this));
}, _TransactionController_getNonceTrackerPendingTransactions = function _TransactionController_getNonceTrackerPendingTransactions(chainId, address) {
    const standardPendingTransactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getNonceTrackerTransactions).call(this, [
        TransactionStatus.approved,
        TransactionStatus.signed,
        TransactionStatus.submitted,
    ], address, chainId);
    const externalPendingTransactions = __classPrivateFieldGet(this, _TransactionController_getExternalPendingTransactions, "f").call(this, address, chainId);
    return [...standardPendingTransactions, ...externalPendingTransactions];
}, _TransactionController_publishTransactionForRetry = async function _TransactionController_publishTransactionForRetry(transactionMeta) {
    try {
        return await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_publishTransaction).call(this, transactionMeta);
    }
    catch (error) {
        if (__classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_isTransactionAlreadyConfirmedError).call(this, error)) {
            throw new Error('Previous transaction is already confirmed');
        }
        throw error;
    }
}, _TransactionController_isTransactionAlreadyConfirmedError = function _TransactionController_isTransactionAlreadyConfirmedError(error) {
    return (Boolean(error?.message?.includes('nonce too low')) ||
        Boolean(error?.data?.message?.includes('nonce too low')));
}, _TransactionController_getGasFeeFlows = function _TransactionController_getGasFeeFlows() {
    if (__classPrivateFieldGet(this, _TransactionController_testGasFeeFlows, "f")) {
        return [new TestGasFeeFlow()];
    }
    return [
        new RandomisedEstimationsGasFeeFlow(),
        new LineaGasFeeFlow(),
        new DefaultGasFeeFlow(),
    ];
}, _TransactionController_getLayer1GasFeeFlows = function _TransactionController_getLayer1GasFeeFlows() {
    return [new OptimismLayer1GasFeeFlow(), new ScrollLayer1GasFeeFlow()];
}, _TransactionController_updateTransactionInternal = function _TransactionController_updateTransactionInternal({ transactionId, skipValidation, skipResimulateCheck, }, callback) {
    let resimulateResponse;
    this.update((state) => {
        const index = state.transactions.findIndex(({ id }) => id === transactionId);
        if (index === -1) {
            throw new Error(`Cannot update transaction as ID not found - ${transactionId}`);
        }
        let transactionMeta = state.transactions[index];
        const originalTransactionMeta = cloneDeep(transactionMeta);
        transactionMeta = callback(transactionMeta) ?? transactionMeta;
        if (skipValidation !== true) {
            transactionMeta.txParams = normalizeTransactionParams(transactionMeta.txParams);
            validateTxParams(transactionMeta.txParams);
        }
        if (!skipResimulateCheck && __classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f").call(this)) {
            resimulateResponse = shouldResimulate(originalTransactionMeta, transactionMeta);
        }
        state.transactions[index] = transactionMeta;
    });
    const transactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    if (resimulateResponse?.resimulate) {
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateSimulationData).call(this, transactionMeta, {
            blockTime: resimulateResponse.blockTime,
        }).catch((error) => {
            log('Error during re-simulation', error);
            throw error;
        });
    }
    return transactionMeta;
}, _TransactionController_updateSimulationData = async function _TransactionController_updateSimulationData(transactionMeta, { blockTime, traceContext, } = {}) {
    const { chainId, id: transactionId, nestedTransactions, networkClientId, simulationData: prevSimulationData, txParams, } = transactionMeta;
    let simulationData = {
        error: {
            code: SimulationErrorCode.Disabled,
            message: 'Simulation disabled',
        },
        tokenBalanceChanges: [],
    };
    let gasUsed;
    let gasFeeTokens = [];
    let isGasFeeSponsored = false;
    const isBalanceChangesSkipped = __classPrivateFieldGet(this, _TransactionController_skipSimulationTransactionIds, "f").has(transactionId);
    if (__classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f").call(this) && !isBalanceChangesSkipped) {
        const balanceChangesResult = await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Simulate', parentContext: traceContext }, () => getBalanceChanges({
            blockTime,
            chainId,
            messenger: this.messenger,
            networkClientId,
            getSimulationConfig: (url, opts) => {
                return __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f").call(this, url, {
                    txMeta: transactionMeta,
                    ...opts,
                });
            },
            nestedTransactions,
            txParams,
        }));
        simulationData = balanceChangesResult.simulationData;
        gasUsed = balanceChangesResult.gasUsed;
        if (blockTime &&
            prevSimulationData &&
            hasSimulationDataChanged(prevSimulationData, simulationData)) {
            simulationData = {
                ...simulationData,
                isUpdatedAfterSecurityCheck: true,
            };
        }
        const gasFeeTokensResponse = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getGasFeeTokens).call(this, transactionMeta);
        gasFeeTokens = gasFeeTokensResponse?.gasFeeTokens ?? [];
        isGasFeeSponsored = gasFeeTokensResponse?.isGasFeeSponsored ?? false;
    }
    const latestTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_getTransaction).call(this, transactionId);
    /* istanbul ignore if */
    if (!latestTransactionMeta) {
        log('Cannot update simulation data as transaction not found', transactionId, simulationData);
        return;
    }
    const updatedTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
        transactionId,
        skipResimulateCheck: Boolean(blockTime),
    }, (txMeta) => {
        txMeta.gasFeeTokens = gasFeeTokens;
        txMeta.isGasFeeSponsored = isGasFeeSponsored;
        txMeta.gasUsed = gasUsed;
        if (!isBalanceChangesSkipped) {
            txMeta.simulationData = simulationData;
        }
    });
    log('Updated simulation data', transactionId, updatedTransactionMeta);
    await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_runAfterSimulateHook).call(this, updatedTransactionMeta);
}, _TransactionController_onGasFeePollerTransactionUpdate = function _TransactionController_onGasFeePollerTransactionUpdate({ transactionId, gasFeeEstimates, gasFeeEstimatesLoaded, layer1GasFee, }) {
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, { transactionId }, (txMeta) => {
        updateTransactionGasProperties({
            txMeta,
            gasFeeEstimates,
            gasFeeEstimatesLoaded,
            isTxParamsGasFeeUpdatesEnabled: __classPrivateFieldGet(this, _TransactionController_isAutomaticGasFeeUpdateEnabled, "f"),
            layer1GasFee,
        });
    });
}, _TransactionController_onGasFeePollerTransactionBatchUpdate = function _TransactionController_onGasFeePollerTransactionBatchUpdate({ transactionBatchId, gasFeeEstimates, }) {
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionBatch).call(this, transactionBatchId, (batch) => {
        return { ...batch, gasFeeEstimates };
    });
}, _TransactionController_updateTransactionBatch = function _TransactionController_updateTransactionBatch(batchId, callback) {
    this.update((state) => {
        const index = state.transactionBatches.findIndex((b) => b.id === batchId);
        if (index === -1) {
            throw new Error(`Cannot update batch, ID not found - ${batchId}`);
        }
        const batch = state.transactionBatches[index];
        const updated = callback(batch);
        state.transactionBatches[index] = updated ?? batch;
    });
}, _TransactionController_getSelectedAccount = function _TransactionController_getSelectedAccount() {
    return this.messenger.call('AccountsController:getSelectedAccount');
}, _TransactionController_getInternalAccounts = function _TransactionController_getInternalAccounts() {
    const state = this.messenger.call('AccountsController:getState');
    return Object.values(state.internalAccounts?.accounts ?? {})
        .filter((account) => account.type === 'eip155:eoa')
        .map((account) => account.address);
}, _TransactionController_updateSubmitHistory = function _TransactionController_updateSubmitHistory(transactionMeta, hash) {
    const { chainId, networkClientId, origin, rawTx, txParams } = transactionMeta;
    const { networkConfigurationsByChainId } = __classPrivateFieldGet(this, _TransactionController_getNetworkState, "f").call(this);
    const networkConfiguration = networkConfigurationsByChainId[chainId];
    const endpoint = networkConfiguration?.rpcEndpoints.find((currentEndpoint) => currentEndpoint.networkClientId === networkClientId);
    const networkUrl = endpoint?.url;
    const networkType = endpoint?.name ?? networkClientId;
    const submitHistoryEntry = {
        chainId,
        hash,
        networkType,
        networkUrl,
        origin,
        rawTransaction: rawTx,
        time: Date.now(),
        transaction: txParams,
    };
    log('Updating submit history', submitHistoryEntry);
    const submitHistoryLimit = getSubmitHistoryLimit(this.messenger);
    this.update((state) => {
        const { submitHistory } = state;
        if (submitHistory.length >= submitHistoryLimit) {
            submitHistory.pop();
        }
        submitHistory.unshift(submitHistoryEntry);
    });
}, _TransactionController_updateGasEstimate = async function _TransactionController_updateGasEstimate(transactionMeta) {
    const { networkClientId } = transactionMeta;
    const isCustomNetwork = __classPrivateFieldGet(this, _TransactionController_multichainTrackingHelper, "f").getNetworkClient({ networkClientId })
        .configuration.type === NetworkClientType.Custom;
    await updateGas({
        isCustomNetwork,
        isSimulationEnabled: __classPrivateFieldGet(this, _TransactionController_isSimulationEnabled, "f").call(this),
        getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f"),
        messenger: this.messenger,
        txMeta: transactionMeta,
    });
}, _TransactionController_registerActionHandlers = function _TransactionController_registerActionHandlers() {
    this.messenger.registerMethodActionHandlers(this, MESSENGER_EXPOSED_METHODS);
}, _TransactionController_deleteTransaction = function _TransactionController_deleteTransaction(transactionId) {
    this.update((state) => {
        const transactions = state.transactions.filter(({ id }) => id !== transactionId);
        state.transactions = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_trimTransactionsForState).call(this, transactions);
    });
}, _TransactionController_isRejectError = function _TransactionController_isRejectError(error) {
    const rejectionCode = error.code ?? error.cause?.code ?? error.originalError?.code ?? undefined;
    return (rejectionCode === errorCodes.provider.userRejectedRequest ||
        rejectionCode === ErrorCode.RejectedUpgrade ||
        rejectionCode === 'USER_REJECTED' ||
        rejectionCode === 'USER_CANCELLED' ||
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_hasUserRejectedMessage).call(this, error));
}, _TransactionController_rejectTransactionAndThrow = function _TransactionController_rejectTransactionAndThrow(transactionId, actionId, error) {
    const rejectionCode = error.code ?? error.cause?.code ?? error.originalError?.code ?? undefined;
    const isUserRejection = rejectionCode === errorCodes.provider.userRejectedRequest ||
        rejectionCode === 'USER_REJECTED' ||
        rejectionCode === 'USER_CANCELLED' ||
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_hasUserRejectedMessage).call(this, error);
    if (isUserRejection) {
        // Normalize hardware-wallet user rejection semantics to EIP-1193 `userRejectedRequest` (4001).
        const userRejectedError = providerErrors.userRejectedRequest({
            message: 'MetaMask Tx Signature: User denied transaction signature.',
            data: error?.data,
        });
        __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_rejectTransaction).call(this, transactionId, actionId, userRejectedError);
        throw userRejectedError;
    }
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_rejectTransaction).call(this, transactionId, actionId, error);
    throw error;
}, _TransactionController_hasUserRejectedMessage = function _TransactionController_hasUserRejectedMessage(error) {
    const userRejectedRegex = /user denied|user rejected|rejected by user|rejected by the user|user canceled|user cancelled|action canceled|action cancelled|denied transaction signature|failure_actioncancelled|actioncancelled|\bcancelled\b|\bcanceled\b/i;
    const queue = [error];
    const visited = new Set();
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) {
            continue;
        }
        visited.add(current);
        if (typeof current === 'string') {
            if (userRejectedRegex.test(current)) {
                return true;
            }
            continue;
        }
        if (typeof current === 'object') {
            const maybeError = current;
            if (typeof maybeError.message === 'string' &&
                userRejectedRegex.test(maybeError.message)) {
                return true;
            }
            if (typeof maybeError.stack === 'string' &&
                userRejectedRegex.test(maybeError.stack)) {
                return true;
            }
            if (maybeError.cause) {
                queue.push(maybeError.cause);
            }
            if (maybeError.originalError) {
                queue.push(maybeError.originalError);
            }
        }
    }
    return false;
}, _TransactionController_failTransaction = function _TransactionController_failTransaction(transactionMeta, error, actionId) {
    let newTransactionMeta;
    const errorToPersist = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_hasUserRejectedMessage).call(this, error)
        ? providerErrors.userRejectedRequest({
            message: 'MetaMask Tx Signature: User denied transaction signature.',
            data: error?.data,
        })
        : error;
    try {
        newTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
            transactionId: transactionMeta.id,
            skipValidation: true,
        }, (draftTransactionMeta) => {
            draftTransactionMeta.status = TransactionStatus.failed;
            draftTransactionMeta.error = normalizeTxError(errorToPersist);
        });
    }
    catch (caughtError) {
        log('Failed to mark transaction as failed', caughtError);
        newTransactionMeta = {
            ...transactionMeta,
            status: TransactionStatus.failed,
            error: normalizeTxError(errorToPersist),
        };
    }
    this.messenger.publish(`${controllerName}:transactionFailed`, {
        actionId,
        error: errorToPersist.message,
        transactionMeta: newTransactionMeta,
    });
    __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_onTransactionStatusChange).call(this, newTransactionMeta);
    this.messenger.publish(`${controllerName}:transactionFinished`, newTransactionMeta);
    __classPrivateFieldGet(this, _TransactionController_internalEvents, "f").emit(`${transactionMeta.id}:finished`, newTransactionMeta);
}, _TransactionController_runAfterSimulateHook = async function _TransactionController_runAfterSimulateHook(transactionMeta) {
    log('Calling afterSimulate hook', transactionMeta);
    const { id: transactionId } = transactionMeta;
    const result = await __classPrivateFieldGet(this, _TransactionController_afterSimulate, "f").call(this, {
        transactionMeta,
    });
    const { skipSimulation, updateTransaction } = result ?? {};
    if (skipSimulation) {
        __classPrivateFieldGet(this, _TransactionController_skipSimulationTransactionIds, "f").add(transactionId);
    }
    else if (skipSimulation === false) {
        __classPrivateFieldGet(this, _TransactionController_skipSimulationTransactionIds, "f").delete(transactionId);
    }
    if (!updateTransaction) {
        return;
    }
    const updatedTransactionMeta = __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_updateTransactionInternal).call(this, {
        transactionId,
        skipResimulateCheck: true,
    }, (txMeta) => {
        txMeta.txParamsOriginal = cloneDeep(txMeta.txParams);
        updateTransaction(txMeta);
    });
    log('Updated transaction with afterSimulate data', updatedTransactionMeta);
}, _TransactionController_defaultPublishHook = async function _TransactionController_defaultPublishHook({ networkClientId, publishHookOverride, traceContext, }, transactionMeta, signedTx) {
    let transactionHash;
    await __classPrivateFieldGet(this, _TransactionController_trace, "f").call(this, { name: 'Publish', parentContext: traceContext }, async () => {
        const publishHook = publishHookOverride ?? __classPrivateFieldGet(this, _TransactionController_publish, "f");
        ({ transactionHash } = await publishHook(transactionMeta, signedTx));
        // eslint-disable-next-line require-atomic-updates
        transactionHash ?? (transactionHash = await __classPrivateFieldGet(this, _TransactionController_instances, "m", _TransactionController_publishTransaction).call(this, {
            ...transactionMeta,
            networkClientId,
            rawTx: signedTx,
        }));
    });
    log('Publish successful', transactionHash);
    return { transactionHash };
}, _TransactionController_getGasFeeTokens = async function _TransactionController_getGasFeeTokens(transaction) {
    const { chainId } = transaction;
    return await getGasFeeTokens({
        chainId,
        getSimulationConfig: __classPrivateFieldGet(this, _TransactionController_getSimulationConfig, "f"),
        isEIP7702GasFeeTokensEnabled: __classPrivateFieldGet(this, _TransactionController_isEIP7702GasFeeTokensEnabled, "f"),
        messenger: this.messenger,
        publicKeyEIP7702: __classPrivateFieldGet(this, _TransactionController_publicKeyEIP7702, "f"),
        transactionMeta: transaction,
    });
};
//# sourceMappingURL=TransactionController.mjs.map