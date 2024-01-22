import type { AccessList } from '@ethereumjs/tx';
import type { Hex } from '@metamask/utils';
import type { Operation } from 'fast-json-patch';
export declare type Events = {
    ['incomingTransactionBlock']: [blockNumber: number];
    ['post-transaction-balance-updated']: [
        {
            transactionMeta: TransactionMeta;
            approvalTransactionMeta?: TransactionMeta;
        }
    ];
    ['transaction-approved']: [
        {
            transactionMeta: TransactionMeta;
            actionId?: string;
        }
    ];
    ['transaction-confirmed']: [{
        transactionMeta: TransactionMeta;
    }];
    ['transaction-dropped']: [{
        transactionMeta: TransactionMeta;
    }];
    ['transaction-failed']: [
        {
            actionId?: string;
            error: string;
            transactionMeta: TransactionMeta;
        }
    ];
    ['transaction-new-swap']: [{
        transactionMeta: TransactionMeta;
    }];
    ['transaction-new-swap-approval']: [{
        transactionMeta: TransactionMeta;
    }];
    ['transaction-rejected']: [
        {
            transactionMeta: TransactionMeta;
            actionId?: string;
        }
    ];
    ['transaction-status-update']: [{
        transactionMeta: TransactionMeta;
    }];
    ['transaction-submitted']: [
        {
            transactionMeta: TransactionMeta;
            actionId?: string;
        }
    ];
    ['unapprovedTransaction']: [transactionMeta: TransactionMeta];
    [key: `${string}:confirmed`]: [transactionMeta: TransactionMeta];
    [key: `${string}:finished`]: [transactionMeta: TransactionMeta];
    [key: `${string}:publish-skip`]: [tansactionMeta: TransactionMeta];
    [key: `${string}:speedup`]: [transactionMeta: TransactionMeta];
};
/**
 * Representation of transaction metadata.
 */
export declare type TransactionMeta = TransactionMetaBase & ({
    status: Exclude<TransactionStatus, TransactionStatus.failed>;
} | {
    status: TransactionStatus.failed;
    error: TransactionError;
});
/**
 * Information about a single transaction such as status and block number.
 */
