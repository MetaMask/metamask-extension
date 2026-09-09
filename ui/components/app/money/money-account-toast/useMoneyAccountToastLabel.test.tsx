import { renderHook } from '@testing-library/react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  clearMoneyAccountDepositIntent,
  getMoneyAccountDepositIntent,
  setMoneyAccountDepositIntent,
} from '../../../../helpers/money/deposit-intent';
import { useMoneyAccountToastLabel } from './useMoneyAccountToastLabel';

const mockT = jest.fn((key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key,
);

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

let mockTransaction: TransactionMeta | undefined;
let mockInternalAccounts: Record<string, InternalAccount> = {};
let mockAccountGroups: { metadata: { name: string } }[] = [];

jest.mock('../../../../selectors/transactionController', () => ({
  selectTransactionById: () => mockTransaction,
}));

jest.mock('../../../../selectors/accounts', () => ({
  getInternalAccountByAddress: (_state: unknown, address: string) =>
    mockInternalAccounts[address.toLowerCase()],
}));

jest.mock('../../../../selectors/multichain-accounts/account-tree', () => ({
  getAccountGroupsByAddress: () => mockAccountGroups,
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (mockState: unknown) => unknown) => selector({}),
}));

const MUSD_ADDRESS = '0xaca92e438df0b2401ff60da7e4337b687a2435da';
const RECIPIENT = '0x1111111111111111111111111111111111111111';
const BATCH_ID = '0xbatch';
const DEPOSIT_TX = { type: 'moneyAccountDeposit' };
const WITHDRAW_TX = { type: 'moneyAccountWithdraw' };

function encodeTransfer(recipient: string, amount: bigint) {
  return `0xa9059cbb${recipient.slice(2).padStart(64, '0')}${amount
    .toString(16)
    .padStart(64, '0')}`;
}

function setTransaction(
  nested: Record<string, unknown>[],
  overrides: Partial<TransactionMeta> = {},
) {
  mockTransaction = {
    id: 'tx-1',
    batchId: BATCH_ID,
    chainId: '0xe708',
    nestedTransactions: nested,
    ...overrides,
  } as TransactionMeta;
}

function setDeposit(overrides: Partial<TransactionMeta> = {}) {
  setTransaction([DEPOSIT_TX], overrides);
}

function setWithdraw(recipient?: string) {
  setTransaction(
    recipient
      ? [
          WITHDRAW_TX,
          {
            type: 'transfer',
            to: MUSD_ADDRESS,
            data: encodeTransfer(recipient, 100000000n),
          },
        ]
      : [WITHDRAW_TX],
  );
}

describe('useMoneyAccountToastLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = undefined;
    mockInternalAccounts = {};
    mockAccountGroups = [];
    clearMoneyAccountDepositIntent(BATCH_ID);
  });

  it('returns undefined for transactions that are not money account batches', () => {
    setTransaction([{ type: 'transfer' }]);

    const { result } = renderHook(() =>
      useMoneyAccountToastLabel('pending', 'tx-1'),
    );

    expect(result.current).toBeUndefined();
  });

  describe('deposit', () => {
    it('prefers the recorded intent, then derives it from the payment token', () => {
      setDeposit({ metamaskPay: { tokenAddress: MUSD_ADDRESS } });

      const derived = renderHook(() =>
        useMoneyAccountToastLabel('pending', 'tx-1'),
      );
      expect(derived.result.current).toStrictEqual({
        title: 'moneyToastDepositInProgressTitleAddMusd',
        description: 'moneyToastInProgressDescription',
      });

      setMoneyAccountDepositIntent(BATCH_ID, 'card');
      const recorded = renderHook(() =>
        useMoneyAccountToastLabel('pending', 'tx-1'),
      );
      expect(recorded.result.current).toStrictEqual({
        title: 'moneyToastDepositInProgressTitleCard',
        description: 'moneyToastDepositInProgressDescriptionCard',
      });
      expect(getMoneyAccountDepositIntent(BATCH_ID)).toBe('card');
    });

    it('formats the amount on success and clears the recorded intent', () => {
      setDeposit({ metamaskPay: { targetFiat: '20.5' } });
      setMoneyAccountDepositIntent(BATCH_ID, 'addMusd');

      const { result } = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );

      expect(result.current).toStrictEqual({
        title: 'moneyToastDepositSuccessTitleAddMusd',
        description: 'moneyToastDepositSuccessDescription:$20.50',
      });
      expect(getMoneyAccountDepositIntent(BATCH_ID)).toBeUndefined();
    });

    it('falls back to convert copy without an amount when nothing is known', () => {
      setDeposit();

      const { result } = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );

      expect(result.current).toStrictEqual({
        title: 'moneyToastDepositSuccessTitleConvert',
        description: 'moneyToastDepositSuccessDescriptionNoAmount',
      });
    });

    it('returns failed copy for the intent', () => {
      setDeposit();

      const { result } = renderHook(() =>
        useMoneyAccountToastLabel('failed', 'tx-1'),
      );

      expect(result.current).toStrictEqual({
        title: 'moneyToastDepositFailedTitleConvert',
        description: 'moneyToastDepositFailedDescriptionConvert',
      });
    });
  });

  describe('withdraw', () => {
    it('returns pending and failed copy', () => {
      setWithdraw();

      const pending = renderHook(() =>
        useMoneyAccountToastLabel('pending', 'tx-1'),
      );
      expect(pending.result.current).toStrictEqual({
        title: 'moneyToastWithdrawInProgressTitle',
        description: 'moneyToastInProgressDescription',
      });

      const failed = renderHook(() =>
        useMoneyAccountToastLabel('failed', 'tx-1'),
      );
      expect(failed.result.current).toStrictEqual({
        title: 'moneyToastWithdrawFailedTitle',
        description: 'moneyToastWithdrawFailedDescription',
      });
    });

    it('names the destination by group name, then account name', () => {
      setWithdraw(RECIPIENT);
      mockInternalAccounts[RECIPIENT] = {
        metadata: { name: 'Account 2' },
      } as InternalAccount;

      const byAccount = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );
      expect(byAccount.result.current).toStrictEqual({
        title: 'moneyToastWithdrawSuccessTitle',
        description: 'moneyToastWithdrawSuccessDescription:$100.00,Account 2',
      });

      mockAccountGroups = [{ metadata: { name: 'Savings' } }];
      const byGroup = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );
      expect(byGroup.result.current?.description).toBe(
        'moneyToastWithdrawSuccessDescription:$100.00,Savings',
      );
    });

    it('shortens an external recipient and falls back when there is none', () => {
      setWithdraw(RECIPIENT);

      const external = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );
      expect(external.result.current?.description).toBe(
        'moneyToastWithdrawSuccessDescription:$100.00,0x11111...11111',
      );

      setWithdraw();
      const unknown = renderHook(() =>
        useMoneyAccountToastLabel('success', 'tx-1'),
      );
      expect(unknown.result.current?.description).toBe(
        'moneyToastWithdrawSuccessDescriptionNoAmount:moneyToastWithdrawFallbackDestination',
      );
    });
  });
});
