import type {
  TransactionMeta,
  TransactionControllerState,
} from '@metamask/transaction-controller';
import type {
  TransactionPayControllerMessenger,
  TransactionPayControllerState,
} from '@metamask/transaction-pay-controller';

/**
 * Persist the MM Pay sending USD amount on the transaction so metrics can use
 * it after the non-persisted TransactionPayController data is removed.
 *
 * @param messenger - Transaction Pay controller messenger.
 */
export function subscribePersistPayMetadata(
  messenger: TransactionPayControllerMessenger,
): void {
  messenger.subscribe(
    'TransactionPayController:stateChange',
    (state: TransactionPayControllerState) => {
      for (const [transactionId, transactionData] of Object.entries(
        state.transactionData,
      )) {
        const primaryRequiredToken = transactionData.tokens?.find(
          (token) => !token.skipIfBalance,
        );
        const sending = primaryRequiredToken?.amountUsd;

        if (sending === undefined) {
          continue;
        }

        const transaction = getTransaction(messenger, transactionId);

        if (!transaction) {
          continue;
        }

        const persistedSending = transaction.assetsFiatValues?.sending;

        if (persistedSending === sending) {
          continue;
        }

        messenger.call(
          'TransactionController:updateTransaction',
          {
            ...transaction,
            assetsFiatValues: {
              ...transaction.assetsFiatValues,
              sending,
            },
          },
          'Persist MM Pay sending fiat value',
        );
      }
    },
  );
}

function getTransaction(
  messenger: TransactionPayControllerMessenger,
  transactionId: string,
): TransactionMeta | undefined {
  const state = messenger.call(
    'TransactionController:getState',
  ) as TransactionControllerState;

  return state.transactions.find(({ id }) => id === transactionId);
}
