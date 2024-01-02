import type { TransactionMeta } from '@metamask/transaction-controller';
import type { UserOperationMetadata } from '../types';
/**
 * Converts a user operation metadata object into a transaction metadata object.
 * @param metadata - The user operation metadata object to convert.
 * @returns The equivalent transaction metadata object.
 */
export declare function getTransactionMetadata(metadata: UserOperationMetadata): TransactionMeta | undefined;
//# sourceMappingURL=transaction.d.ts.map