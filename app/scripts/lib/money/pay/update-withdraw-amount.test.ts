import { buildMoneyAccountWithdrawBatch } from '@metamask/money-account-utils';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { updateMoneyAccountWithdrawAmount } from './update-withdraw-amount';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  VAULT_CONFIG_MOCK,
} from './test-mocks';

jest.mock('@metamask/money-account-utils', () => ({
  ...jest.requireActual('@metamask/money-account-utils'),
  buildMoneyAccountWithdrawBatch: jest.fn(),
}));

const buildWithdrawBatchMock = jest.mocked(buildMoneyAccountWithdrawBatch);

const TRANSACTION_ID = 'withdraw-amount-tx';
const ACCOUNT_OVERRIDE = '0xabcdef1234567890abcdef1234567890abcdef12' as Hex;
const SELECTED_ACCOUNT = '0x1111111111111111111111111111111111111111' as Hex;
const WITHDRAW_DATA = '0xaaa1' as Hex;
const TRANSFER_DATA = '0xbbb2' as Hex;
const WITHDRAW_DATA_2 = '0xccc3' as Hex;
const TRANSFER_DATA_2 = '0xddd4' as Hex;

type UpdateTransactionMetadataOptions = {
  transactionId: string;
  callback: (transaction: TransactionMeta) => void;
};

function getUpdateCallback(
  updateTransactionMetadata: jest.Mock,
): UpdateTransactionMetadataOptions['callback'] {
  const [options] = updateTransactionMetadata.mock.calls[0] as [
    UpdateTransactionMetadataOptions,
  ];
  return options.callback;
}

function createWithdrawTransaction(): TransactionMeta {
  return {
    id: TRANSACTION_ID,
    status: TransactionStatus.unapproved,
    txParams: {
      from: MONEY_ACCOUNT_ADDRESS_MOCK,
      data: '0x',
    },
    nestedTransactions: [
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        value: '0x0',
        type: TransactionType.moneyAccountWithdraw,
      },
      {
        to: VAULT_CONFIG_MOCK.underlyingToken,
        value: '0x0',
        type: TransactionType.tokenMethodTransfer,
      },
    ],
  } as unknown as TransactionMeta;
}

function setup({
  transactions = [createWithdrawTransaction()],
  selectedAddress = SELECTED_ACCOUNT,
}: {
  transactions?: TransactionMeta[];
  selectedAddress?: string;
} = {}) {
  const updateTransactionMetadata = jest.fn((options: unknown) => {
    const { transactionId, callback } =
      options as UpdateTransactionMetadataOptions;
    const transaction = transactions.find(({ id }) => id === transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    callback(transaction);
    return transaction;
  });
  const mock = createMoneyPayMessengerMock({
    handlers: {
      'TransactionController:getState': () => ({ transactions }),
      'TransactionController:updateTransactionMetadata':
        updateTransactionMetadata,
      'AccountsController:getSelectedAccount': () => ({
        address: selectedAddress,
      }),
    },
  });
  return { ...mock, updateTransactionMetadata };
}

describe('updateMoneyAccountWithdrawAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildWithdrawBatchMock.mockImplementation(async () => ({
      withdrawTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: WITHDRAW_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountWithdraw,
      },
      transferTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: TRANSFER_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodTransfer,
      },
    }));
  });

  it('encodes withdraw + transfer calldata for the account override recipient', async () => {
    const { messenger, updateTransactionMetadata } = setup();

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      ACCOUNT_OVERRIDE,
    );

    expect(result).toStrictEqual({
      withdrawData: WITHDRAW_DATA,
      transferData: TRANSFER_DATA,
      transactionData: expect.stringMatching(/^0x/u),
    });
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1_000_000n,
        moneyAccountAddress: MONEY_ACCOUNT_ADDRESS_MOCK,
        recipient: ACCOUNT_OVERRIDE,
        tellerAddress: VAULT_CONFIG_MOCK.tellerAddress,
        accountantAddress: VAULT_CONFIG_MOCK.accountantAddress,
      }),
    );

    const nextTransaction = createWithdrawTransaction();
    getUpdateCallback(updateTransactionMetadata)(nextTransaction);
    expect(nextTransaction.nestedTransactions?.[0].data).toBe(WITHDRAW_DATA);
    expect(nextTransaction.nestedTransactions?.[1].data).toBe(TRANSFER_DATA);
    expect(nextTransaction.requiredAssets).toBeUndefined();
  });

  it('falls back to the selected account when no override is set', async () => {
    const { messenger } = setup();

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
    );

    expect(result).toStrictEqual({
      withdrawData: WITHDRAW_DATA,
      transferData: TRANSFER_DATA,
      transactionData: expect.stringMatching(/^0x/u),
    });
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: SELECTED_ACCOUNT }),
    );
  });

  it('continues to round fractional mUSD up before encoding', async () => {
    const { messenger } = setup();

    await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1.0000005',
    );

    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1_000_001n }),
    );
  });

  it('returns false for a zero amount without encoding', async () => {
    const { messenger, updateTransactionMetadata } = setup();

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '0',
    );

    expect(result).toBe(false);
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
    expect(updateTransactionMetadata).not.toHaveBeenCalled();
  });

  it('throws when no valid recipient is available', async () => {
    const { messenger } = setup({ selectedAddress: 'not-hex' });

    await expect(
      updateMoneyAccountWithdrawAmount(messenger, TRANSACTION_ID, '1'),
    ).rejects.toThrow('Withdrawal recipient is not available');
  });

  it('lets a later typed amount supersede an in-flight encode', async () => {
    const { messenger, updateTransactionMetadata } = setup();
    let resolveFirst: (value: unknown) => void = () => undefined;

    buildWithdrawBatchMock
      .mockImplementationOnce(
        async () =>
          await new Promise((resolve) => {
            resolveFirst = resolve as typeof resolveFirst;
          }),
      )
      .mockResolvedValueOnce({
        withdrawTx: {
          params: {
            to: VAULT_CONFIG_MOCK.tellerAddress,
            data: WITHDRAW_DATA_2,
            value: '0x0',
          },
          type: TransactionType.moneyAccountWithdraw,
        },
        transferTx: {
          params: {
            to: VAULT_CONFIG_MOCK.underlyingToken,
            data: TRANSFER_DATA_2,
            value: '0x0',
          },
          type: TransactionType.tokenMethodTransfer,
        },
      });

    const first = updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      ACCOUNT_OVERRIDE,
    );
    const second = updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '2',
      ACCOUNT_OVERRIDE,
    );

    await expect(second).resolves.toStrictEqual({
      withdrawData: WITHDRAW_DATA_2,
      transferData: TRANSFER_DATA_2,
      transactionData: expect.stringMatching(/^0x/u),
    });
    resolveFirst({
      withdrawTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: WITHDRAW_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountWithdraw,
      },
      transferTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: TRANSFER_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodTransfer,
      },
    });
    await expect(first).resolves.toBe(false);
    expect(updateTransactionMetadata).toHaveBeenCalledTimes(1);
  });
});
