import { Interface } from '@ethersproject/abi';
import { buildMoneyAccountWithdrawBatch } from '@metamask/money-account-utils';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import {
  syncMoneyAccountWithdrawTransfer,
  updateMoneyAccountWithdrawAmount,
} from './update-withdraw-amount';
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
const HARDWARE_RECIPIENT = '0x2222222222222222222222222222222222222222' as Hex;
const WITHDRAW_DATA = '0xaaa1' as Hex;
const TRANSFER_DATA = '0xbbb2' as Hex;
const WITHDRAW_DATA_2 = '0xccc3' as Hex;
const TRANSFER_DATA_2 = '0xddd4' as Hex;
const MUSD_RECEIVE_TOKEN = {
  address: VAULT_CONFIG_MOCK.underlyingToken,
  chainId: VAULT_CONFIG_MOCK.chainId,
};
const BRIDGED_RECEIVE_TOKEN = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
  chainId: '0x1' as Hex,
};

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

function encodeTransfer(to: Hex, amount: bigint): Hex {
  return new Interface([
    'function transfer(address to, uint256 amount)',
  ]).encodeFunctionData('transfer', [to, amount]) as Hex;
}

function createWithdrawTransaction({
  transferData,
  type = TransactionType.moneyAccountWithdraw,
}: { transferData?: Hex; type?: TransactionType } = {}): TransactionMeta {
  return {
    id: TRANSACTION_ID,
    chainId: VAULT_CONFIG_MOCK.chainId,
    status: TransactionStatus.unapproved,
    txParams: {
      from: MONEY_ACCOUNT_ADDRESS_MOCK,
      data: '0x',
    },
    nestedTransactions: [
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        value: '0x0',
        type,
      },
      {
        to: VAULT_CONFIG_MOCK.underlyingToken,
        value: '0x0',
        type: TransactionType.tokenMethodTransfer,
        ...(transferData ? { data: transferData } : {}),
      },
    ],
  } as unknown as TransactionMeta;
}

function setup({
  transactions = [createWithdrawTransaction()],
  selectedAddress = SELECTED_ACCOUNT,
  handlers = {},
}: {
  transactions?: TransactionMeta[];
  selectedAddress?: string;
  handlers?: Record<string, (...args: unknown[]) => unknown>;
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
      ...handlers,
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

  it('encodes for a locked hardware recipient without calling any keyring', async () => {
    const lockedKeyring = jest.fn(() => {
      throw new Error('Hardware device is locked or disconnected');
    });
    const { messenger, call } = setup({
      handlers: {
        'KeyringController:signTransaction': lockedKeyring,
        'KeyringController:signTypedMessage': lockedKeyring,
        'KeyringController:signEip7702Authorization': lockedKeyring,
        'KeyringController:withKeyring': lockedKeyring,
        'DelegationController:signDelegation': lockedKeyring,
      },
    });

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      HARDWARE_RECIPIENT,
    );

    expect(result).toStrictEqual({
      withdrawData: WITHDRAW_DATA,
      transferData: TRANSFER_DATA,
      transactionData: expect.stringMatching(/^0x/u),
    });
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        moneyAccountAddress: MONEY_ACCOUNT_ADDRESS_MOCK,
        recipient: HARDWARE_RECIPIENT,
      }),
    );
    expect(lockedKeyring).not.toHaveBeenCalled();
    expect(
      call.mock.calls.filter(([action]) =>
        /^(KeyringController|DelegationController):/u.test(action),
      ),
    ).toStrictEqual([]);
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

  it('keeps the mUSD on the money account when the receive token is quoted', async () => {
    const { messenger } = setup();

    await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: MONEY_ACCOUNT_ADDRESS_MOCK }),
    );
  });

  it('pays the recipient directly for mUSD on the vault chain', async () => {
    const { messenger } = setup();

    await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      HARDWARE_RECIPIENT,
      MUSD_RECEIVE_TOKEN,
    );

    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: HARDWARE_RECIPIENT }),
    );
  });

  it('keeps the mUSD on the money account for a software recipient when the token is quoted', async () => {
    const { messenger } = setup();

    await updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '1',
      ACCOUNT_OVERRIDE,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: MONEY_ACCOUNT_ADDRESS_MOCK }),
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

