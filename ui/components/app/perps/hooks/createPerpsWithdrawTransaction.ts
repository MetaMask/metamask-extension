import { submitRequestToBackground } from '../../../../store/background-connection';

export type CreatePerpsWithdrawTransactionParams = {
  amount: string;
};

export type CreatedPerpsWithdrawTransaction = {
  success: boolean;
  error?: string;
  txHash?: string;
  withdrawalId?: string;
};

/**
 * Creates a perps withdraw request via the background controller.
 *
 * @param params - Parameters for the withdraw request
 * @param params.amount - Withdraw amount
 * @returns The withdraw result
 */
export async function createPerpsWithdrawTransaction({
  amount,
}: CreatePerpsWithdrawTransactionParams): Promise<CreatedPerpsWithdrawTransaction> {
  return submitRequestToBackground<CreatedPerpsWithdrawTransaction>(
    'perpsWithdraw',
    [{ amount }],
  );
}
