import type { EntryPoint } from '@account-abstraction/contracts';
import type { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';
import { Mutex } from 'async-mutex';
import type { BigNumberish } from 'ethers';
import type { EventsManager } from './EventsManager';
import type { MempoolManager } from './MempoolManager';
import type { ReputationManager } from './ReputationManager';
import type { UserOperation, StorageMap } from '../../utils';
import type { ValidationManager } from '../../validation-manager';
export type SendBundleReturn = {
    transactionHash: string;
    userOpHashes: string[];
};
export declare class BundleManager {
    readonly entryPoint: EntryPoint;
    readonly eventsManager: EventsManager;
    readonly mempoolManager: MempoolManager;
    readonly validationManager: ValidationManager;
    readonly reputationManager: ReputationManager;
    readonly beneficiary: string;
    readonly minSignerBalance: BigNumberish;
    readonly maxBundleGas: number;
    readonly conditionalRpc: boolean;
    readonly mergeToAccountRootHash: boolean;
    provider: JsonRpcProvider;
    signer: JsonRpcSigner;
    mutex: Mutex;
    constructor(entryPoint: EntryPoint, eventsManager: EventsManager, mempoolManager: MempoolManager, validationManager: ValidationManager, reputationManager: ReputationManager, beneficiary: string, minSignerBalance: BigNumberish, maxBundleGas: number, conditionalRpc: boolean, mergeToAccountRootHash?: boolean);
    /**
     * attempt to send a bundle:
     * collect UserOps from mempool into a bundle
     * send this bundle.
     */
    sendNextBundle(): Promise<SendBundleReturn | undefined>;
    handlePastEvents(): Promise<void>;
    /**
     * submit a bundle.
     * after submitting the bundle, remove all UserOps from the mempool
     * @param userOps
     * @param beneficiary
     * @param storageMap
     * @returns SendBundleReturn the transaction and UserOp hashes on successful transaction, or null on failed transaction
     */
    sendBundle(userOps: UserOperation[], beneficiary: string, storageMap: StorageMap): Promise<SendBundleReturn | undefined>;
    checkFatal(e: any): void;
    createBundle(): Promise<[UserOperation[], StorageMap]>;
    /**
     * determine who should receive the proceedings of the request.
     * if signer's balance is too low, send it to signer. otherwise, send to configured beneficiary.
     */
    _selectBeneficiary(): Promise<string>;
    getUserOpHashes(userOps: UserOperation[]): Promise<string[]>;
}
