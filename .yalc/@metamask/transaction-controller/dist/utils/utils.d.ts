import type { GasPriceValue, FeeMarketEIP1559Values } from '../TransactionController';
import type { TransactionParams, TransactionMeta, TransactionError } from '../types';
export declare const ESTIMATE_GAS_ERROR = "eth_estimateGas rpc method error";
/**
 * Normalizes properties on transaction params.
 *
 * @param txParams - The transaction params to normalize.
 * @returns Normalized transaction params.
 */
export declare function normalizeTxParams(txParams: TransactionParams): TransactionParams;
/**
 * Checks if a transaction is EIP-1559 by checking for the existence of
 * maxFeePerGas and maxPriorityFeePerGas within its parameters.
 *
 * @param txParams - Transaction params object to add.
 * @returns Boolean that is true if the transaction is EIP-1559 (has maxFeePerGas and maxPriorityFeePerGas), otherwise returns false.
 */
export declare function isEIP1559Transaction(txParams: TransactionParams): boolean;
export declare const validateGasValues: (gasValues: GasPriceValue | FeeMarketEIP1559Values) => void;
export declare const isFeeMarketEIP1559Values: (gasValues?: GasPriceValue | FeeMarketEIP1559Values) => gasValues is FeeMarketEIP1559Values;
export declare const isGasPriceValue: (gasValues?: GasPriceValue | FeeMarketEIP1559Values) => gasValues is GasPriceValue;
export declare const getIncreasedPriceHex: (value: number, rate: number) => string;
export declare const getIncreasedPriceFromExisting: (value: string | undefined, rate: number) => string;
/**
 * Validates that the proposed value is greater than or equal to the minimum value.
 *
 * @param proposed - The proposed value.
 * @param min - The minimum value.
 * @returns The proposed value.
 * @throws Will throw if the proposed value is too low.
 */
export declare function validateMinimumIncrease(proposed: string, min: string): string;
/**
 * Validates that a transaction is unapproved.
 * Throws if the transaction is not unapproved.
 *
 * @param transactionMeta - The transaction metadata to check.
 * @param fnName - The name of the function calling this helper.
 */
export declare function validateIfTransactionUnapproved(transactionMeta: TransactionMeta | undefined, fnName: string): void;
/**
 * Normalizes properties on transaction params.
 *
 * @param error - The error to be normalize.
 * @returns Normalized transaction error.
 */
export declare function normalizeTxError(error: Error & {
    code?: string;
    value?: unknown;
}): TransactionError;
/**
 * Normalize an object containing gas fee values.
 *
 * @param gasFeeValues - An object containing gas fee values.
 * @returns An object containing normalized gas fee values.
 */
export declare function normalizeGasFeeValues(gasFeeValues: GasPriceValue | FeeMarketEIP1559Values): GasPriceValue | FeeMarketEIP1559Values;
//# sourceMappingURL=utils.d.ts.map