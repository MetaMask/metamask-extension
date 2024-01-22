import { type GasFeeState } from '@metamask/gas-fee-controller';
import type { Provider } from '@metamask/network-controller';
import type { TransactionParams } from '@metamask/transaction-controller';
import type { UserOperationMetadata } from '../types';
import type { AddUserOperationRequest } from '../UserOperationController';
export declare type UpdateGasFeesRequest = {
    getGasFeeEstimates: () => Promise<GasFeeState>;
    metadata: UserOperationMetadata;
    originalRequest: AddUserOperationRequest;
    provider: Provider;
    transaction?: TransactionParams;
};
/**
 * Populates the gas fee properties for a user operation.
 * @param request - The request to update the gas fees.
 * @param request.getGasFeeEstimates - A callback to get gas fee estimates.
 * @param request.metadata - The metadata for the user operation.
 * @param request.originalRequest - The original request to add the user operation.
 * @param request.provider - A provider to query the network.
 * @param request.transaction - The transaction that created the user operation.
 */
export declare function updateGasFees(request: UpdateGasFeesRequest): Promise<void>;
//# sourceMappingURL=gas-fees.d.ts.map