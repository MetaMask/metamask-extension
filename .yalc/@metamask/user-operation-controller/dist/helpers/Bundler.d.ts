import type { UserOperation, UserOperationReceipt } from '../types';
/**
 * Response from the `eth_estimateUserOperationGas` bundler method.
 * Includes the estimated gas limits required by a user operation.
 */
export declare type BundlerEstimateUserOperationGasResponse = {
    /** Estimated gas required to compensate the bundler for any pre-verification. */
    preVerificationGas: number | string;
    /** Estimated gas required to verify the user operation. */
    verificationGas?: number | string;
    /** Estimated gas required to verify the user operation. */
    verificationGasLimit?: number | string;
    /** Estimated gas required for the execution of the user operation. */
    callGasLimit: number | string;
};
/**
 * A helper class for interacting with a bundler.
 */
export declare class Bundler {
    #private;
    constructor(url: string);
    /**
     * Estimate the gas required to execute a user operation.
     *
     * @param userOperation - The user operation to estimate gas for.
     * @param entrypoint - The address of entrypoint to use for the user operation.
     * @returns The estimated gas limits for the user operation.
     */
    estimateUserOperationGas(userOperation: UserOperation, entrypoint: string): Promise<BundlerEstimateUserOperationGasResponse>;
    /**
     * Retrieve the receipt for a user operation.
     * @param hash - The hash of the user operation.
     * @returns The receipt for the user operation, or `undefined` if the user operation is pending.
     */
    getUserOperationReceipt(hash?: string): Promise<UserOperationReceipt | undefined>;
    /**
     * Submit a user operation to the bundler.
     * @param userOperation - The signed user operation to submit.
     * @param entrypoint - The address of entrypoint to use for the user operation.
     * @returns The hash of the user operation.
     */
    sendUserOperation(userOperation: UserOperation, entrypoint: string): Promise<string>;
}
//# sourceMappingURL=Bundler.d.ts.map