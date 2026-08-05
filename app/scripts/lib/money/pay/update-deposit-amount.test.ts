import { Interface } from '@ethersproject/abi';
import { toHex } from '@metamask/controller-utils';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  TELLER_ABI,
} from '@metamask/money-account-utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { updateMoneyAccountDepositAmount } from './update-deposit-amount';
import {
  createMoneyPayMessengerMock,
  MONEY_ACCOUNT_ADDRESS_MOCK,
  VAULT_CONFIG_MOCK,
  type MessengerMockOptions,
} from './test-mocks';

const ERC20_INTERFACE = new Interface([
  'function approve(address spender, uint256 amount)',
]);
const TELLER_INTERFACE = new Interface(TELLER_ABI);

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];

/** 1.0000004 mUSD: base units 1000000.4, so ROUND_UP → 1000001. */
const AMOUNT_HUMAN = '1.0000004';
const AMOUNT_ROUNDED_UP = '1000001';

let transactionIdCounter = 0;

function buildTemplateTransaction(): TransactionMeta {
  transactionIdCounter += 1;
  return {
    id: `transaction-${transactionIdCounter}`,
    chainId: VAULT_CONFIG_MOCK.chainId,
    txParams: { from: MONEY_ACCOUNT_ADDRESS_MOCK, gas: '0x5208' },
    gasLimitNoBuffer: '0x5208',
    nestedTransactions: [
      {
        to: MUSD_ADDRESS,
        data: '0x00',
        type: TransactionType.tokenMethodApprove,
      },
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        data: '0x00',
        type: TransactionType.moneyAccountDeposit,
      },
    ],
    requiredAssets: [
      { address: MUSD_ADDRESS, amount: '0x0' },
      { address: '0x0000000000000000000000000000000000000001', amount: '0x1' },
    ],
    simulationData: { tokenBalanceChanges: [] },
  } as unknown as TransactionMeta;
}

/**
 * Builds the messenger mock with a transaction-controller stub: `getState`
 * serves the transaction and `updateTransactionMetadata` runs the callback
 * against it, capturing the mutated result.
 *
 * @param transaction - The transaction served from state.
 * @param options - Extra messenger mock options.
 * @returns The mock plus the captured update.
 */
function setup(
  transaction: TransactionMeta,
  options: MessengerMockOptions = {},
) {
  const committed: { meta?: TransactionMeta; skipResimulate?: boolean } = {};

  const mock = createMoneyPayMessengerMock({
    ...options,
    handlers: {
      'TransactionController:getState': () => ({
        transactions: [transaction],
      }),
      'TransactionController:updateTransactionMetadata': (request) => {
        const { callback, skipResimulate } = request as {
          callback: (meta: TransactionMeta) => void;
          skipResimulate: boolean;
        };
        callback(transaction);
        committed.meta = transaction;
        committed.skipResimulate = skipResimulate;
      },
      ...options.handlers,
    },
  });

  return { ...mock, committed };
}

describe('updateMoneyAccountDepositAmount', () => {
  it('re-encodes the batch, rebuilds required assets and clears gas state', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed } = setup(transaction);

    const result = await updateMoneyAccountDepositAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );

    expect(result).toBe(true);
    expect(committed.skipResimulate).toBe(true);

    const meta = committed.meta as TransactionMeta;

    const approve = ERC20_INTERFACE.decodeFunctionData(
      'approve',
      meta.nestedTransactions?.[0].data as string,
    );
    expect(approve.amount.toString()).toBe(AMOUNT_ROUNDED_UP);

    const deposit = TELLER_INTERFACE.decodeFunctionData(
      'deposit',
      meta.nestedTransactions?.[1].data as string,
    );
    expect(deposit.depositAmount.toString()).toBe(AMOUNT_ROUNDED_UP);

    // The mUSD required asset carries the new amount; the other is untouched.
    expect(meta.requiredAssets?.[0].amount).toBe(toHex(AMOUNT_ROUNDED_UP));
    expect(meta.requiredAssets?.[1].amount).toBe('0x1');

    // The re-encoded batch invalidates gas and simulation state.
    expect(meta.txParams.gas).toBeUndefined();
    expect(meta.gasLimitNoBuffer).toBeUndefined();
    expect(meta.simulationData).toBeUndefined();
  });

  it('resolves false for a zero amount without building', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger, committed, provider } = setup(transaction);

    const result = await updateMoneyAccountDepositAmount(
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

  it('shares the promise for identical in-flight intents', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction);

    const first = updateMoneyAccountDepositAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );
    const second = updateMoneyAccountDepositAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );

    expect(second).toBe(first);
    await expect(first).resolves.toBe(true);
  });

  it('resolves false for an intent superseded during preparation', async () => {
    const transaction = buildTemplateTransaction();

    // Hold the first build's vault read until the second intent registers.
    let releaseFirstCall: (() => void) | undefined;
    const firstCallGate = new Promise<void>((resolve) => {
      releaseFirstCall = resolve;
    });
    let ethCallCount = 0;

    const { messenger, committed } = setup(transaction, {
      handlers: {
        'NetworkController:getNetworkClientById': () => ({
          provider: {
            request: async ({ method }: { method: string }) => {
              if (method === 'eth_chainId') {
                return VAULT_CONFIG_MOCK.chainId;
              }
              ethCallCount += 1;
              if (ethCallCount === 1) {
                await firstCallGate;
              }
              return `0x${5_000_000n.toString(16).padStart(64, '0')}`;
            },
          },
        }),
      },
    });

    const first = updateMoneyAccountDepositAmount(
      messenger,
      transaction.id,
      AMOUNT_HUMAN,
    );
    const second = updateMoneyAccountDepositAmount(
      messenger,
      transaction.id,
      '2.5',
    );
    releaseFirstCall?.();

    expect(await first).toBe(false);
    expect(await second).toBe(true);

    // Only the current intent's amount was committed.
    const deposit = TELLER_INTERFACE.decodeFunctionData(
      'deposit',
      committed.meta?.nestedTransactions?.[1].data as string,
    );
    expect(deposit.depositAmount.toString()).toBe('2500000');
  });

  it('throws when the transaction is not found', async () => {
    const { messenger } = setup(buildTemplateTransaction());

    expect(() =>
      updateMoneyAccountDepositAmount(messenger, 'unknown-id', AMOUNT_HUMAN),
    ).toThrow('Update Amount: Money Account Deposit: transaction not found');
  });

  it('rejects when the transaction does not match the deposit template', async () => {
    const transaction = buildTemplateTransaction();
    transaction.nestedTransactions = [];
    const { messenger } = setup(transaction);

    await expect(
      updateMoneyAccountDepositAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Deposit: missing approval/deposit transaction template',
    );
  });

  it('rejects when the vault config is unserved', async () => {
    const transaction = buildTemplateTransaction();
    const { messenger } = setup(transaction, { remoteFeatureFlags: {} });

    await expect(
      updateMoneyAccountDepositAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Deposit: missing vault config or provider',
    );
  });

  it('rejects when the required asset template is missing', async () => {
    const transaction = buildTemplateTransaction();
    transaction.requiredAssets = [];
    const { messenger } = setup(transaction);

    await expect(
      updateMoneyAccountDepositAmount(messenger, transaction.id, AMOUNT_HUMAN),
    ).rejects.toThrow(
      'Update Amount: Money Account Deposit: missing required asset template',
    );
  });
});
