import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { CHAIN_IDS } from '../../../../shared/constants/chain-ids';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import { ERC20_TRANSFER_SELECTOR } from './erc20-transfer';
import {
  filterMoneyAccountTransactions,
  isVisibleMoneyActivityTransaction,
} from './money-account-transactions';

const MONEY_ADDRESS = '0x00000000000000000000000000000000000000aa';
const OTHER_ADDRESS = '0x00000000000000000000000000000000000000bb';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

function padAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, '0');
}

function padAmount(amount: bigint): string {
  return amount.toString(16).padStart(64, '0');
}

function transferCalldata(recipient: string, amount: bigint): string {
  return `${ERC20_TRANSFER_SELECTOR}${padAddress(recipient)}${padAmount(amount)}`;
}

function makeTx(extra: Record<string, unknown>): TransactionMeta {
  return {
    id: 'tx-1',
    chainId: CHAIN_IDS.MONAD,
    time: 1,
    status: TransactionStatus.confirmed,
    txParams: {
      from: OTHER_ADDRESS,
      to: MONEY_ADDRESS,
      value: '0x0',
    },
    ...extra,
  } as unknown as TransactionMeta;
}

describe('isVisibleMoneyActivityTransaction', () => {
  it('includes confirmed moneyAccountDeposit transactions', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({ type: TransactionType.moneyAccountDeposit }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('includes approved moneyAccountWithdraw transactions', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.moneyAccountWithdraw,
          status: TransactionStatus.approved,
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('excludes unapproved moneyAccountDeposit transactions', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          status: TransactionStatus.unapproved,
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(false);
  });

  it('includes nested moneyAccountDeposit batches that are signed', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.batch,
          status: TransactionStatus.signed,
          nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('includes incoming mUSD on Monad addressed to the Money Account', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.incoming,
          transferInformation: {
            contractAddress: MUSD_TOKEN_ADDRESS,
            amount: '1000000',
            decimals: 6,
            symbol: 'mUSD',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('excludes incoming mUSD while it is still approved', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.incoming,
          status: TransactionStatus.approved,
          transferInformation: {
            contractAddress: MUSD_TOKEN_ADDRESS,
            amount: '1000000',
            decimals: 6,
            symbol: 'mUSD',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(false);
  });

  it('includes a local mUSD transfer whose calldata recipient is the Money Account', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.tokenMethodTransfer,
          txParams: {
            from: OTHER_ADDRESS,
            to: MUSD_TOKEN_ADDRESS,
            data: transferCalldata(MONEY_ADDRESS, 1_000_000n),
            value: '0x0',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('excludes a Money Pay transaction that failed locally without an on-chain revert', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          status: TransactionStatus.failed,
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(false);
  });

  it('includes a Money Pay transaction that reverted on-chain', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.moneyAccountDeposit,
          status: TransactionStatus.failed,
          error: {
            name: 'OnChainFailureError',
            message: 'Transaction failed on-chain',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });

  it('excludes a local mUSD transfer to the Money Account that failed before broadcast', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.tokenMethodTransfer,
          status: TransactionStatus.failed,
          error: { name: 'Error', message: 'nonce too low' },
          txParams: {
            from: OTHER_ADDRESS,
            to: MUSD_TOKEN_ADDRESS,
            data: transferCalldata(MONEY_ADDRESS, 1_000_000n),
            value: '0x0',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(false);
  });

  it('includes a confirmed Pay transaction signed from the Money Account', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.contractInteraction,
          metamaskPay: { tokenAddress: MUSD_TOKEN_ADDRESS, chainId: '0x8f' },
          txParams: {
            from: MONEY_ADDRESS,
            to: OTHER_ADDRESS,
            value: '0x0',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(true);
  });
});

describe('filterMoneyAccountTransactions', () => {
  it('sorts matching transactions newest first', () => {
    const older = makeTx({
      id: 'older',
      time: 1,
      type: TransactionType.moneyAccountDeposit,
    });
    const newer = makeTx({
      id: 'newer',
      time: 2,
      type: TransactionType.moneyAccountWithdraw,
    });

    expect(
      filterMoneyAccountTransactions([older, newer], MONEY_ADDRESS).map(
        (tx) => tx.id,
      ),
    ).toStrictEqual(['newer', 'older']);
  });

  it('promotes a confirmed Pay source tx when the Money deposit failed locally', () => {
    const deposit = makeTx({
      id: 'deposit',
      time: 1,
      type: TransactionType.moneyAccountDeposit,
      status: TransactionStatus.failed,
      requiredTransactionIds: ['pay-source'],
    });
    const paySource = makeTx({
      id: 'pay-source',
      time: 2,
      type: TransactionType.contractInteraction,
      status: TransactionStatus.confirmed,
      metamaskPay: { targetFiat: '0.1' },
      txParams: {
        from: OTHER_ADDRESS,
        to: MUSD_TOKEN_ADDRESS,
        value: '0x0',
      },
    });

    expect(
      filterMoneyAccountTransactions([deposit, paySource], MONEY_ADDRESS),
    ).toStrictEqual([
      { ...paySource, type: TransactionType.moneyAccountDeposit },
    ]);
  });

  it('promotes only the newest child and carries the parent pay metadata', () => {
    const metamaskPay = { tokenAddress: USDC_ADDRESS, chainId: '0x1' };
    const requiredAssets = [{ address: MUSD_TOKEN_ADDRESS, amount: '0xf4240' }];
    const deposit = makeTx({
      id: 'deposit',
      time: 1,
      type: TransactionType.moneyAccountDeposit,
      status: TransactionStatus.failed,
      metamaskPay,
      requiredAssets,
      requiredTransactionIds: ['swap', 'vault'],
    });
    const swap = makeTx({
      id: 'swap',
      time: 2,
      type: TransactionType.swap,
      txParams: { from: OTHER_ADDRESS, to: OTHER_ADDRESS, value: '0x0' },
    });
    const vault = makeTx({
      id: 'vault',
      time: 3,
      type: TransactionType.batch,
      txParams: { from: OTHER_ADDRESS, to: OTHER_ADDRESS, value: '0x0' },
    });

    expect(
      filterMoneyAccountTransactions([deposit, swap, vault], MONEY_ADDRESS),
    ).toStrictEqual([
      {
        ...vault,
        type: TransactionType.moneyAccountDeposit,
        metamaskPay,
        requiredAssets,
      },
    ]);
  });

  it('does not promote children of a parent that reverted on-chain', () => {
    const deposit = makeTx({
      id: 'deposit',
      time: 1,
      type: TransactionType.moneyAccountDeposit,
      status: TransactionStatus.failed,
      error: { name: 'OnChainFailureError', message: 'reverted' },
      requiredTransactionIds: ['swap'],
    });
    const swap = makeTx({
      id: 'swap',
      time: 2,
      type: TransactionType.swap,
      txParams: { from: OTHER_ADDRESS, to: OTHER_ADDRESS, value: '0x0' },
    });

    expect(
      filterMoneyAccountTransactions([deposit, swap], MONEY_ADDRESS).map(
        (tx) => tx.id,
      ),
    ).toStrictEqual(['deposit']);
  });
});
