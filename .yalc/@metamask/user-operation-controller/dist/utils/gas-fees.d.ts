import type { GasFeeState } from '@metamask/gas-fee-controller';
import { UserOperationMetadata } from '../types';
import { TransactionParams } from '@metamask/transaction-controller';
import { Web3Provider } from '@ethersproject/providers';
export declare type UpdateGasFeesRequest = {
    getGasFeeEstimates: () => Promise<GasFeeState>;
    metadata: UserOperationMetadata;
    provider: Web3Provider;
};
export declare type GetGasFeeRequest = UpdateGasFeesRequest & {
    initialParams: TransactionParams;
    suggestedGasFees: Awaited<ReturnType<typeof getSuggestedGasFees>>;
};
export declare function updateGasFees(request: UpdateGasFeesRequest): Promise<void>;
declare function getSuggestedGasFees(request: UpdateGasFeesRequest): Promise<{
    maxFeePerGas?: undefined;
    maxPriorityFeePerGas?: undefined;
} | {
    maxFeePerGas: string | undefined;
    maxPriorityFeePerGas: string | undefined;
}>;
export {};
//# sourceMappingURL=gas-fees.d.ts.map