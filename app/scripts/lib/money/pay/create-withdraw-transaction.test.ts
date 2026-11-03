import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { MUSD_TOKEN_ADDRESS_BY_CHAIN } from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { createMoneyAccountWithdrawTransaction } from './create-withdraw-transaction';
import {
  createPlaceholderBatchMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  VAULT_CONFIG_MOCK,
  type PlaceholderBatchMockOptions,
} from './test-mocks';

const TRANSACTION_ID = 'transaction-id-mock';

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];

function setup(
  options: Omit<PlaceholderBatchMockOptions, 'transactionId'> = {},
) {
  return createPlaceholderBatchMessengerMock({
    transactionId: TRANSACTION_ID,
    ...options,
  });
}

describe('createMoneyAccountWithdrawTransaction', () => {
  it('submits the placeholder batch from the money account and returns the transaction id', async () => {
    const { messenger, addTransactionBatch } = setup();

    const result = await createMoneyAccountWithdrawTransaction(messenger);

    const request = addTransactionBatch.mock.calls[0][0];

    expect(result).toStrictEqual({
      transactionId: TRANSACTION_ID,
      batchId: request.batchId,
    });
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
    // The batch id is generated here, not by the controller, so the created
    // transaction can be recognised as it is added.
    expect(request.batchId).toMatch(/^0x[0-9a-f]{32}$/u);

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

  it('throws when the batch fails before the transaction is added', async () => {
    const { messenger, unsubscribe } = setup({
      batchError: new Error('Account does not support EIP-7702'),
    });

    await expect(
      createMoneyAccountWithdrawTransaction(messenger),
    ).rejects.toThrow('Account does not support EIP-7702');
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
