import type { UserOperationStruct } from '@account-abstraction/contracts';
export declare class HttpRpcClient {
    readonly bundlerUrl: string;
    readonly entryPointAddress: string;
    readonly chainId: number;
    private readonly userOpJsonRpcProvider;
    initializing: Promise<void>;
    constructor(bundlerUrl: string, entryPointAddress: string, chainId: number);
    validateChainId(): Promise<void>;
    /**
     * send a UserOperation to the bundler
     * @param userOp1
     * @returns userOpHash the id of this operation, for getUserOperationTransaction
     */
    sendUserOpToBundler(userOp1: UserOperationStruct): Promise<string>;
    /**
     * estimate gas requirements for UserOperation
     * @param userOp1
     * @returns latest gas suggestions made by the bundler.
     */
    estimateUserOpGas(userOp1: Partial<UserOperationStruct>): Promise<{
        callGasLimit: number;
        preVerificationGas: number;
        verificationGasLimit: number;
    }>;
    private printUserOperation;
}
