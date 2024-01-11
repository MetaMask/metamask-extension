import type { Provider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import type { StakeInfo } from '../../utils';
/**
 * throttled entities are allowed minimal number of entries per bundle. banned entities are allowed none
 */
export declare enum ReputationStatus {
    OK = 0,
    THROTTLED = 1,
    BANNED = 2
}
export type ReputationParams = {
    minInclusionDenominator: number;
    throttlingSlack: number;
    banSlack: number;
};
export declare const BundlerReputationParams: ReputationParams;
export declare const NonBundlerReputationParams: ReputationParams;
type ReputationEntry = {
    address: string;
    opsSeen: number;
    opsIncluded: number;
    status?: ReputationStatus;
};
export type ReputationDump = ReputationEntry[];
export declare class ReputationManager {
    readonly provider: Provider;
    readonly params: ReputationParams;
    readonly minStake: BigNumber;
    readonly minUnstakeDelay: number;
    constructor(provider: Provider, params: ReputationParams, minStake: BigNumber, minUnstakeDelay: number);
    private entries;
    readonly blackList: Set<string>;
    readonly whitelist: Set<string>;
    /**
     * debug: dump reputation map (with updated "status" for each entry)
     */
    dump(): ReputationDump;
    /**
     * exponential backoff of opsSeen and opsIncluded values
     */
    hourlyCron(): void;
    addWhitelist(...params: string[]): void;
    addBlacklist(...params: string[]): void;
    _getOrCreate(addr: string): ReputationEntry;
    /**
     * address seen in the mempool triggered by the
     * @param addr
     */
    updateSeenStatus(addr?: string): void;
    /**
     * found paymaster/deployer/agregator on-chain.
     * triggered by the EventsManager.
     * @param addr
     */
    updateIncludedStatus(addr: string): void;
    isWhitelisted(addr: string): boolean;
    getStatus(addr?: string): ReputationStatus;
    getStakeStatus(address: string, entryPointAddress: string): Promise<{
        stakeInfo: StakeInfo;
        isStaked: boolean;
    }>;
    /**
     * an entity that caused handleOps to revert, which requires re-building the bundle from scratch.
     * should be banned immediately, by increasing its opSeen counter
     * @param addr
     */
    crashedHandleOps(addr: string | undefined): void;
    /**
     * for debugging: clear in-memory state
     */
    clearState(): void;
    /**
     * for debugging: put in the given reputation entries
     * @param entries
     * @param reputations
     */
    setReputation(reputations: ReputationDump): ReputationDump;
    /**
     * check the given address (account/paymaster/deployer/aggregator) is banned
     * unlike {@link checkStake} does not check whitelist or stake
     * @param title
     * @param info
     */
    checkBanned(title: 'account' | 'paymaster' | 'aggregator' | 'deployer', info: StakeInfo): void;
    /**
     * check the given address (account/paymaster/deployer/aggregator) is throttled
     * unlike {@link checkStake} does not check whitelist or stake
     * @param title
     * @param info
     */
    checkThrottled(title: 'account' | 'paymaster' | 'aggregator' | 'deployer', info: StakeInfo): void;
    /**
     * check the given address (account/paymaster/deployer/aggregator) is staked
     * @param title - the address title (field name to put into the "data" element)
     * @param raddr - the address to check the stake of. null is "ok"
     * @param info - stake info from verification. if not given, then read from entryPoint
     */
    checkStake(title: 'account' | 'paymaster' | 'aggregator' | 'deployer', info?: StakeInfo): void;
    /**
     * @param entity - the address of a non-sender unstaked entity.
     * @returns maxMempoolCount - the number of UserOperations this entity is allowed to have in the mempool.
     */
    calculateMaxAllowedMempoolOpsUnstaked(entity: string): number;
}
export {};