declare type TransactionMetaBase = {
    /**
     * ID of the transaction that approved the swap token transfer.
     */
    approvalTxId?: string;
    /**
     * Unique ID to prevent duplicate requests.
     */
    actionId?: string;
    /**
     * Base fee of the block as a hex value, introduced in EIP-1559.
     */
    baseFeePerGas?: Hex;
    /**
     * Number of the block where the transaction has been included.
     */
    blockNumber?: string;
    /**
     * The timestamp for when the block was collated.
     */
    blockTimestamp?: string;
    /**
     * Network code as per EIP-155 for this transaction.
     */
    chainId: Hex;
    /**
     * A string representing a name of transaction contract method.
     */
    contractMethodName?: string;
    /**
     * The balance of the token that is being sent.
     */
    currentTokenBalance?: string;
    /**
     * Unique ID for custodian transaction.
     */
    custodyId?: string;
    /**
     * Custodian transaction status.
     */
    custodyStatus?: string;
    /** The optional custom nonce override as a decimal string. */
    customNonceValue?: string;
    /**
     * The custom token amount is the amount set by the user.
     */
    customTokenAmount?: string;
    /**
     * The dapp proposed token amount.
     */
    dappProposedTokenAmount?: string;
    /**
     * Gas values provided by the dApp.
     */
    dappSuggestedGasFees?: DappSuggestedGasFees;
    /**
     * The initial gas values set when the transaction was first created.
     */
    defaultGasEstimates?: DefaultGasEstimates;
    /**
     * String to indicate what device the transaction was confirmed on.
     */
    deviceConfirmedOn?: WalletDevice;
    /**
     * The address of the token being received of swap transaction.
     */
    destinationTokenAddress?: string;
    /**
     * The decimals of the token being received of swap transaction.
     */
    destinationTokenDecimals?: number;
    /**
     * The symbol of the token being received with swap.
     */
    destinationTokenSymbol?: string;
    /**
     * The estimated base fee of the transaction.
     */
    estimatedBaseFee?: string;
    /**
     * Which estimate level that the API suggested.
     */
    estimateSuggested?: string;
    /**
     * Which estimate level was used
     */
    estimateUsed?: string;
    /**
     * The chosen amount which will be the same as the originally proposed token
     * amount if the user does not edit the  amount or will be a custom token
     * amount set by the user.
     */
    finalApprovalAmount?: string;
    /**
     * The number of the latest block when the transaction submit was first retried.
     */
    firstRetryBlockNumber?: string;
    /**
     * A hex string of the transaction hash, used to identify the transaction on the network.
     */
    hash?: string;
    /**
     * A history of mutations to TransactionMeta.
     */
    history?: TransactionHistory;
    /**
     * Generated UUID associated with this transaction.
     */
    id: string;
    /**
     * Whether the transaction is a transfer.
     */
    isTransfer?: boolean;
    /**
     * Whether the transaction entry is generated from a user operation.
     */
    isUserOperation?: boolean;
    /**
     * Network code as per EIP-155 for this transaction
     *
     * @deprecated Use `chainId` instead.
     */
    readonly networkID?: string;
    /**
     * Origin this transaction was sent from.
     */
    origin?: string;
    /**
     * The original dapp proposed token approval amount before edit by user.
     */
    originalApprovalAmount?: string;
    /**
     * The original gas estimation of the transaction.
     */
    originalGasEstimate?: string;
    /**
     * When we speed up a transaction, we set the type as Retry and we lose
     * information about type of transaction that is being set up, so we use
     * original type to track that information.
     */
    originalType?: TransactionType;
    /**
     * Account transaction balance after swap.
     */
    postTxBalance?: string;
    /**
     * Account transaction balance before swap.
     */
    preTxBalance?: string;
    /**
     * The previous gas properties before they were updated.
     */
    previousGas?: {
        /**
         * Maxmimum number of units of gas to use for this transaction.
         */
        gasLimit?: string;
        /**
         * Maximum amount per gas to pay for the transaction, including the priority fee.
         */
        maxFeePerGas?: string;
        /**
         * Maximum amount per gas to give to validator as incentive.
         */
        maxPriorityFeePerGas?: string;
    };
    /**
     * The transaction's 'r' value as a hex string.
     */
    r?: string;
    /**
     * Hex representation of the underlying transaction.
     */
    rawTx?: string;
    /**
     * When the transaction is dropped, this is the replacement transaction hash.
     */
    replacedBy?: string;
    /**
     * When the transaction is dropped, this is the replacement transaction ID.
     */
    replacedById?: string;
    /**
     * The number of times that the transaction submit has been retried.
     */
    retryCount?: number;
    /**
     * The transaction's 's' value as a hex string.
     */
    s?: string;
    /**
     * Response from security validator.
     */
    securityAlertResponse?: SecurityAlertResponse;
    /**
     * Response from security provider.
     */
    securityProviderResponse?: Record<string, any>;
    /**
     * An array of entries that describe the user's journey through the send flow.
     * This is purely attached to state logs for troubleshooting and support.
     */
    sendFlowHistory?: SendFlowHistoryEntry[];
    /**
     * If the gas estimation fails, an object containing error and block information.
     */
    simulationFails?: {
        reason?: string;
        errorKey?: string;
        debug: {
            blockNumber?: string;
            blockGasLimit?: string;
        };
    };
    /**
     * The time the transaction was submitted to the network, in Unix epoch time (ms).
     */
    submittedTime?: number;
    /**
     * The symbol of the token being swapped.
     */
    sourceTokenSymbol?: string;
    /**
     * The metadata of the swap transaction.
     */
    swapMetaData?: Record<string, any>;
    /**
     * The value of the token being swapped.
     */
    swapTokenValue?: string;
    /**
     * Timestamp associated with this transaction.
     */
    time: number;
    /**
     * Whether transaction recipient is a smart contract.
     */
    toSmartContract?: boolean;
    /**
     * Additional transfer information.
     */
    transferInformation?: {
        contractAddress: string;
        decimals: number;
        symbol: string;
    };
    /**
     * Underlying Transaction object.
     */
    txParams: TransactionParams;
    /**
     * Transaction receipt.
     */
    txReceipt?: TransactionReceipt;
    /**
     * The type of transaction such as `cancel` or `swap`.
     */
    type?: TransactionType;
    /**
     * The gas limit supplied by user.
     */
    userEditedGasLimit?: boolean;
    /**
     * Estimate level user selected.
     */
    userFeeLevel?: string;
    /**
     * The transaction's 'v' value as a hex string.
     */
    v?: string;
    /**
     * Whether the transaction is verified on the blockchain.
     */
    verifiedOnBlockchain?: boolean;
    /**
     * Warning information for the transaction.
     */
    warning?: {
        error: string;
        message: string;
    };
};
export declare type SendFlowHistoryEntry = {
    /**
     * String to indicate user interaction information.
     */
    entry: string;
    /**
     * Timestamp associated with this entry.
     */
    timestamp: number;
};
/**
 * The status of the transaction. Each status represents the state of the transaction internally
 * in the wallet. Some of these correspond with the state of the transaction on the network, but
 * some are wallet-specific.
 */
