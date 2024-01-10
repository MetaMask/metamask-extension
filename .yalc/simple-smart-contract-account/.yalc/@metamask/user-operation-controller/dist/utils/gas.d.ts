import type { PrepareUserOperationResponse, UserOperationMetadata } from '../types';
/**
 * Populates the gas properties for a user operation.
 * @param metadata - The metadata for the user operation.
 * @param prepareResponse - The prepare response from the smart contract account.
 */
export declare function updateGas(metadata: UserOperationMetadata, prepareResponse: PrepareUserOperationResponse): Promise<void>;
//# sourceMappingURL=gas.d.ts.map