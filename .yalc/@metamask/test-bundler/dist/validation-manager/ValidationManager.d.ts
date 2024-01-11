import type { IEntryPoint } from '@account-abstraction/contracts';
import type { BigNumberish } from 'ethers';
import type { BundlerTracerResult } from './BundlerCollectorTracer';
import type { ReferencedCodeHashes, StakeInfo, StorageMap, UserOperation } from '../utils';
/**
 * result from successful simulateValidation
 */
export type ValidationResult = {
    returnInfo: {
        preOpGas: BigNumberish;
        prefund: BigNumberish;
        sigFailed: boolean;
        validAfter: number;
        validUntil: number;
    };
    senderInfo: StakeInfo;
    factoryInfo?: StakeInfo;
    paymasterInfo?: StakeInfo;
    aggregatorInfo?: StakeInfo;
};
export type ValidateUserOpResult = {
    referencedContracts: ReferencedCodeHashes;
    storageMap: StorageMap;
} & ValidationResult;
export declare class ValidationManager {
    readonly entryPoint: IEntryPoint;
    readonly unsafe: boolean;
    constructor(entryPoint: IEntryPoint, unsafe: boolean);
    _callSimulateValidation(userOp: UserOperation): Promise<ValidationResult>;
    _parseErrorResult(userOp: UserOperation, errorResult: {
        errorName: string;
        errorArgs: any;
    }): ValidationResult;
    _geth_traceCall_SimulateValidation(userOp: UserOperation): Promise<[ValidationResult, BundlerTracerResult]>;
    /**
     * validate UserOperation.
     * should also handle unmodified memory (e.g. by referencing cached storage in the mempool
     * one item to check that was un-modified is the aggregator..
     * @param userOp
     * @param previousCodeHashes
     * @param checkStakes
     */
    validateUserOp(userOp: UserOperation, previousCodeHashes?: ReferencedCodeHashes, checkStakes?: boolean): Promise<ValidateUserOpResult>;
    getCodeHashes(addresses: string[]): Promise<ReferencedCodeHashes>;
    /**
     * perform static checking on input parameters.
     * @param userOp
     * @param entryPointInput
     * @param requireSignature
     * @param requireGasParams
     */
    validateInputParameters(userOp: UserOperation, entryPointInput: string, requireSignature?: boolean, requireGasParams?: boolean): void;
}
