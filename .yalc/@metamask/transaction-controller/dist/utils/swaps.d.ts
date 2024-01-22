import type EthQuery from '@metamask/eth-query';
import type { Events, TransactionMeta } from '../types';
import { TransactionType } from '../types';
/**
 * Interval in milliseconds between checks of post transaction balance
 */
export declare const UPDATE_POST_TX_BALANCE_TIMEOUT = 5000;
/**
 * Retry attempts for checking post transaction balance
 */
export declare const UPDATE_POST_TX_BALANCE_ATTEMPTS = 6;
/**
 * An address that the metaswap-api recognizes as the default token for the current network, in place of the token address that ERC-20 tokens have
 */
export declare const DEFAULT_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
interface SwapsTokenObject {
    /**
     * The name for the network
     */
    name: string;
    /**
     * An address that the metaswap-api recognizes as the default token
     */
    address: string;
    /**
     * Number of digits after decimal point
     */
    decimals: number;
}
export declare const SWAPS_CHAINID_DEFAULT_TOKEN_MAP: {
    readonly "0x1": SwapsTokenObject;
    readonly "0x539": SwapsTokenObject;
    readonly "0x38": SwapsTokenObject;
    readonly "0x89": SwapsTokenObject;
    readonly "0x5": SwapsTokenObject;
    readonly "0xa86a": SwapsTokenObject;
    readonly "0xa": SwapsTokenObject;
    readonly "0xa4b1": SwapsTokenObject;
    readonly "0x144": SwapsTokenObject;
};
export declare const SWAP_TRANSACTION_TYPES: TransactionType[];
/**
 * Updates the transaction meta object with the swap information
 *
 * @param transactionMeta - The transaction meta object to update
 * @param transactionType - The type of the transaction
 * @param swaps - The swaps object
 * @param swaps.hasApproveTx - Whether the swap has an approval transaction
 * @param swaps.meta - The swap meta object
 * @param updateSwapsTransactionRequest - Dependency bag
 * @param updateSwapsTransactionRequest.isSwapsDisabled - Whether swaps are disabled
 * @param updateSwapsTransactionRequest.cancelTransaction - Function to cancel a transaction
 * @param updateSwapsTransactionRequest.controllerHubEmitter - Function to emit an event to the controller hub
 */
export declare function updateSwapsTransaction(transactionMeta: TransactionMeta, transactionType: TransactionType, swaps: {
    hasApproveTx?: boolean;
    meta?: Partial<TransactionMeta>;
}, { isSwapsDisabled, cancelTransaction, controllerHubEmitter, }: {
    isSwapsDisabled: boolean;
    cancelTransaction: (transactionId: string) => void;
    controllerHubEmitter: <T extends keyof Events>(eventName: T, ...args: Events[T]) => boolean;
}): Promise<void>;
/**
 * Attempts to update the post transaction balance of the provided transaction
 *
 * @param transactionMeta - Transaction meta object to update
 * @param updatePostTransactionBalanceRequest - Dependency bag
 * @param updatePostTransactionBalanceRequest.ethQuery - EthQuery object
 * @param updatePostTransactionBalanceRequest.getTransaction - Reading function for the latest transaction state
 * @param updatePostTransactionBalanceRequest.updateTransaction - Updating transaction function
 */
export declare function updatePostTransactionBalance(transactionMeta: TransactionMeta, { ethQuery, getTransaction, updateTransaction, }: {
    ethQuery: EthQuery;
    getTransaction: (transactionId: string) => TransactionMeta | undefined;
    updateTransaction: (transactionMeta: TransactionMeta, note: string) => void;
}): Promise<{
    updatedTransactionMeta: TransactionMeta;
    approvalTransactionMeta?: TransactionMeta;
}>;
export {};
//# sourceMappingURL=swaps.d.ts.map