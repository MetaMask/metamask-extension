import { submitRequestToBackground } from '../../../../store/background-connection';

export type CreatePerpsDepositTransactionParams = {
  fromAddress: string;
  amount?: string;
};

export type CreatedPerpsDepositTransaction = {
  transactionId: string;
};

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
