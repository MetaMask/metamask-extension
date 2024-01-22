/// <reference types="node" />
import { Hardfork } from '@ethereumjs/common';
import type { TypedTransaction } from '@ethereumjs/tx';
import type { AddApprovalRequest } from '@metamask/approval-controller';
import type { BaseConfig, BaseState, RestrictedControllerMessenger } from '@metamask/base-controller';
import { BaseControllerV1 } from '@metamask/base-controller';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type { BlockTracker, NetworkState, Provider } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import { EventEmitter } from 'events';
import type { NonceLock, Transaction as NonceTrackerTransaction } from 'nonce-tracker';
import type { Events, SavedGasFees, SecurityProviderRequest, SendFlowHistoryEntry, TransactionParams, TransactionMeta, TransactionReceipt, WalletDevice, SecurityAlertResponse } from './types';
import { TransactionType, TransactionStatus } from './types';
export declare const HARDFORK = Hardfork.London;
/**
 * @type Result
 * @property result - Promise resolving to a new transaction hash
 * @property transactionMeta - Meta information about this new transaction
 */
export interface Result {
    result: Promise<string>;
    transactionMeta: TransactionMeta;
}
export interface GasPriceValue {
    gasPrice: string;
}
export interface FeeMarketEIP1559Values {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
}
/**
 * @type TransactionConfig
 *
 * Transaction controller configuration
 * @property provider - Provider used to create a new underlying EthQuery instance
 * @property sign - Method used to sign transactions
 */
export interface TransactionConfig extends BaseConfig {
    sign?: (txParams: TransactionParams, from: string) => Promise<any>;
    txHistoryLimit: number;
}
/**
 * @type MethodData
 *
 * Method data registry object
 * @property registryMethod - Registry method raw string
 * @property parsedRegistryMethod - Registry method object, containing name and method arguments
 */
export interface MethodData {
    registryMethod: string;
    parsedRegistryMethod: Record<string, unknown>;
}
/**
 * @type TransactionState
 *
 * Transaction controller state
 * @property transactions - A list of TransactionMeta objects
 * @property methodData - Object containing all known method data information
 */
export interface TransactionState extends BaseState {
    transactions: TransactionMeta[];
    methodData: {
        [key: string]: MethodData;
    };
    lastFetchedBlockNumbers: {
        [key: string]: number;
    };
}
/**
 * Multiplier used to determine a transaction's increased gas fee during cancellation
 */
export declare const CANCEL_RATE = 1.5;
/**
 * Multiplier used to determine a transaction's increased gas fee during speed up
 */
export declare const SPEED_UP_RATE = 1.1;
/**
 * The name of the {@link TransactionController}.
 */
declare const controllerName = "TransactionController";
/**
 * The external actions available to the {@link TransactionController}.
 */
declare type AllowedActions = AddApprovalRequest;
/**
 * The messenger of the {@link TransactionController}.
 */
export declare type TransactionControllerMessenger = RestrictedControllerMessenger<typeof controllerName, AllowedActions, never, AllowedActions['type'], never>;
export interface TransactionControllerEventEmitter extends EventEmitter {
    on<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): this;
    emit<T extends keyof Events>(eventName: T, ...args: Events[T]): boolean;
}
/**
 * Controller responsible for submitting and managing transactions.
 */
