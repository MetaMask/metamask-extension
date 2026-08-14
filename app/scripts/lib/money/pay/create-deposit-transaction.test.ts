import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { MUSD_TOKEN_ADDRESS_BY_CHAIN } from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { createMoneyAccountDepositTransaction } from './create-deposit-transaction';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  NETWORK_CLIENT_ID_MOCK,
  VAULT_CONFIG_MOCK,
  type MessengerMockOptions,
} from './test-mocks';

const BATCH_ID = '0xB47C41D0000000000000000000000000' as Hex;
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
        transactions: [
          { id: 'other-transaction', batchId: '0x1234' },
          { id: TRANSACTION_ID, batchId: BATCH_ID.toLowerCase() },
        ],
      }),
      ...options.handlers,
    },
  });

  return { ...mock, addTransactionBatch };
}

describe('createMoneyAccountDepositTransaction', () => {
  it('submits the placeholder batch from the money account and returns the transaction id', async () => {
    const { messenger, addTransactionBatch } = setup();

    const result = await createMoneyAccountDepositTransaction(
      messenger,
      BATCH_ID,
    );

    expect(result).toStrictEqual({
      transactionId: TRANSACTION_ID,
      batchId: BATCH_ID,
    });

    expect(addTransactionBatch).toHaveBeenCalledTimes(1);
    const request = addTransactionBatch.mock.calls[0][0];

    expect(request).toMatchObject({
      batchId: BATCH_ID,
      disableHook: true,
      disableSequential: true,
      disableUpgrade: true,
      from: MONEY_ACCOUNT_ADDRESS_MOCK,
      isGasFeeSponsored: true,
      isInternal: true,
      networkClientId: NETWORK_CLIENT_ID_MOCK,
      origin: ORIGIN_METAMASK,
      requiredAssets: [
        { address: MUSD_ADDRESS, amount: '0x0', standard: 'erc20' },
      ],
      skipInitialGasEstimate: true,
    });

    // The placeholder pair: approve on mUSD, deposit on the teller, neither
    // carrying calldata — Pay re-encodes them once the user picks an amount.
    const [approveTx, depositTx] = request.transactions;
    expect(approveTx).toStrictEqual({
      params: { to: MUSD_ADDRESS, value: '0x0' },
      type: TransactionType.tokenMethodApprove,
    });
    expect(depositTx).toStrictEqual({
      params: { to: VAULT_CONFIG_MOCK.tellerAddress, value: '0x0' },
      type: TransactionType.moneyAccountDeposit,
    });
  });

  it('throws when the money account is unavailable', async () => {
    const { messenger, addTransactionBatch } = setup({
      moneyAccountAddress: undefined,
    });

    await expect(
      createMoneyAccountDepositTransaction(messenger, BATCH_ID),
    ).rejects.toThrow('Money account deposit is not available');
    expect(addTransactionBatch).not.toHaveBeenCalled();
  });

  it('throws when the vault config is unserved', async () => {
    const { messenger } = setup({ remoteFeatureFlags: {} });

    await expect(
      createMoneyAccountDepositTransaction(messenger, BATCH_ID),
    ).rejects.toThrow('Money account deposit is not available');
  });

  it('throws when the created transaction cannot be found', async () => {
    const { messenger } = setup({
      handlers: {
        'TransactionController:getState': () => ({ transactions: [] }),
      },
    });

    await expect(
      createMoneyAccountDepositTransaction(messenger, BATCH_ID),
    ).rejects.toThrow('Deposit transaction not found after batch creation');
  });
});
