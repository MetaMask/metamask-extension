import { Interface } from '@ethersproject/abi';
import {
  MUSD_TOKEN_ADDRESS_BY_CHAIN,
  TELLER_ABI,
} from '@metamask/money-account-utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { getMoneyAccountAmountData } from './amount-data-callback';
import {
  createMoneyPayMessengerMock,
  PREVIEW_DEPOSIT_SHARES_MOCK,
  VAULT_CONFIG_MOCK,
} from './test-mocks';

const ERC20_INTERFACE = new Interface([
  'function approve(address spender, uint256 amount)',
]);
const TELLER_INTERFACE = new Interface(TELLER_ABI);

const MUSD_ADDRESS = MUSD_TOKEN_ADDRESS_BY_CHAIN[VAULT_CONFIG_MOCK.chainId];

const AMOUNT_RAW = '2500000'; // 2.50 mUSD in base units

function buildDepositTransaction(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    id: 'transaction-id-mock',
    chainId: VAULT_CONFIG_MOCK.chainId,
    nestedTransactions: [
      { to: MUSD_ADDRESS, type: TransactionType.tokenMethodApprove },
      {
        to: VAULT_CONFIG_MOCK.tellerAddress,
        type: TransactionType.moneyAccountDeposit,
      },
    ],
    ...overrides,
  } as TransactionMeta;
}

describe('getMoneyAccountAmountData', () => {
  it('re-encodes the approve and deposit calldata for the amount', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    const result = await getMoneyAccountAmountData(
      { amount: AMOUNT_RAW, transaction: buildDepositTransaction() },
      messenger,
    );

    expect(result.updates).toHaveLength(2);
    const [approveUpdate, depositUpdate] = result.updates;
    expect(approveUpdate.nestedTransactionIndex).toBe(0);
    expect(depositUpdate.nestedTransactionIndex).toBe(1);

    const approve = ERC20_INTERFACE.decodeFunctionData(
      'approve',
      approveUpdate.data,
    );
    expect(approve.spender.toLowerCase()).toBe(
      VAULT_CONFIG_MOCK.boringVault.toLowerCase(),
    );
    expect(approve.amount.toBigInt()).toBe(BigInt(AMOUNT_RAW));

    const deposit = TELLER_INTERFACE.decodeFunctionData(
      'deposit',
      depositUpdate.data,
    );
    expect(deposit.depositAsset.toLowerCase()).toBe(MUSD_ADDRESS.toLowerCase());
    expect(deposit.depositAmount.toBigInt()).toBe(BigInt(AMOUNT_RAW));
    // minimumMint is the previewed shares with 0.2% slippage applied.
    expect(deposit.minimumMint.toBigInt()).toBe(
      (PREVIEW_DEPOSIT_SHARES_MOCK * 998n) / 1000n,
    );
  });

  it('detects the deposit from a nested transaction type', async () => {
    const { messenger } = createMoneyPayMessengerMock();

    const result = await getMoneyAccountAmountData(
      {
        amount: AMOUNT_RAW,
        transaction: buildDepositTransaction({ type: undefined }),
      },
      messenger,
    );

    expect(result.updates).toHaveLength(2);
  });

  it('returns no updates for a transaction that is not a money deposit', async () => {
    const { messenger, call } = createMoneyPayMessengerMock();

    const result = await getMoneyAccountAmountData(
      {
        amount: AMOUNT_RAW,
        transaction: {
          id: 'transaction-id-mock',
          chainId: VAULT_CONFIG_MOCK.chainId,
          type: TransactionType.simpleSend,
        } as TransactionMeta,
      },
      messenger,
    );

    expect(result).toStrictEqual({ updates: [] });
    expect(call).not.toHaveBeenCalled();
  });

  it('returns no updates when the vault config is unserved', async () => {
    const { messenger } = createMoneyPayMessengerMock({
      remoteFeatureFlags: {},
    });

    const result = await getMoneyAccountAmountData(
      { amount: AMOUNT_RAW, transaction: buildDepositTransaction() },
      messenger,
    );

    expect(result).toStrictEqual({ updates: [] });
  });

  it('returns no updates when no money account exists', async () => {
    const { messenger } = createMoneyPayMessengerMock({
      moneyAccountAddress: undefined,
    });

    const result = await getMoneyAccountAmountData(
      { amount: AMOUNT_RAW, transaction: buildDepositTransaction() },
      messenger,
    );

    expect(result).toStrictEqual({ updates: [] });
  });

  it('returns no updates when the chain is not configured', async () => {
    const { messenger } = createMoneyPayMessengerMock({
      chainNotConfigured: true,
    });

    const result = await getMoneyAccountAmountData(
      { amount: AMOUNT_RAW, transaction: buildDepositTransaction() },
      messenger,
    );

    expect(result).toStrictEqual({ updates: [] });
  });

  it('returns no updates for a zero amount instead of encoding a mint of nothing', async () => {
    const { messenger, provider } = createMoneyPayMessengerMock();

    const result = await getMoneyAccountAmountData(
      { amount: '0', transaction: buildDepositTransaction() },
      messenger,
    );

    expect(result).toStrictEqual({ updates: [] });
    expect(provider.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'eth_call' }),
    );
  });

  it('prefixes builder errors with both flow prefixes', async () => {
    // A failing vault read makes the builder throw.
    const failingProvider = {
      request: jest.fn(async ({ method }: { method: string }) => {
        if (method === 'eth_chainId') {
          return VAULT_CONFIG_MOCK.chainId;
        }
        throw new Error('previewDeposit reverted');
      }),
    };
    const { messenger } = createMoneyPayMessengerMock({
      handlers: {
        'NetworkController:getNetworkClientById': () => ({
          provider: failingProvider,
        }),
      },
    });

    await expect(
      getMoneyAccountAmountData(
        { amount: AMOUNT_RAW, transaction: buildDepositTransaction() },
        messenger,
      ),
    ).rejects.toThrow(/^Update Amount Data: Money Account Deposit: /u);
  });
});
