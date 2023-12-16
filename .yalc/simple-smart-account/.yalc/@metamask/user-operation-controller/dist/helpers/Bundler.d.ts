import type { UserOperation, UserOperationReceipt } from '../types';
export declare type BundlerEstimateUserOperationGasResponse = {
    preVerificationGas: number;
    verificationGas: number;
    verificationGasLimit: number;
    callGasLimit: number;
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
     * @returns The receipt for the user operation.
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