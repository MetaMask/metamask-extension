import type {
  TransactionControllerAddTransactionBatchAction,
  TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { MoneyPayMessenger } from './pay-context';

const UNAPPROVED_TRANSACTION_ADDED =
  'TransactionController:unapprovedTransactionAdded' as const;

type AddTransactionBatchRequest = Parameters<
  TransactionControllerAddTransactionBatchAction['handler']
>[0];

/**
 * Submits a placeholder Money Account batch and resolves the id of the
 * transaction it creates.
 *
 * `addTransactionBatch` does not settle when the transaction is added: with
 * `disableHook` and `disableSequential` it takes the EIP-7702 path, which
 * awaits publication — and publication only happens once the user approves the
 * confirmation. Awaiting it during initiation therefore deadlocks the flow,
 * because the id it would eventually yield is exactly what the UI needs to
 * navigate to that confirmation. Mobile sidesteps this by navigating *before*
 * creating the batch; the extension navigates after creation, so it waits for
 * the unapproved transaction instead and leaves the batch promise running.
 *
 * @param messenger - The messenger to submit and subscribe through.
 * @param batchId - Batch id to create under, which identifies the transaction.
 * Always caller-supplied so the subscription is in place before submission.
 * @param request - The rest of the `addTransactionBatch` request.
 * @returns The created transaction's id.
 */
export async function submitPlaceholderBatch(
  messenger: MoneyPayMessenger,
  batchId: Hex,
  request: Omit<AddTransactionBatchRequest, 'batchId'>,
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let isSettled = false;

    const handleTransactionAdded = (transaction: TransactionMeta) => {
      if (
        isSettled ||
        transaction.batchId?.toLowerCase() !== batchId.toLowerCase()
      ) {
        return;
      }

      isSettled = true;
      messenger.unsubscribe(
        UNAPPROVED_TRANSACTION_ADDED,
        handleTransactionAdded,
      );
      resolve(transaction.id);
    };

    messenger.subscribe(UNAPPROVED_TRANSACTION_ADDED, handleTransactionAdded);

    messenger
      .call('TransactionController:addTransactionBatch', {
        ...request,
        batchId,
      })
      .catch((error: unknown) => {
        // Once the transaction exists, a rejection belongs to publication —
        // most often the user rejecting the confirmation — which initiation no
        // longer owns.
        if (isSettled) {
          return;
        }

        isSettled = true;
        messenger.unsubscribe(
          UNAPPROVED_TRANSACTION_ADDED,
          handleTransactionAdded,
        );
        reject(error);
      });
  });
}
