import { buildMoneyAccountDepositBatch } from '@metamask/money-account-utils';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  getMoneyAccountAmountData,
  updateMoneyAccountDepositAmount,
} from './update-deposit-amount';
import { createMoneyPayMessengerMock, VAULT_CONFIG_MOCK } from './test-mocks';

jest.mock('@metamask/money-account-utils', () => ({
  ...jest.requireActual('@metamask/money-account-utils'),
  buildMoneyAccountDepositBatch: jest.fn(),
}));

const buildDepositBatchMock = jest.mocked(buildMoneyAccountDepositBatch);

const TRANSACTION_ID = 'deposit-amount-tx';
const APPROVE_DATA = '0xaaa1' as Hex;
const DEPOSIT_DATA = '0xbbb2' as Hex;
const APPROVE_DATA_2 = '0xccc3' as Hex;
const DEPOSIT_DATA_2 = '0xddd4' as Hex;

function createDepositTransaction(): TransactionMeta {
  return {
    id: TRANSACTION_ID,
    status: TransactionStatus.unapproved,
    txParams: {
      from: '0x4444444444444444444444444444444444444444',
      data: '0x',
    },
    nestedTransactions: [
      {
        to: VAULT_CONFIG_MOCK.underlyingToken,
        value: '0x0',
        type: TransactionType.tokenMethodApprove,
      },
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        value: '0x0',
        type: TransactionType.moneyAccountDeposit,
      },
    ],
    requiredAssets: [
      {
        address: VAULT_CONFIG_MOCK.underlyingToken,
        amount: '0x0',
        standard: 'erc20',
      },
    ],
  } as unknown as TransactionMeta;
}

function setup(transactions: TransactionMeta[] = [createDepositTransaction()]) {
  const updateTransaction = jest.fn();
  const mock = createMoneyPayMessengerMock({
    handlers: {
      'TransactionController:getState': () => ({ transactions }),
      'TransactionController:updateTransaction': updateTransaction,
    },
  });
  return { ...mock, updateTransaction };
}

describe('updateMoneyAccountDepositAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildDepositBatchMock.mockResolvedValue({
      approveTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: APPROVE_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodApprove,
      },
      depositTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: DEPOSIT_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountDeposit,
      },
    });
  });

  it('encodes approve + deposit calldata and writes requiredAssets so Pay can quote', async () => {
    const { messenger, updateTransaction } = setup();

    const didCommit = await updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '1',
    );

    expect(didCommit).toBe(true);
    expect(buildDepositBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1_000_000n,
        boringVault: VAULT_CONFIG_MOCK.boringVault,
        tellerAddress: VAULT_CONFIG_MOCK.tellerAddress,
        accountantAddress: VAULT_CONFIG_MOCK.accountantAddress,
        lensAddress: VAULT_CONFIG_MOCK.lensAddress,
        chainId: VAULT_CONFIG_MOCK.chainId,
      }),
    );

    expect(updateTransaction).toHaveBeenCalledTimes(2);
    const [assetsOnly] = updateTransaction.mock.calls[0];
    expect(assetsOnly.requiredAssets[0].amount).toBe('0xf4240');
    expect(assetsOnly.nestedTransactions[0].data).toBeUndefined();

    const [withCalldata] = updateTransaction.mock.calls[1];
    expect(withCalldata.nestedTransactions[0].data).toBe(APPROVE_DATA);
    expect(withCalldata.nestedTransactions[1].data).toBe(DEPOSIT_DATA);
    expect(withCalldata.txParams.data).not.toBe('0x');
    expect(withCalldata.requiredAssets[0].amount).toBe('0xf4240');
  });

  it('writes requiredAssets before vault encoding so quotes do not wait on RPC', async () => {
    const { messenger, updateTransaction } = setup();
    let resolveEncode: (value: unknown) => void = () => undefined;
    buildDepositBatchMock.mockImplementationOnce(
      async () =>
        await new Promise((resolve) => {
          resolveEncode = resolve as typeof resolveEncode;
        }),
    );

    const commit = updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '1',
    );

    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction.mock.calls[0][0].requiredAssets[0].amount).toBe(
      '0xf4240',
    );

    resolveEncode({
      approveTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: APPROVE_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodApprove,
      },
      depositTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: DEPOSIT_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountDeposit,
      },
    });
    await expect(commit).resolves.toBe(true);
  });

  it('returns false for a zero amount without encoding', async () => {
    const { messenger, updateTransaction } = setup();

    const didCommit = await updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '0',
    );

    expect(didCommit).toBe(false);
    expect(buildDepositBatchMock).not.toHaveBeenCalled();
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it('returns false when the transaction is gone', async () => {
    const { messenger, updateTransaction } = setup([]);

    const didCommit = await updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '1',
    );

    expect(didCommit).toBe(false);
    expect(updateTransaction).not.toHaveBeenCalled();
  });

  it('throws when the money account is unavailable', async () => {
    const updateTransaction = jest.fn();
    const { messenger } = createMoneyPayMessengerMock({
      moneyAccountAddress: undefined,
      handlers: {
        'TransactionController:getState': () => ({
          transactions: [createDepositTransaction()],
        }),
        'TransactionController:updateTransaction': updateTransaction,
      },
    });

    await expect(
      updateMoneyAccountDepositAmount(messenger, TRANSACTION_ID, '1'),
    ).rejects.toThrow('Money account deposit is not available');
    expect(updateTransaction).toHaveBeenCalledTimes(1);
    expect(updateTransaction.mock.calls[0][0].requiredAssets[0].amount).toBe(
      '0xf4240',
    );
  });

  it('lets a later typed amount supersede an in-flight encode', async () => {
    const { messenger, updateTransaction } = setup();
    let resolveFirst: (value: unknown) => void = () => undefined;

    buildDepositBatchMock
      .mockImplementationOnce(
        async () =>
          await new Promise((resolve) => {
            resolveFirst = resolve as typeof resolveFirst;
          }),
      )
      .mockResolvedValueOnce({
        approveTx: {
          params: {
            to: VAULT_CONFIG_MOCK.underlyingToken,
            data: APPROVE_DATA_2,
            value: '0x0',
          },
          type: TransactionType.tokenMethodApprove,
        },
        depositTx: {
          params: {
            to: VAULT_CONFIG_MOCK.tellerAddress,
            data: DEPOSIT_DATA_2,
            value: '0x0',
          },
          type: TransactionType.moneyAccountDeposit,
        },
      });

    const first = updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '1',
    );
    const second = updateMoneyAccountDepositAmount(
      messenger,
      TRANSACTION_ID,
      '2',
    );

    await expect(second).resolves.toBe(true);
    resolveFirst({
      approveTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: APPROVE_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodApprove,
      },
      depositTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: DEPOSIT_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountDeposit,
      },
    });
    await expect(first).resolves.toBe(false);

    // Immediate requiredAssets writes for both intents, plus nested calldata
    // for the later one only.
    expect(updateTransaction).toHaveBeenCalledTimes(3);
    expect(updateTransaction.mock.calls[0][0].requiredAssets[0].amount).toBe(
      '0xf4240',
    );
    expect(updateTransaction.mock.calls[1][0].requiredAssets[0].amount).toBe(
      '0x1e8480',
    );
    expect(updateTransaction.mock.calls[2][0].nestedTransactions[0].data).toBe(
      APPROVE_DATA_2,
    );
  });
});

describe('getMoneyAccountAmountData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildDepositBatchMock.mockResolvedValue({
      approveTx: {
        params: {
          to: VAULT_CONFIG_MOCK.underlyingToken,
          data: APPROVE_DATA,
          value: '0x0',
        },
        type: TransactionType.tokenMethodApprove,
      },
      depositTx: {
        params: {
          to: VAULT_CONFIG_MOCK.tellerAddress,
          data: DEPOSIT_DATA,
          value: '0x0',
        },
        type: TransactionType.moneyAccountDeposit,
      },
    });
  });

  it('returns nested calldata updates for a deposit', async () => {
    const { messenger } = setup();

    const result = await getMoneyAccountAmountData(messenger, {
      amount: '1000000',
      transaction: createDepositTransaction(),
    });

    expect(result).toStrictEqual({
      updates: [
        { nestedTransactionIndex: 0, data: APPROVE_DATA },
        { nestedTransactionIndex: 1, data: DEPOSIT_DATA },
      ],
    });
    expect(buildDepositBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1_000_000n }),
    );
  });

  it('returns no updates for a non-deposit transaction', async () => {
    const { messenger } = setup();

    const result = await getMoneyAccountAmountData(messenger, {
      amount: '1000000',
      transaction: { id: TRANSACTION_ID } as unknown as TransactionMeta,
    });

    expect(result).toStrictEqual({ updates: [] });
    expect(buildDepositBatchMock).not.toHaveBeenCalled();
  });
});