export declare enum TransactionStatus {
    approved = "approved",
    /** @deprecated Determined by the clients using the transaction type. No longer used. */
    cancelled = "cancelled",
    confirmed = "confirmed",
    dropped = "dropped",
    failed = "failed",
    rejected = "rejected",
    signed = "signed",
    submitted = "submitted",
    unapproved = "unapproved"
}
/**
 * Options for wallet device.
 */
export declare enum WalletDevice {
    MM_MOBILE = "metamask_mobile",
    MM_EXTENSION = "metamask_extension",
    OTHER = "other_device"
}
/**
 * The type of the transaction.
 */
export declare enum TransactionType {
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    cancel = "cancel",
    /**
     * A transaction that is interacting with a smart contract's methods that we
     * have not treated as a special case, such as approve, transfer, and
     * transferfrom.
     */
    contractInteraction = "contractInteraction",
    /**
     * A transaction that deployed a smart contract.
     */
    deployContract = "contractDeployment",
    /**
     * A transaction for Ethereum decryption.
     */
    ethDecrypt = "eth_decrypt",
    /**
     * A transaction for getting an encryption public key.
     */
    ethGetEncryptionPublicKey = "eth_getEncryptionPublicKey",
    /**
     * An incoming (deposit) transaction.
     */
    incoming = "incoming",
    /**
     * A transaction for personal sign.
     */
    personalSign = "personal_sign",
    /**
     * When a transaction is failed it can be retried by
     * resubmitting the same transaction with a higher gas fee. This type is also used
     * to speed up pending transactions. This is accomplished by creating a new tx with
     * the same nonce and higher gas fees.
     */
    retry = "retry",
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    simpleSend = "simpleSend",
    /**
     * A transaction that is signing a message.
     */
    sign = "eth_sign",
    /**
     * A transaction that is signing typed data.
     */
    signTypedData = "eth_signTypedData",
    /**
     * A transaction sending a network's native asset to a recipient.
     */
    smart = "smart",
    /**
     * A transaction swapping one token for another through MetaMask Swaps.
     */
    swap = "swap",
    /**
     * Similar to the approve type, a swap approval is a special case of ERC20
     * approve method that requests an allowance of the token to spend on behalf
     * of the user for the MetaMask Swaps contract. The first swap for any token
     * will have an accompanying swapApproval transaction.
     */
    swapApproval = "swapApproval",
    /**
     * A token transaction requesting an allowance of the token to spend on
     * behalf of the user.
     */
    tokenMethodApprove = "approve",
    /**
     * A token transaction transferring tokens from an account that the sender
     * has an allowance of. The method is prefixed with safe because when calling
     * this method the contract checks to ensure that the receiver is an address
     * capable of handling the token being sent.
     */
    tokenMethodSafeTransferFrom = "safetransferfrom",
    /**
     * A token transaction where the user is sending tokens that they own to
     * another address.
     */
    tokenMethodTransfer = "transfer",
    /**
     * A token transaction transferring tokens from an account that the sender
     * has an allowance of. For more information on allowances, see the approve
     * type.
     */
    tokenMethodTransferFrom = "transferfrom",
    /**
     * A token transaction requesting an allowance of all of a user's tokens to
     * spend on behalf of the user.
     */
    tokenMethodSetApprovalForAll = "setapprovalforall"
}
/**
 * Standard data concerning a transaction to be processed by the blockchain.
 */
