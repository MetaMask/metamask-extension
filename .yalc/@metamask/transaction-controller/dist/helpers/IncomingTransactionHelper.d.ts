/// <reference types="node" />
import type { BlockTracker, NetworkState } from '@metamask/network-controller';
import type { Hex } from '@metamask/utils';
import EventEmitter from 'events';
import type { RemoteTransactionSource, TransactionMeta } from '../types';
export declare class IncomingTransactionHelper {
    #private;
    hub: EventEmitter;
    constructor({ blockTracker, getCurrentAccount, getLastFetchedBlockNumbers, getLocalTransactions, getNetworkState, isEnabled, queryEntireHistory, remoteTransactionSource, transactionLimit, updateTransactions, }: {
        blockTracker: BlockTracker;
        getCurrentAccount: () => string;
        getLastFetchedBlockNumbers: () => Record<string, number>;
        getLocalTransactions?: () => TransactionMeta[];
        getNetworkState: () => NetworkState;
        isEnabled?: () => boolean;
        queryEntireHistory?: boolean;
        remoteTransactionSource: RemoteTransactionSource;
        transactionLimit?: number;
        updateTransactions?: boolean;
    });
    start(): void;
    stop(): void;
    update(latestBlockNumberHex?: Hex): Promise<void>;
}
//# sourceMappingURL=IncomingTransactionHelper.d.ts.map