import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { MUSD_TOKEN_ADDRESS_BY_CHAIN } from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { createMoneyAccountWithdrawTransaction } from './create-withdraw-transaction';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  VAULT_CONFIG_MOCK,
  type MessengerMockOptions,
} from './test-mocks';

const BATCH_ID = '0xW1'.replace('W', 'a') as Hex;
const TRANSACTION_ID = 'transaction-id-mock';

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];

function setup(options: MessengerMockOptions = {}) {
  const addTransactionBatch = jest
    .fn()
    .mockResolvedValue({ batchId: BATCH_ID });

  const mock = createMoneyPayMessengerMock({
    ...options,
    handlers: {
      'TransactionController:addTransactionBatch': addTransactionBatch,
      'TransactionController:getState': () => ({
        transactions: [{ id: TRANSACTION_ID, batchId: BATCH_ID }],
      }),
      ...options.handlers,
    },
  });

  return { ...mock, addTransactionBatch };
}

describe('createMoneyAccountWithdrawTransaction', () => {
  it('submits the placeholder batch from the money account and returns the transaction id', async () => {
    const { messenger, addTransactionBatch } = setup();

    const result = await createMoneyAccountWithdrawTransaction(messenger);

    expect(result).toStrictEqual({
      transactionId: TRANSACTION_ID,
      batchId: BATCH_ID,
    });

    const request = addTransactionBatch.mock.calls[0][0];
    expect(request).toMatchObject({
      disableHook: true,
      disableSequential: true,
      disableUpgrade: true,
      from: MONEY_ACCOUNT_ADDRESS_MOCK,
      isGasFeeSponsored: true,
      isInternal: true,
      networkClientId: NETWORK_CLIENT_ID_MOCK,
      origin: ORIGIN_METAMASK,
      skipInitialGasEstimate: true,
    });
    // No requiredAssets: the withdrawal consumes the vault balance.
    expect(request.requiredAssets).toBeUndefined();
    // No caller batch id: withdrawals have no deposit-intent map to key.
    expect(request.batchId).toBeUndefined();

    const [withdrawTx, transferTx] = request.transactions;
    expect(withdrawTx).toStrictEqual({
      params: { to: VAULT_CONFIG_MOCK.tellerAddress, value: '0x0' },
      type: TransactionType.moneyAccountWithdraw,
    });
    expect(transferTx).toStrictEqual({
      params: { to: MUSD_ADDRESS, value: '0x0' },
      type: TransactionType.tokenMethodTransfer,
    });
  });

  it('throws when the money account is unavailable', async () => {
    const { messenger, addTransactionBatch } = setup({
      moneyAccountAddress: undefined,
    });

    await expect(
      createMoneyAccountWithdrawTransaction(messenger),
    ).rejects.toThrow('Money account withdrawal is not available');
    expect(addTransactionBatch).not.toHaveBeenCalled();
  });

  it('throws when the created transaction cannot be found', async () => {
    const { messenger } = setup({
      handlers: {
        'TransactionController:getState': () => ({ transactions: [] }),
      },
    });

    await expect(
      createMoneyAccountWithdrawTransaction(messenger),
    ).rejects.toThrow('Withdrawal transaction not found after batch creation');
  });
});
