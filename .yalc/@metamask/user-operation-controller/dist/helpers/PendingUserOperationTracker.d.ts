/// <reference types="node" />
import type { Block } from '@ethersproject/providers';
import type { BlockTracker } from '@metamask/network-controller';
import EventEmitter from 'events';
import type { UserOperationMetadata } from '../types';
import type { UserOperationControllerState } from '../UserOperationController';
declare type Events = {
    [key: `${string}:confirmed`]: [metadata: UserOperationMetadata];
    [key: `${string}:failed`]: [txMeta: UserOperationMetadata, error: Error];
    'user-operation-updated': [txMeta: UserOperationMetadata];
};
export interface PendingUserOperationTrackerEventEmitter extends EventEmitter {
    on<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): this;
    once<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): this;
    emit<T extends keyof Events>(eventName: T, ...args: Events[T]): boolean;
}
export declare class PendingUserOperationTracker {
    #private;
    hub: PendingUserOperationTrackerEventEmitter;
    constructor({ blockTracker, getBlockByHash, getUserOperations, onStateChange, }: {
        blockTracker: BlockTracker;
        getBlockByHash: (hash: string) => Promise<Block>;
        getUserOperations: () => UserOperationMetadata[];
        onStateChange: (listener: (state: UserOperationControllerState) => void) => void;
    });
}
export {};
//# sourceMappingURL=PendingUserOperationTracker.d.ts.map