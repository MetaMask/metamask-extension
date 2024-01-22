/// <reference types="node" />
import type EthQuery from '@metamask/eth-query';
import type { BlockTracker } from '@metamask/network-controller';
import EventEmitter from 'events';
import type { NonceTracker } from 'nonce-tracker';
import type { TransactionMeta } from '../types';
declare type Events = {
    'transaction-confirmed': [txMeta: TransactionMeta];
    'transaction-dropped': [txMeta: TransactionMeta];
    'transaction-failed': [txMeta: TransactionMeta, error: Error];
    'transaction-updated': [txMeta: TransactionMeta, note: string];
};
export interface PendingTransactionTrackerEventEmitter extends EventEmitter {
    on<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): this;
    emit<T extends keyof Events>(eventName: T, ...args: Events[T]): boolean;
}
export declare class PendingTransactionTracker {
    #private;
    hub: PendingTransactionTrackerEventEmitter;
    constructor({ approveTransaction, blockTracker, getChainId, getEthQuery, getTransactions, isResubmitEnabled, nonceTracker, onStateChange, publishTransaction, hooks, }: {
        approveTransaction: (transactionId: string) => Promise<void>;
        blockTracker: BlockTracker;
        getChainId: () => string;
        getEthQuery: () => EthQuery;
        getTransactions: () => TransactionMeta[];
        isResubmitEnabled?: boolean;
        nonceTracker: NonceTracker;
        onStateChange: (listener: () => void) => void;
        publishTransaction: (rawTx: string) => Promise<string>;
        hooks?: {
            beforeCheckPendingTransaction?: (transactionMeta: TransactionMeta) => boolean;
            beforePublish?: (transactionMeta: TransactionMeta) => boolean;
        };
    });
}
export {};
//# sourceMappingURL=PendingTransactionTracker.d.ts.map