import type { BundleManager, SendBundleReturn } from './BundleManager';
import type { MempoolManager } from './MempoolManager';
import type { ReputationManager } from './ReputationManager';
import type { UserOperation } from '../../utils';
import type { ValidationManager } from '../../validation-manager';
/**
 * execute userOps manually or using background timer.
 * This is the top-level interface to send UserOperation
 */
export declare class ExecutionManager {
    private readonly reputationManager;
    private readonly mempoolManager;
    private readonly bundleManager;
    private readonly validationManager;
    private reputationCron;
    private autoBundleInterval;
    private maxMempoolSize;
    private autoInterval;
    private readonly mutex;
    constructor(reputationManager: ReputationManager, mempoolManager: MempoolManager, bundleManager: BundleManager, validationManager: ValidationManager);
    /**
     * send a user operation through the bundler.
     * @param userOp - the UserOp to send.
     * @param entryPointInput
     */
    sendUserOperation(userOp: UserOperation, entryPointInput: string): Promise<void>;
    setReputationCron(interval: number): void;
    /**
     * set automatic bundle creation
     * @param autoBundleInterval - autoBundleInterval to check. send bundle anyway after this time is elapsed. zero for manual mode
     * @param maxMempoolSize - maximum # of pending mempool entities. send immediately when there are that many entities in the mempool.
     *    set to zero (or 1) to automatically send each UserOp.
     * (note: there is a chance that the sent bundle will contain less than this number, in case only some mempool entities can be sent.
     *  e.g. throttled paymaster)
     */
    setAutoBundler(autoBundleInterval: number, maxMempoolSize: number): void;
    /**
     * attempt to send a bundle now.
     * @param force
     */
    attemptBundle(force?: boolean): Promise<SendBundleReturn | undefined>;
}
