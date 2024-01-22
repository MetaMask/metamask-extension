/// <reference types="debug" />
import type EthQuery from '@metamask/eth-query';
import type { ProviderConfig } from '@metamask/network-controller';
import type { TransactionMeta, TransactionParams } from '../types';
export declare type UpdateGasRequest = {
    ethQuery: EthQuery;
    providerConfig: ProviderConfig;
    txMeta: TransactionMeta;
};
export declare const log: import("debug").Debugger;
export declare const FIXED_GAS = "0x5208";
export declare const DEFAULT_GAS_MULTIPLIER = 1.5;
export declare function updateGas(request: UpdateGasRequest): Promise<void>;
export declare function estimateGas(txParams: TransactionParams, ethQuery: EthQuery): Promise<{
    blockGasLimit: string;
    estimatedGas: string;
    simulationFails: {
        reason: any;
        errorKey: any;
        debug: {
            blockNumber: string;
            blockGasLimit: string;
        };
    } | undefined;
}>;
export declare function addGasBuffer(estimatedGas: string, blockGasLimit: string, multiplier: number): string;
//# sourceMappingURL=gas.d.ts.map