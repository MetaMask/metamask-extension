import { getPerpsController } from '../../../../providers/perps/getPerpsController';

export type PreparePerpsDepositTransactionParams = {
  fromAddress: string;
  amount?: string;
};

export type PreparedPerpsDepositTransaction = {
  transactionId: string;
};

export async function preparePerpsDepositTransaction({
  fromAddress,
  amount,
}: PreparePerpsDepositTransactionParams): Promise<PreparedPerpsDepositTransaction> {
  console.info('[PerpsDepositDebug] prepare:start', {
    fromAddress,
    amount,
  });

  const controller = await getPerpsController(fromAddress);

  await controller.depositWithConfirmation(amount);

  const transactionId = controller.state.lastDepositTransactionId;

  console.info('[PerpsDepositDebug] prepare:controller-state', {
    transactionId,
  });

  if (!transactionId) {
    throw new Error(
      'Perps deposit transaction was not created by controller deposit flow',
    );
  }

  return { transactionId };
}