export declare class TransactionController extends BaseControllerV1<TransactionConfig, TransactionState> {
    private readonly ethQuery;
    private readonly isHistoryDisabled;
    private readonly isSwapsDisabled;
    private readonly isSendFlowHistoryDisabled;
    private readonly inProcessOfSigning;
    private readonly nonceTracker;
    private readonly registry;
    private readonly provider;
    private readonly mutex;
    private readonly getSavedGasFees;
    private readonly getNetworkState;
    private readonly getCurrentAccountEIP1559Compatibility;
    private readonly getCurrentNetworkEIP1559Compatibility;
    private readonly getGasFeeEstimates;
    private readonly getPermittedAccounts;
    private readonly getSelectedAddress;
    private readonly getExternalPendingTransactions;
    private readonly messagingSystem;
    private readonly incomingTransactionHelper;
    private readonly securityProviderRequest?;
    private readonly pendingTransactionTracker;
    private readonly cancelMultiplier;
    private readonly speedUpMultiplier;
    private readonly afterSign;
    private readonly beforeApproveOnInit;
    private readonly beforeCheckPendingTransaction;
    private readonly beforePublish;
    private readonly publish;
    private readonly getAdditionalSignArguments;
    private failTransaction;
    private registryLookup;
    /**
     * EventEmitter instance used to listen to specific transactional events
     */
    hub: TransactionControllerEventEmitter;
    /**
     * Name of this controller used during composition
     */
    name: string;
    /**
     * Method used to sign transactions
     */
    sign?: (transaction: TypedTransaction, from: string, transactionMeta?: TransactionMeta) => Promise<TypedTransaction>;
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
    constructor({ blockTracker, cancelMultiplier, disableHistory, disableSendFlowHistory, disableSwaps, getCurrentAccountEIP1559Compatibility, getCurrentNetworkEIP1559Compatibility, getExternalPendingTransactions, getGasFeeEstimates, getNetworkState, getPermittedAccounts, getSavedGasFees, getSelectedAddress, incomingTransactions, messenger, onNetworkStateChange, pendingTransactions, provider, securityProviderRequest, speedUpMultiplier, hooks, }: {
        blockTracker: BlockTracker;
        cancelMultiplier?: number;
        disableHistory: boolean;
        disableSendFlowHistory: boolean;
        disableSwaps: boolean;
        getCurrentAccountEIP1559Compatibility?: () => Promise<boolean>;
        getCurrentNetworkEIP1559Compatibility: () => Promise<boolean>;
        getExternalPendingTransactions?: (address: string) => NonceTrackerTransaction[];
        getGasFeeEstimates?: () => Promise<GasFeeState>;
        getNetworkState: () => NetworkState;
        getPermittedAccounts: (origin?: string) => Promise<string[]>;
        getSavedGasFees?: (chainId: Hex) => SavedGasFees | undefined;
        getSelectedAddress: () => string;
        incomingTransactions?: {
            includeTokenTransfers?: boolean;
            isEnabled?: () => boolean;
            queryEntireHistory?: boolean;
            updateTransactions?: boolean;
        };
        messenger: TransactionControllerMessenger;
        onNetworkStateChange: (listener: (state: NetworkState) => void) => void;
        pendingTransactions?: {
            isResubmitEnabled?: boolean;
        };
        provider: Provider;
        securityProviderRequest?: SecurityProviderRequest;
        speedUpMultiplier?: number;
        hooks: {
            afterSign?: (transactionMeta: TransactionMeta, signedTx: TypedTransaction) => boolean;
            beforeApproveOnInit?: (transactionMeta: TransactionMeta) => boolean;
            beforeCheckPendingTransaction?: (transactionMeta: TransactionMeta) => boolean;
            beforePublish?: (transactionMeta: TransactionMeta) => boolean;
            getAdditionalSignArguments?: (transactionMeta: TransactionMeta) => (TransactionMeta | undefined)[];
            publish?: (transactionMeta: TransactionMeta) => Promise<{
                transactionHash: string;
            }>;
        };
    }, config?: Partial<TransactionConfig>, state?: Partial<TransactionState>);
    /**
     * Handle new method data request.
     *
     * @param fourBytePrefix - The method prefix.
     * @returns The method data object corresponding to the given signature prefix.
     */
    handleMethodData(fourBytePrefix: string): Promise<MethodData>;
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
    addTransaction(txParams: TransactionParams, { actionId, deviceConfirmedOn, method, origin, requireApproval, securityAlertResponse, sendFlowHistory, swaps, type, }?: {
        actionId?: string;
        deviceConfirmedOn?: WalletDevice;
        method?: string;
        origin?: string;
        requireApproval?: boolean | undefined;
        securityAlertResponse?: SecurityAlertResponse;
        sendFlowHistory?: SendFlowHistoryEntry[];
        swaps?: {
            hasApproveTx?: boolean;
            meta?: Partial<TransactionMeta>;
        };
        type?: TransactionType;
    }): Promise<Result>;
    startIncomingTransactionPolling(): void;
    stopIncomingTransactionPolling(): void;
    updateIncomingTransactions(): Promise<void>;
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
    stopTransaction(transactionId: string, gasValues?: GasPriceValue | FeeMarketEIP1559Values, { estimatedBaseFee, actionId, }?: {
        estimatedBaseFee?: string;
        actionId?: string;
    }): Promise<void>;
    /**
     * Attempts to speed up a transaction increasing transaction gasPrice by ten percent.
     *
     * @param transactionId - The ID of the transaction to speed up.
     * @param gasValues - The gas values to use for the speed up transaction.
     * @param options - The options for the speed up transaction.
     * @param options.actionId - Unique ID to prevent duplicate requests
     * @param options.estimatedBaseFee - The estimated base fee of the transaction.
     */
    speedUpTransaction(transactionId: string, gasValues?: GasPriceValue | FeeMarketEIP1559Values, { actionId, estimatedBaseFee, }?: {
        actionId?: string;
        estimatedBaseFee?: string;
    }): Promise<void>;
    /**
     * Estimates required gas for a given transaction.
     *
     * @param transaction - The transaction to estimate gas for.
     * @returns The gas and gas price.
     */
    estimateGas(transaction: TransactionParams): Promise<{
        gas: string;
        simulationFails: {
            reason: any;
            errorKey: any;
            debug: {
                blockNumber: string;
                blockGasLimit: string;
            };
        } | undefined;
    }>;
    /**
     * Estimates required gas for a given transaction and add additional gas buffer with the given multiplier.
     *
     * @param transaction - The transaction params to estimate gas for.
     * @param multiplier - The multiplier to use for the gas buffer.
     */
    estimateGasBuffered(transaction: TransactionParams, multiplier: number): Promise<{
        gas: string;
        simulationFails: {
            reason: any;
            errorKey: any;
            debug: {
                blockNumber: string;
                blockGasLimit: string;
            };
        } | undefined;
    }>;
    /**
     * Updates an existing transaction in state.
     *
     * @param transactionMeta - The new transaction to store in state.
     * @param note - A note or update reason to include in the transaction history.
     */
    updateTransaction(transactionMeta: TransactionMeta, note: string): void;
    /**
     * Update the security alert response for a transaction.
     *
     * @param transactionId - ID of the transaction.
     * @param securityAlertResponse - The new security alert response for the transaction.
     */
    updateSecurityAlertResponse(transactionId: string, securityAlertResponse: SecurityAlertResponse): void;
    /**
     * Removes all transactions from state, optionally based on the current network.
     *
     * @param ignoreNetwork - Determines whether to wipe all transactions, or just those on the
     * current network. If `true`, all transactions are wiped.
     * @param address - If specified, only transactions originating from this address will be
     * wiped on current network.
     */
    wipeTransactions(ignoreNetwork?: boolean, address?: string): void;
    startIncomingTransactionProcessing(): void;
    stopIncomingTransactionProcessing(): void;
    /**
     * Adds external provided transaction to state as confirmed transaction.
     *
     * @param transactionMeta - TransactionMeta to add transactions.
     * @param transactionReceipt - TransactionReceipt of the external transaction.
     * @param baseFeePerGas - Base fee per gas of the external transaction.
     */
    confirmExternalTransaction(transactionMeta: TransactionMeta, transactionReceipt: TransactionReceipt, baseFeePerGas: Hex): Promise<void>;
    /**
     * Append new send flow history to a transaction.
     *
     * @param transactionID - The ID of the transaction to update.
     * @param currentSendFlowHistoryLength - The length of the current sendFlowHistory array.
     * @param sendFlowHistoryToAdd - The sendFlowHistory entries to add.
     * @returns The updated transactionMeta.
     */
    updateTransactionSendFlowHistory(transactionID: string, currentSendFlowHistoryLength: number, sendFlowHistoryToAdd: SendFlowHistoryEntry[]): TransactionMeta;
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
    updateTransactionGasFees(transactionId: string, { defaultGasEstimates, estimateUsed, estimateSuggested, gas, gasLimit, gasPrice, maxPriorityFeePerGas, maxFeePerGas, originalGasEstimate, userEditedGasLimit, userFeeLevel, }: {
        defaultGasEstimates?: string;
        estimateUsed?: string;
        estimateSuggested?: string;
        gas?: string;
        gasLimit?: string;
        gasPrice?: string;
        maxPriorityFeePerGas?: string;
        maxFeePerGas?: string;
        originalGasEstimate?: string;
        userEditedGasLimit?: boolean;
        userFeeLevel?: string;
    }): TransactionMeta;
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
    updatePreviousGasParams(transactionId: string, { gasLimit, maxFeePerGas, maxPriorityFeePerGas, }: {
        gasLimit?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
    }): TransactionMeta;
    /**
     * Gets the next nonce according to the nonce-tracker.
     * Ensure `releaseLock` is called once processing of the `nonce` value is complete.
     *
     * @param address - The hex string address for the transaction.
     * @returns object with the `nextNonce` `nonceDetails`, and the releaseLock.
     */
    getNonceLock(address: string): Promise<NonceLock>;
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
    updateEditableParams(txId: string, { data, gas, gasPrice, from, to, value, }: {
        data?: string;
        gas?: string;
        gasPrice?: string;
        from?: string;
        to?: string;
        value?: string;
    }): Promise<TransactionMeta | undefined>;
    /**
     * Signs and returns the raw transaction data for provided transaction params list.
     *
     * @param listOfTxParams - The list of transaction params to approve.
     * @param opts - Options bag.
     * @param opts.hasNonce - Whether the transactions already have a nonce.
     * @returns The raw transactions.
     */
    approveTransactionsWithSameNonce(listOfTxParams?: TransactionParams[], { hasNonce }?: {
        hasNonce?: boolean;
    }): Promise<string | string[]>;
    /**
     * Update a custodial transaction.
     *
     * @param transactionId - The ID of the transaction to update.
     * @param options - The custodial transaction options to update.
     * @param options.errorMessage - The error message to be assigned in case transaction status update to failed.
     * @param options.hash - The new hash value to be assigned.
     * @param options.status - The new status value to be assigned.
     */
    updateCustodialTransaction(transactionId: string, { errorMessage, hash, status, }: {
        errorMessage?: string;
        hash?: string;
        status?: TransactionStatus;
    }): void;
    /**
     * Creates approvals for all unapproved transactions persisted.
     */
    initApprovals(): void;
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
    getTransactions({ searchCriteria, initialList, filterToCurrentNetwork, limit, }?: {
        searchCriteria?: any;
        initialList?: TransactionMeta[];
        filterToCurrentNetwork?: boolean;
        limit?: number;
    }): TransactionMeta[];
    private signExternalTransaction;
    /**
     * Removes unapproved transactions from state.
     */
    clearUnapprovedTransactions(): void;
    private addMetadata;
    private updateGasProperties;
    private getCurrentChainTransactionsByStatus;
    private onBootCleanup;
    /**
     * Force to submit approved transactions on current chain.
     */
    private submitApprovedTransactions;
    private processApproval;
    /**
     * Approves a transaction and updates it's status in state. If this is not a
     * retry transaction, a nonce will be generated. The transaction is signed
     * using the sign configuration property, then published to the blockchain.
     * A `<tx.id>:finished` hub event is fired after success or failure.
     *
     * @param transactionId - The ID of the transaction to approve.
     */
    private approveTransaction;
    private publishTransaction;
    /**
     * Cancels a transaction based on its ID by setting its status to "rejected"
     * and emitting a `<tx.id>:finished` hub event.
     *
     * @param transactionId - The ID of the transaction to cancel.
     * @param actionId - The actionId passed from UI
     */
    private cancelTransaction;
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
    private trimTransactionsForState;
    /**
     * Determines if the transaction is in a final state.
     *
     * @param status - The transaction status.
     * @returns Whether the transaction is in a final state.
     */
    private isFinalState;
    /**
     * Whether the transaction has at least completed all local processing.
     *
     * @param status - The transaction status.
     * @returns Whether the transaction is in a final state.
     */
    private isLocalFinalState;
    private requestApproval;
    private getTransaction;
    private getApprovalId;
    private isTransactionCompleted;
    private getChainId;
    private prepareUnsignedEthTx;
    /**
     * `@ethereumjs/tx` uses `@ethereumjs/common` as a configuration tool for
     * specifying which chain, network, hardfork and EIPs to support for
     * a transaction. By referencing this configuration, and analyzing the fields
     * specified in txParams, @ethereumjs/tx is able to determine which EIP-2718
     * transaction type to use.
     *
     * @returns common configuration object
     */
    private getCommonConfiguration;
    private onIncomingTransactions;
    private onUpdatedLastFetchedBlockNumbers;
    private generateDappSuggestedGasFees;
    /**
     * Validates and adds external provided transaction to state.
     *
     * @param transactionMeta - Nominated external transaction to be added to state.
     */
    private addExternalTransaction;
    /**
     * Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
     * in the transactions have the same nonce.
     *
     * @param transactionId - Used to identify original transaction.
     */
    private markNonceDuplicatesDropped;
    /**
     * Method to set transaction status to dropped.
     *
     * @param transactionMeta - TransactionMeta of transaction to be marked as dropped.
     */
    private setTransactionStatusDropped;
    /**
     * Get transaction with provided actionId.
     *
     * @param actionId - Unique ID to prevent duplicate requests
     * @returns the filtered transaction
     */
    private getTransactionWithActionId;
    private waitForTransactionFinished;
    /**
     * Updates the r, s, and v properties of a TransactionMeta object
     * with values from a signed transaction.
     *
     * @param transactionMeta - The TransactionMeta object to update.
     * @param signedTx - The encompassing type for all transaction types containing r, s, and v values.
     */
    private updateTransactionMetaRSV;
    private getEIP1559Compatibility;
    private addPendingTransactionTrackerListeners;
    private signTransaction;
    private onTransactionStatusChange;
    private getNonceTrackerPendingTransactions;
    private getNonceTrackerTransactions;
    private onConfirmedTransaction;
    private updatePostBalance;
}
export {};
//# sourceMappingURL=TransactionController.d.ts.map