export interface TransactionParams {
    /**
     * A list of addresses and storage keys that the transaction plans to access.
     */
    accessList?: AccessList;
    /**
     * Network ID as per EIP-155.
     */
    chainId?: Hex;
    /**
     * Data to pass with this transaction.
     */
    data?: string;
    /**
     * Error message for gas estimation failure.
     */
    estimateGasError?: string;
    /**
     * Estimated base fee for this transaction.
     */
    estimatedBaseFee?: string;
    /**
     * Which estimate level that the API suggested.
     */
    estimateSuggested?: string;
    /**
     * Which estimate level was used
     */
    estimateUsed?: string;
    /**
     * Address to send this transaction from.
     */
    from: string;
    /**
     * same as gasLimit?
     */
    gas?: string;
    /**
     * Maxmimum number of units of gas to use for this transaction.
     */
    gasLimit?: string;
    /**
     * Price per gas for legacy txs
     */
    gasPrice?: string;
    /**
     * Gas used in the transaction.
     */
    gasUsed?: string;
    /**
     * Maximum amount per gas to pay for the transaction, including the priority
     * fee.
     */
    maxFeePerGas?: string;
    /**
     * Maximum amount per gas to give to validator as incentive.
     */
    maxPriorityFeePerGas?: string;
    /**
     * Unique number to prevent replay attacks.
     */
    nonce?: string;
    /**
     * Address to send this transaction to.
     */
    to?: string;
    /**
     * Value associated with this transaction.
     */
    value?: string;
    /**
     * Type of transaction.
     * 0x0 indicates a legacy transaction.
     */
    type?: string;
}
/**
 * Standard data concerning a transaction processed by the blockchain.
 */
export interface TransactionReceipt {
    /**
     * The block hash of the block that this transaction was included in.
     */
    blockHash?: string;
    /**
     * The block number of the block that this transaction was included in.
     */
    blockNumber?: string;
    /**
     * Effective gas price the transaction was charged at.
     */
    effectiveGasPrice?: string;
    /**
     * Gas used in the transaction.
     */
    gasUsed?: string;
    /**
     * Total used gas in hex.
     */
    l1Fee?: string;
    /**
     * All the logs emitted by this transaction.
     */
    logs?: Log[];
    /**
     * The status of the transaction.
     */
    status?: string;
    /**
     * The hexadecimal index of this transaction in the list of transactions included in the block this transaction was mined in.
     */
    transactionIndex?: string;
}
/**
 * Represents an event that has been included in a transaction using the EVM `LOG` opcode.
 */
export interface Log {
    /**
     * Address of the contract that generated log.
     */
    address?: string;
    /**
     * List of topics for log.
     */
    topics?: string;
}
/**
 * The configuration required to fetch transaction data from a RemoteTransactionSource.
 */
export interface RemoteTransactionSourceRequest {
    /**
     * The address of the account to fetch transactions for.
     */
    address: string;
    /**
     * The chainId of the current network.
     */
    currentChainId: Hex;
    /**
     * Block number to start fetching transactions from.
     */
    fromBlock?: number;
    /**
     * Maximum number of transactions to retrieve.
     */
    limit?: number;
}
/**
 * An object capable of fetching transaction data from a remote source.
 * Used by the IncomingTransactionHelper to retrieve remote transaction data.
 */
export interface RemoteTransactionSource {
    /**
     * @param chainId - The chainId of the current network.
     * @returns Whether the remote transaction source supports the specified network.
     */
    isSupportedNetwork: (chainId: Hex) => boolean;
    /**
     * @returns An array of additional keys to use when caching the last fetched block number.
     */
    getLastBlockVariations?: () => string[];
    /**
     * @param request - A request object containing data such as the address and chain ID.
     * @returns An array of transaction metadata for the retrieved transactions.
     */
    fetchTransactions: (request: RemoteTransactionSourceRequest) => Promise<TransactionMeta[]>;
}
/**
 * Gas values initially suggested by the dApp.
 */
