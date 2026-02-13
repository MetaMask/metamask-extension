import type {
  CreatePerpsDepositTransactionParams,
  CreatedPerpsDepositTransaction,
} from './createPerpsDepositTransaction';
import { createPerpsDepositTransaction } from './createPerpsDepositTransaction';

export type PreparePerpsDepositTransactionParams =
  CreatePerpsDepositTransactionParams;
export type PreparedPerpsDepositTransaction = CreatedPerpsDepositTransaction;

export const preparePerpsDepositTransaction = createPerpsDepositTransaction;
