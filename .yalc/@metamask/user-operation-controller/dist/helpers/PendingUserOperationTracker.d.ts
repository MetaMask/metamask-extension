/// <reference types="node" />
import type { NetworkClient } from '@metamask/network-controller';
import { BlockTrackerPollingControllerOnly } from '@metamask/polling-controller';
import type { Json } from '@metamask/utils';
import EventEmitter from 'events';
import type { UserOperationMetadata } from '../types';
import type { UserOperationControllerMessenger } from '../UserOperationController';
declare type Events = {
    'user-operation-confirmed': [metadata: UserOperationMetadata];
    'user-operation-failed': [txMeta: UserOperationMetadata, error: Error];
    'user-operation-updated': [txMeta: UserOperationMetadata];
};
export declare type PendingUserOperationTrackerEventEmitter = EventEmitter & {
    on<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): PendingUserOperationTrackerEventEmitter;
    once<T extends keyof Events>(eventName: T, listener: (...args: Events[T]) => void): PendingUserOperationTrackerEventEmitter;
    emit<T extends keyof Events>(eventName: T, ...args: Events[T]): boolean;
};
/**
 * A helper class to periodically query the bundlers
 * and update the status of any submitted user operations.
 */
export declare class PendingUserOperationTracker extends BlockTrackerPollingControllerOnly {
    #private;
    hub: PendingUserOperationTrackerEventEmitter;
    constructor({ getUserOperations, messenger, }: {
        getUserOperations: () => UserOperationMetadata[];
        messenger: UserOperationControllerMessenger;
    });
    _executePoll(networkClientId: string, _options: Json): Promise<void>;
    _getNetworkClientById(networkClientId: string): NetworkClient | undefined;
}
export {};
//# sourceMappingURL=PendingUserOperationTracker.d.ts.map