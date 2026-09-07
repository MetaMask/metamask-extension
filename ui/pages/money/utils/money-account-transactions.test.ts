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

  it('excludes a local mUSD transfer whose recipient is not the Money Account', () => {
    expect(
      isVisibleMoneyActivityTransaction(
        makeTx({
          type: TransactionType.tokenMethodTransfer,
          txParams: {
            from: OTHER_ADDRESS,
            to: MUSD_TOKEN_ADDRESS,
            data: transferCalldata(OTHER_ADDRESS, 1_000_000n),
            value: '0x0',
          },
        }),
        MONEY_ADDRESS,
      ),
    ).toBe(false);
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
});
