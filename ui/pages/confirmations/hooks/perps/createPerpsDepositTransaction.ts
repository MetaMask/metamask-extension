import type { PerpsController } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../../../store/background-connection';

export type CreatePerpsDepositTransactionParams = {
  fromAddress: string;
  amount?: string;
  /** When provided (e.g. from usePerpsController), uses controller instead of RPC */
  controller?: PerpsController;
};

export type CreatedPerpsDepositTransaction = {
  transactionId: string;
};

export async function createPerpsDepositTransaction({
  amount,
  controller,
}: CreatePerpsDepositTransactionParams): Promise<CreatedPerpsDepositTransaction> {
  const transactionId = controller
    ? await (
        controller as {
          depositWithConfirmation: (p: {
            amount?: string;
          }) => Promise<string | null>;
        }
      ).depositWithConfirmation({ amount })
    : await submitRequestToBackground<string | null>(
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
