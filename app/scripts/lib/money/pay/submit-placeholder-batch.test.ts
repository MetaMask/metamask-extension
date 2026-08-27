import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { submitPlaceholderBatch } from './submit-placeholder-batch';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  type BatchRequestMock,
} from './test-mocks';

const BATCH_ID = '0xB47C41D0000000000000000000000000' as Hex;
const TRANSACTION_ID = 'transaction-id-mock';

const REQUEST = {
  from: MONEY_ACCOUNT_ADDRESS_MOCK,
  networkClientId: NETWORK_CLIENT_ID_MOCK,
  transactions: [],
};

/**
 * A messenger whose `addTransactionBatch` publishes the added transactions and
 * then hands publication control back to the test, since the real batch
 * settles only once the confirmation is approved or rejected.
 *
 * @param added - Transactions to publish as added, in order.
 * @returns The messenger mock and the publication rejector.
 */
function setup(added: Partial<TransactionMeta>[]) {
  const publication: { reject?: (error: Error) => void } = {};
  const emitter: {
    emit?: (transaction: Partial<TransactionMeta>) => void;
  } = {};

  const addTransactionBatch = async (): Promise<never> => {
    added.forEach((transaction) => emitter.emit?.(transaction));

    return await new Promise<never>((_resolve, reject) => {
      publication.reject = reject;
    });
  };

  const mock = createMoneyPayMessengerMock({
    handlers: {
      'TransactionController:addTransactionBatch':
        addTransactionBatch as unknown as (...args: unknown[]) => unknown,
    },
  });

  emitter.emit = mock.emitUnapprovedTransactionAdded;

  return { ...mock, publication };
}

describe('submitPlaceholderBatch', () => {
  it('resolves with the transaction created for the batch id', async () => {
    const { messenger, call, unsubscribe } = setup([
      { id: 'unrelated-transaction', batchId: '0xffff' },
      { id: TRANSACTION_ID, batchId: BATCH_ID.toLowerCase() as Hex },
    ]);

    await expect(
      submitPlaceholderBatch(messenger, BATCH_ID, REQUEST),
    ).resolves.toBe(TRANSACTION_ID);

    expect(call).toHaveBeenCalledWith(
      'TransactionController:addTransactionBatch',
      { ...REQUEST, batchId: BATCH_ID } as BatchRequestMock,
    );
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('ignores a batch rejection once the transaction was added', async () => {
    const { messenger, unsubscribe, publication } = setup([
      { id: TRANSACTION_ID, batchId: BATCH_ID },
    ]);

    const transactionId = await submitPlaceholderBatch(
      messenger,
      BATCH_ID,
      REQUEST,
    );

    // A user rejecting the confirmation surfaces here, long after initiation
    // handed the transaction id back.
    publication.reject?.(new Error('User rejected the request'));
    await Promise.resolve();

    expect(transactionId).toBe(TRANSACTION_ID);
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
