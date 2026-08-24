import { Interface } from '@ethersproject/abi';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  TELLER_ABI,
} from '@metamask/money-account-utils';
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
  VAULT_RATE_MOCK,
  type MessengerMockOptions,
} from './test-mocks';

const ERC20_INTERFACE = new Interface([
  'function transfer(address recipient, uint256 amount)',
]);
const TELLER_INTERFACE = new Interface(TELLER_ABI);

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];
const RECIPIENT_MOCK = '0x1234567890123456789012345678901234567890' as Hex;
const OVERRIDE_RECIPIENT_MOCK =
  '0xabcabcabcabcabcabcabcabcabcabcabcabcabca' as Hex;

/** 1.0000004 mUSD: base units 1000000.4, so ROUND_DOWN → 1000000. */
const AMOUNT_HUMAN = '1.0000004';
const AMOUNT_ROUNDED_DOWN = 1000000n;

let transactionIdCounter = 0;

function buildTemplateTransaction(): TransactionMeta {
  transactionIdCounter += 1;
  return {
    id: `withdraw-transaction-${transactionIdCounter}`,
    chainId: VAULT_CONFIG_MOCK.chainId,
    status: TransactionStatus.unapproved,
    txParams: { from: MONEY_ACCOUNT_ADDRESS_MOCK, gas: '0x5208' },
    nestedTransactions: [
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        data: '0x00',
        type: TransactionType.moneyAccountWithdraw,
      },
      {
        to: MUSD_ADDRESS,
        data: '0x00',
        type: TransactionType.tokenMethodTransfer,
      },
    ],
  } as unknown as TransactionMeta;
}

function setup(
  transaction: TransactionMeta,
  options: MessengerMockOptions = {},
) {
  const committed: { meta?: TransactionMeta } = {};

  const mock = createMoneyPayMessengerMock({
    ...options,
    handlers: {
      'AccountsController:getSelectedAccount': () => ({
        address: RECIPIENT_MOCK,
        type: 'eip155:eoa',
      }),
      'TransactionController:getState': () => ({
        transactions: [transaction],
      }),
      'TransactionController:updateTransactionMetadata': (request) => {
        const { callback } = request as {
          callback: (meta: TransactionMeta) => void;
        };
        callback(transaction);
        committed.meta = transaction;
      },
      ...options.handlers,
    },
  });

  return { ...mock, committed };
}

