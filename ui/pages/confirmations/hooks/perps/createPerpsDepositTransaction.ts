import { getPerpsController } from '../../../../providers/perps/getPerpsController';

export type CreatePerpsDepositTransactionParams = {
  fromAddress: string;
  amount?: string;
};

export type CreatedPerpsDepositTransaction = {
  transactionId: string;
};

export async function createPerpsDepositTransaction({
  fromAddress,
  amount,
}: CreatePerpsDepositTransactionParams): Promise<CreatedPerpsDepositTransaction> {
  const controller = await getPerpsController(fromAddress);

  await controller.depositWithConfirmation({ amount });

  const transactionId = controller.state.lastDepositTransactionId;

  if (!transactionId) {
    throw new Error(
      'Perps deposit transaction was not created by controller deposit flow',
    );
  }

  return { transactionId };
}
