import type { EntryPoint } from '@account-abstraction/contracts';
import type { TypedEvent } from '@account-abstraction/contracts/dist/types/common';
import type { AccountDeployedEvent, UserOperationEventEvent } from '@account-abstraction/contracts/dist/types/EntryPoint';
import type { SignatureAggregatorChangedEvent } from '@account-abstraction/contracts/types/EntryPoint';
import type { MempoolManager } from './MempoolManager';
import type { ReputationManager } from './ReputationManager';
/**
 * listen to events. trigger ReputationManager's Included
 */
export declare class EventsManager {
    readonly entryPoint: EntryPoint;
    readonly mempoolManager: MempoolManager;
    readonly reputationManager: ReputationManager;
    lastBlock?: number;
    constructor(entryPoint: EntryPoint, mempoolManager: MempoolManager, reputationManager: ReputationManager);
    /**
     * automatically listen to all UserOperationEvent events
     */
    initEventListener(): void;
    /**
     * process all new events since last run
     */
    handlePastEvents(): Promise<void>;
    handleEvent(ev: UserOperationEventEvent | AccountDeployedEvent | SignatureAggregatorChangedEvent): void;
    handleAggregatorChangedEvent(ev: SignatureAggregatorChangedEvent): void;
    eventAggregator: string | null;
    eventAggregatorTxHash: string | null;
    getEventAggregator(ev: TypedEvent): string | null;
    handleAccountDeployedEvent(ev: AccountDeployedEvent): void;
    handleUserOperationEvent(ev: UserOperationEventEvent): void;
    _includedAddress(data: string | null): void;
}
