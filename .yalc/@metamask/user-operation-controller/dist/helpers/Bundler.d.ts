import type { BundlerEstimateUserOperationGasResponse, UserOperation, UserOperationReceipt } from '../types';
export declare class Bundler {
    #private;
    constructor(url: string);
    estimateUserOperationGas(userOperation: UserOperation, entrypoint: string): Promise<BundlerEstimateUserOperationGasResponse>;
    getUserOperationReceipt(hash?: string): Promise<UserOperationReceipt | undefined>;
    sendUserOperation(userOperation: UserOperation, entrypoint: string): Promise<string>;
}
//# sourceMappingURL=Bundler.d.ts.map