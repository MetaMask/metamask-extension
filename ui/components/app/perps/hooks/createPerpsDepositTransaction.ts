import { submitRequestToBackground } from '../../../../store/background-connection';

export type CreatePerpsDepositTransactionParams = {
  fromAddress: string;
  amount?: string;
};

export type CreatedPerpsDepositTransaction = {
  transactionId: string;
};

/**
 * Creates a perps deposit transaction via the background controller.
 *
 * @param params - Parameters for the deposit transaction
 * @param params.amount - Optional deposit amount
 * @returns The created transaction ID
 */
export async function createPerpsDepositTransaction({
  amount,
}: CreatePerpsDepositTransactionParams): Promise<CreatedPerpsDepositTransaction> {
  const transactionId = await submitRequestToBackground<string | null>(
    'perpsDepositWithConfirmation',
    [{ amount }],
  );

  if (!transactionId) {
    throw new Error(
      'Perps deposit transaction was not created by controller deposit flow',
    );
  }

  return { transactionId };
}
