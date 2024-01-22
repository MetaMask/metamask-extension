import type EthQuery from '@metamask/eth-query';
import type { InferTransactionTypeResult, TransactionParams } from '../types';
export declare const ESTIMATE_GAS_ERROR = "eth_estimateGas rpc method error";
/**
 * Determines the type of the transaction by analyzing the txParams.
 * It will never return TRANSACTION_TYPE_CANCEL or TRANSACTION_TYPE_RETRY as these
 * represent specific events that we specify manually at transaction creation.
 *
 * @param txParams - Parameters for the transaction.
 * @param ethQuery - EthQuery instance.
 * @returns A object with the transaction type and the contract code response in Hex.
 */
export declare function determineTransactionType(txParams: TransactionParams, ethQuery: EthQuery): Promise<InferTransactionTypeResult>;
//# sourceMappingURL=transaction-type.d.ts.map