import { type TransactionParams } from '../types';
/**
 * Validates whether a transaction initiated by a specific 'from' address is permitted by the origin.
 *
 * @param permittedAddresses - The permitted accounts for the given origin.
 * @param selectedAddress - The currently selected Ethereum address in the wallet.
 * @param from - The address from which the transaction is initiated.
 * @param origin - The origin or source of the transaction.
 * @throws Throws an error if the transaction is not permitted.
 */
export declare function validateTransactionOrigin(permittedAddresses: string[], selectedAddress: string, from: string, origin: string): Promise<void>;
/**
 * Validates the transaction params for required properties and throws in
 * the event of any validation error.
 *
 * @param txParams - Transaction params object to validate.
 * @param isEIP1559Compatible - whether or not the current network supports EIP-1559 transactions.
 */
export declare function validateTxParams(txParams: TransactionParams, isEIP1559Compatible?: boolean): void;
//# sourceMappingURL=validation.d.ts.map