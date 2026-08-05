import { Interface } from '@ethersproject/abi';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  TELLER_ABI,
} from '@metamask/money-account-utils';
import {
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

/** 1.0000004 mUSD: base units 1000000.4, so ROUND_UP → 1000001. */
const AMOUNT_HUMAN = '1.0000004';
const AMOUNT_ROUNDED_UP = 1000001n;

let transactionIdCounter = 0;

function buildTemplateTransaction(): TransactionMeta {
  transactionIdCounter += 1;
  return {
    id: `withdraw-transaction-${transactionIdCounter}`,
    chainId: VAULT_CONFIG_MOCK.chainId,
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

    expect(result).toBe(true);
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
      (AMOUNT_ROUNDED_UP * 1_000_000n + VAULT_RATE_MOCK - 1n) / VAULT_RATE_MOCK,
    );
    expect(withdraw.to.toLowerCase()).toBe(MONEY_ACCOUNT_ADDRESS_MOCK);

    const transfer = ERC20_INTERFACE.decodeFunctionData(
      'transfer',
      meta.nestedTransactions?.[1].data as string,
    );
    expect(transfer.recipient.toLowerCase()).toBe(RECIPIENT_MOCK);
    expect(transfer.amount.toBigInt()).toBe(AMOUNT_ROUNDED_UP);

    expect(meta.txParams.gas).toBeUndefined();
    expect(meta.simulationData).toBeUndefined();
  });

  it('resolves false for a zero amount without building', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed, provider } = setup(transaction);

    const result = await updateMoneyAccountWithdrawAmount(
      messenger,
      transaction.id,
      '0',
    );

    expect(result).toBe(false);
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

  it('rejects when no recipient account resolves', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, {
      handlers: {
        'AccountsController:getSelectedAccount': () => undefined,
      },
    });

    await expect(
      updateMoneyAccountWithdrawAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Withdrawal: missing recipient account',
    );
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
    await expect(first).resolves.toBe(true);
  });
});
