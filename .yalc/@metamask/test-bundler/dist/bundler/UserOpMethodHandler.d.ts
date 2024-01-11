import type { UserOperationStruct, EntryPoint } from '@account-abstraction/contracts';
import type { UserOperationEventEvent } from '@account-abstraction/contracts/dist/types/EntryPoint';
import type { Log, Provider } from '@ethersproject/providers';
import type { BigNumberish, Signer } from 'ethers';
import type { BundlerConfig } from './BundlerConfig';
import type { ExecutionManager } from './modules/ExecutionManager';
import type { UserOperationByHashResponse, UserOperationReceipt } from './RpcTypes';
/**
 * return value from estimateUserOpGas
 */
export type EstimateUserOpGasResult = {
    /**
     * the preVerification gas used by this UserOperation.
     */
    preVerificationGas: BigNumberish;
    /**
     * gas used for validation of this UserOperation, including account creation
     */
    verificationGasLimit: BigNumberish;
    /**
     * (possibly future timestamp) after which this UserOperation is valid
     */
    validAfter?: BigNumberish;
    /**
     * the deadline after which this UserOperation is invalid (not a gas estimation parameter, but returned by validation
     */
    validUntil?: BigNumberish;
    /**
     * estimated cost of calling the account with the given callData
     */
    callGasLimit: BigNumberish;
};
export declare class UserOpMethodHandler {
    readonly execManager: ExecutionManager;
    readonly provider: Provider;
    readonly signer: Signer;
    readonly config: BundlerConfig;
    readonly entryPoint: EntryPoint;
    constructor(execManager: ExecutionManager, provider: Provider, signer: Signer, config: BundlerConfig, entryPoint: EntryPoint);
    getSupportedEntryPoints(): Promise<string[]>;
    selectBeneficiary(): Promise<string>;
    _validateParameters(userOp1: UserOperationStruct, entryPointInput: string, requireSignature?: boolean, requireGasParams?: boolean): Promise<void>;
    /**
     * eth_estimateUserOperationGas RPC api.
     * @param userOp1 - input userOp (may have gas fields missing, so they can be estimated)
     * @param entryPointInput
     */
    estimateUserOperationGas(userOp1: UserOperationStruct, entryPointInput: string): Promise<EstimateUserOpGasResult>;
    sendUserOperation(userOp1: UserOperationStruct, entryPointInput: string): Promise<string>;
    _getUserOperationEvent(userOpHash: string): Promise<UserOperationEventEvent>;
    _filterLogs(userOpEvent: UserOperationEventEvent, logs: Log[]): Log[];
    getUserOperationByHash(userOpHash: string): Promise<UserOperationByHashResponse | null>;
    getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null>;
    clientVersion(): string;
}