describe('updateMoneyAccountWithdrawAmount', () => {
  it('re-encodes the withdraw and transfer calldata for the selected account', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed } = setup(transaction);

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );

    expect(result).toStrictEqual({
      didCommit: true,
      recipient: RECIPIENT_MOCK,
    });
    const meta = committed.meta as TransactionMeta;

    const withdraw = TELLER_INTERFACE.decodeFunctionData(
      'withdraw',
      meta.nestedTransactions?.[0].data as string,
    );
    expect(withdraw.withdrawAsset.toLowerCase()).toBe(
      MUSD_ADDRESS.toLowerCase(),
    );
    // Shares are ceil(amount * ONE_SHARE / rate) at the mocked vault rate.
    expect(withdraw.shareAmount.toBigInt()).toBe(
      (AMOUNT_ROUNDED_DOWN * 1_000_000n + VAULT_RATE_MOCK - 1n) /
        VAULT_RATE_MOCK,
    );
    expect(withdraw.to.toLowerCase()).toBe(MONEY_ACCOUNT_ADDRESS_MOCK);

    const transfer = ERC20_INTERFACE.decodeFunctionData(
      'transfer',
      meta.nestedTransactions?.[1].data as string,
    );
    expect(transfer.recipient.toLowerCase()).toBe(RECIPIENT_MOCK);
    expect(transfer.amount.toBigInt()).toBe(AMOUNT_ROUNDED_DOWN);

    expect(meta.txParams.gas).toBeUndefined();
    expect(meta.simulationData).toBeUndefined();
  });

  it('resolves uncommitted for a zero amount without building', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed, provider } = setup(transaction);

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      '0',
    );

    expect(result).toStrictEqual({ didCommit: false });
    expect(committed.meta).toBeUndefined();
    expect(provider.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'eth_call' }),
    );
  });

  it('rejects when the transaction does not match the withdrawal template', async () => {
    const transaction = buildTemplateTransaction();
    transaction.nestedTransactions = [];
    const { messenger } = setup(transaction);

    await expect(
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Withdrawal: missing withdraw/transfer transaction template',
    );
  });

  it('throws when no recipient account resolves', () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getSelectedAccount': () => undefined,
      },
    });

    expect(() =>
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).toThrow(
      'Update Amount: Money Account Withdrawal: missing recipient account',
    );
  });

  it('throws when the selected account is not an EVM account', () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getSelectedAccount': () => ({
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          type: 'solana:data-account',
        }),
      },
    });

    expect(() =>
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).toThrow(
      'Update Amount: Money Account Withdrawal: recipient is not an EVM account',
    );
  });

  it('resolves the recipient from the Pay account override when provided', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed } = setup(transaction, {
      handlers: {
        'AccountsController:getAccountByAddress': (address) => ({
          address,
          type: 'eip155:eoa',
        }),
      },
    });

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
      OVERRIDE_RECIPIENT_MOCK,
    );

    expect(result).toStrictEqual({
      didCommit: true,
      recipient: OVERRIDE_RECIPIENT_MOCK,
    });

    const meta = committed.meta as TransactionMeta;
    const transfer = ERC20_INTERFACE.decodeFunctionData(
      'transfer',
      meta.nestedTransactions?.[1].data as string,
    );
    expect(transfer.recipient.toLowerCase()).toBe(OVERRIDE_RECIPIENT_MOCK);
  });

  it('throws when the account override is not a wallet account', () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed } = setup(transaction, {
      handlers: {
        'AccountsController:getAccountByAddress': () => undefined,
      },
    });

    expect(() =>
      updateMoneyAccountWithdrawAmount(
        messenger,
        transaction.id,
        AMOUNT_HUMAN,
        OVERRIDE_RECIPIENT_MOCK,
      ),
    ).toThrow(
      'Update Amount: Money Account Withdrawal: missing recipient account',
    );
    expect(committed.meta).toBeUndefined();
  });

  it('throws when the account override resolves to a non-EVM account', () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getAccountByAddress': (address) => ({
          address,
          type: 'solana:data-account',
        }),
      },
    });

    expect(() =>
      updateMoneyAccountWithdrawAmount(
        messenger,
        transaction.id,
        AMOUNT_HUMAN,
        OVERRIDE_RECIPIENT_MOCK,
      ),
    ).toThrow(
      'Update Amount: Money Account Withdrawal: recipient is not an EVM account',
    );
  });

  it('throws when the selected account address is not hex', () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getSelectedAccount': () => ({
          address: 'not-a-hex-address',
          type: 'eip155:eoa',
        }),
      },
    });

    expect(() =>
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).toThrow(
      'Update Amount: Money Account Withdrawal: invalid recipient address',
    );
  });

  it('rejects at commit time when the transaction is no longer unapproved', async () => {
    const transaction = buildTemplateTransaction();
    transaction.status = TransactionStatus.approved;
    const { messenger } = setup(transaction);

    await expect(
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Withdrawal: transaction is no longer unapproved',
    );
    // The placeholder calldata must be untouched.
    expect(transaction.nestedTransactions?.[1].data).toBe('0x00');
  });

  it('shares the promise for identical in-flight intents', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction);

    const first = updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );
    const second = updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );

    expect(second).toBe(first);
    await expect(first).resolves.toStrictEqual({
      didCommit: true,
      recipient: RECIPIENT_MOCK,
    });
  });

  it('treats the same amount aimed at a different recipient as a new intent', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getAccountByAddress': (address) => ({
          address,
          type: 'eip155:eoa',
        }),
      },
    });

    const first = updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );
    const second = updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
      OVERRIDE_RECIPIENT_MOCK,
    );

    expect(second).not.toBe(first);
    // The first intent is superseded before it can commit calldata paying
    // the old recipient.
    await expect(first).resolves.toStrictEqual({ didCommit: false });
    await expect(second).resolves.toStrictEqual({
      didCommit: true,
      recipient: OVERRIDE_RECIPIENT_MOCK,
    });
  });
});
