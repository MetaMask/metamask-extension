import { submitRequestToBackground } from '../../../../store/background-connection';

export type CreatePerpsWithdrawTransactionParams = {
  amount: string;
  assetId: string;
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
 * @param params.assetId
 * @returns The withdraw result
 */
export async function createPerpsWithdrawTransaction({
  amount,
  assetId,
}: CreatePerpsWithdrawTransactionParams): Promise<CreatedPerpsWithdrawTransaction> {
  return submitRequestToBackground<CreatedPerpsWithdrawTransaction>(
    'perpsWithdraw',
    [{ amount, assetId }],
  );
}