describe('syncMoneyAccountWithdrawTransfer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    buildWithdrawBatchMock.mockResolvedValue({
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
  });

  it('re-encodes the same amount to the money account when the token becomes quoted', async () => {
    const { messenger, updateTransactionMetadata } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(HARDWARE_RECIPIENT, 2_500_000n),
        }),
      ],
    });

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(result).toBe(true);
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2_500_000n,
        recipient: MONEY_ACCOUNT_ADDRESS_MOCK,
      }),
    );
    expect(updateTransactionMetadata).toHaveBeenCalledTimes(1);
  });

  it('re-encodes to the recipient when the token becomes direct', async () => {
    const { messenger } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(MONEY_ACCOUNT_ADDRESS_MOCK, 1_000_000n),
        }),
      ],
    });

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      MUSD_RECEIVE_TOKEN,
    );

    expect(result).toBe(true);
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: HARDWARE_RECIPIENT }),
    );
  });

  it('re-encodes to a new recipient for a direct token', async () => {
    const { messenger } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(HARDWARE_RECIPIENT, 1_000_000n),
        }),
      ],
    });

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      ACCOUNT_OVERRIDE,
      MUSD_RECEIVE_TOKEN,
    );

    expect(result).toBe(true);
    expect(buildWithdrawBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1_000_000n,
        recipient: ACCOUNT_OVERRIDE,
      }),
    );
  });

  it('re-encodes the in-flight typed amount when the token changes', async () => {
    const { messenger, updateTransactionMetadata } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(HARDWARE_RECIPIENT, 1_000_000n),
        }),
      ],
    });
    let resolveTyped: (value: unknown) => void = () => undefined;
    buildWithdrawBatchMock.mockImplementationOnce(
      async () =>
        await new Promise((resolve) => {
          resolveTyped = resolve as typeof resolveTyped;
        }),
    );

    const typed = updateMoneyAccountWithdrawAmount(
      messenger,
      TRANSACTION_ID,
      '2',
      HARDWARE_RECIPIENT,
      MUSD_RECEIVE_TOKEN,
    );
    const synced = syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    await expect(synced).resolves.toBe(true);
    resolveTyped(await buildWithdrawBatchMock.mock.results[1].value);
    await expect(typed).resolves.toBe(false);
    expect(buildWithdrawBatchMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        amount: 2_000_000n,
        recipient: MONEY_ACCOUNT_ADDRESS_MOCK,
      }),
    );
    expect(updateTransactionMetadata).toHaveBeenCalledTimes(1);
  });

  it('leaves the batch alone when the transfer target already matches', async () => {
    const { messenger, updateTransactionMetadata } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(MONEY_ACCOUNT_ADDRESS_MOCK, 1_000_000n),
        }),
      ],
    });

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(result).toBe(false);
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
    expect(updateTransactionMetadata).not.toHaveBeenCalled();
  });

  it('leaves an unfunded placeholder alone', async () => {
    const { messenger } = setup();

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(result).toBe(false);
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
  });

  it('ignores transactions that are not Money Account withdrawals', async () => {
    const { messenger } = setup({
      transactions: [
        createWithdrawTransaction({
          transferData: encodeTransfer(HARDWARE_RECIPIENT, 1_000_000n),
          type: TransactionType.contractInteraction,
        }),
      ],
    });

    const result = await syncMoneyAccountWithdrawTransfer(
      messenger,
      TRANSACTION_ID,
      HARDWARE_RECIPIENT,
      BRIDGED_RECEIVE_TOKEN,
    );

    expect(result).toBe(false);
    expect(buildWithdrawBatchMock).not.toHaveBeenCalled();
  });
});
