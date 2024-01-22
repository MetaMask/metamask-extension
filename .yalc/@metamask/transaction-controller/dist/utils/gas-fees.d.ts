import type EthQuery from '@metamask/eth-query';
import type { GasFeeState } from '@metamask/gas-fee-controller';
import type { SavedGasFees, TransactionParams, TransactionMeta } from '../types';
export declare type UpdateGasFeesRequest = {
    eip1559: boolean;
    ethQuery: EthQuery;
    getSavedGasFees: () => SavedGasFees | undefined;
    getGasFeeEstimates: () => Promise<GasFeeState>;
    txMeta: TransactionMeta;
};
export declare type GetGasFeeRequest = UpdateGasFeesRequest & {
    savedGasFees?: SavedGasFees;
    initialParams: TransactionParams;
    suggestedGasFees: Awaited<ReturnType<typeof getSuggestedGasFees>>;
};
export declare function updateGasFees(request: UpdateGasFeesRequest): Promise<void>;
declare function getSuggestedGasFees(request: UpdateGasFeesRequest): Promise<{
    maxFeePerGas?: undefined;
    maxPriorityFeePerGas?: undefined;
    gasPrice?: undefined;
} | {
    maxFeePerGas: `0x${string}`;
    maxPriorityFeePerGas: `0x${string}`;
    gasPrice?: undefined;
} | {
    gasPrice: string | undefined;
    maxFeePerGas?: undefined;
    maxPriorityFeePerGas?: undefined;
}>;
export {};
//# sourceMappingURL=gas-fees.d.ts.map