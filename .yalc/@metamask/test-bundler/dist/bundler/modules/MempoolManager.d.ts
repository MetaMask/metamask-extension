import type { BigNumberish } from 'ethers';
import type { ReputationManager } from './ReputationManager';
import type { ReferencedCodeHashes, StakeInfo, UserOperation } from '../../utils';
export type MempoolEntry = {
    userOp: UserOperation;
    userOpHash: string;
    prefund: BigNumberish;
    referencedContracts: ReferencedCodeHashes;
    aggregator?: string;
};
type MempoolDump = UserOperation[];
export declare class MempoolManager {
    readonly reputationManager: ReputationManager;
    private mempool;
    private _entryCount;
    entryCount(address: string): number | undefined;
    incrementEntryCount(address?: string): void;
    decrementEntryCount(address?: string): void;
    constructor(reputationManager: ReputationManager);
    count(): number;
    addUserOp(userOp: UserOperation, userOpHash: string, prefund: BigNumberish, referencedContracts: ReferencedCodeHashes, senderInfo: StakeInfo, paymasterInfo?: StakeInfo, factoryInfo?: StakeInfo, aggregatorInfo?: StakeInfo): void;
    private updateSeenStatus;
    private checkReputation;
    private checkMultipleRolesViolation;
    private checkReputationStatus;
    private checkReplaceUserOp;
    getSortedForInclusion(): MempoolEntry[];
    _findBySenderNonce(sender: string, nonce: BigNumberish): number;
    _findByHash(hash: string): number;
    /**
     * remove UserOp from mempool. either it is invalid, or was included in a block
     * @param userOpOrHash
     */
    removeUserOp(userOpOrHash: UserOperation | string): void;
    /**
     * debug: dump mempool content
     */
    dump(): MempoolDump;
    /**
     * for debugging: clear current in-memory state
     */
    clearState(): void;
    /**
     * Returns all addresses that are currently known to be "senders" according to the current mempool.
     */
    getKnownSenders(): string[];
    /**
     * Returns all addresses that are currently known to be any kind of entity according to the current mempool.
     * Note that "sender" addresses are not returned by this function. Use {@link getKnownSenders} instead.
     */
    getKnownEntities(): string[];
}
export {};