export interface DappSuggestedGasFees {
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
}
/**
 * Gas values saved by the user for a specific chain.
 */
export interface SavedGasFees {
    maxBaseFee: string;
    priorityFee: string;
}
/**
 * A transaction history operation that includes a note and timestamp.
 */
declare type ExtendedHistoryOperation = Operation & {
    note?: string;
    timestamp?: number;
};
/**
 * A transaction history entry that includes the ExtendedHistoryOperation as the first element.
 */
export declare type TransactionHistoryEntry = [
    ExtendedHistoryOperation,
    ...Operation[]
];
/**
 * A transaction history that includes the transaction meta as the first element.
 * And the rest of the elements are the operation arrays that were applied to the transaction meta.
 */
export declare type TransactionHistory = [
    TransactionMeta,
    ...TransactionHistoryEntry[]
];
/**
 * Result of inferring the transaction type.
 */
export declare type InferTransactionTypeResult = {
    /**
     * The contract code, in hex format if it exists. '0x0' or
     * '0x' are also indicators of non-existent contract code.
     */
    getCodeResponse?: string | null;
    /**
     * The type of transaction
     */
    type: TransactionType;
};
/**
 * A function for verifying a transaction, whether it is malicious or not.
 */
export declare type SecurityProviderRequest = (requestData: TransactionMeta, messageType: string) => Promise<any>;
/**
 * Specifies the shape of the base transaction parameters.
 * Added in EIP-2718.
 */
export declare enum TransactionEnvelopeType {
    /**
     * A legacy transaction, the very first type.
     */
    legacy = "0x0",
    /**
     * EIP-2930 defined the access list transaction type that allowed for
     * specifying the state that a transaction would act upon in advance and
     * theoretically save on gas fees.
     */
    accessList = "0x1",
    /**
     * The type introduced comes from EIP-1559, Fee Market describes the addition
     * of a baseFee to blocks that will be burned instead of distributed to
     * miners. Transactions of this type have both a maxFeePerGas (maximum total
     * amount in gwei per gas to spend on the transaction) which is inclusive of
     * the maxPriorityFeePerGas (maximum amount of gwei per gas from the
     * transaction fee to distribute to miner).
     */
    feeMarket = "0x2"
}
/**
 * The source of the gas fee parameters on a transaction.
 */
export declare enum UserFeeLevel {
    CUSTOM = "custom",
    DAPP_SUGGESTED = "dappSuggested",
    MEDIUM = "medium"
}
/**
 * Initial gas values set when the transaction was first created.
 */
export declare type DefaultGasEstimates = {
    /**
     * Source of the gas fee values, such as `dappSuggested` or `medium`.
     */
    estimateType?: string;
    /**
     * Maxmimum number of units of gas to use for this transaction.
     */
    gas?: string;
    /**
     * Price per gas for legacy transactions.
     */
    gasPrice?: string;
    /**
     * Maximum amount per gas to pay for the transaction, including the priority fee.
     */
    maxFeePerGas?: string;
    /**
     * Maximum amount per gas to give to validator as incentive.
     */
    maxPriorityFeePerGas?: string;
};
/**
 * Data concerning an error while processing a transaction.
 */
export declare type TransactionError = {
    /**
     * A descriptive error name.
     */
    name: string;
    /**
     * A descriptive error message providing details about the encountered error.
     */
    message: string;
    /**
     * The stack trace associated with the error, if available.
     */
    stack?: string;
    /**
     * An optional error code associated with the error.
     */
    code?: string;
    /**
     * The rpc property holds additional information related to the error.
     */
    rpc?: unknown;
};
/**
 * Type for security alert response from transaction validator.
 */
export declare type SecurityAlertResponse = {
    reason: string;
    features?: string[];
    result_type: string;
    providerRequestsCount?: Record<string, number>;
};
export {};
//# sourceMappingURL=types.d.ts.map