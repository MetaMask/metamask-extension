import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import {
  selectDefaultPaySelectedSection,
  selectEnableMoneyAccountTransactions,
} from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../transactions/useTransactionMetadataRequest');

const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';

const MONEY_ACCOUNT_FLAG = {
  perpsDeposit: 'money-account',
  perpsWithdraw: 'money-account',
  predictWithdraw: 'money-account',
};

const ENABLED_MONEY_ACCOUNT_TRANSACTIONS = {
  perpsDeposit: true,
  perpsWithdraw: true,
  predictDeposit: true,
  predictWithdraw: true,
};

describe('useIsMoneyAccountFlagDefault', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );

  function mockSelectors({
    moneyAccount = { address: MONEY_ACCOUNT_ADDRESS },
    defaultPaySelectedSection = {} as Record<string, string>,
    enableMoneyAccountTransactions = ENABLED_MONEY_ACCOUNT_TRANSACTIONS,
    payToken = undefined,
  }: {
    moneyAccount?: { address: string } | null;
    defaultPaySelectedSection?: Record<string, string>;
    enableMoneyAccountTransactions?: Record<string, boolean>;
    payToken?: { address: string; chainId: string } | undefined;
  } = {}) {
    useSelectorMock.mockImplementation((selector: unknown) => {
      if (selector === selectPrimaryMoneyAccount) {
        return moneyAccount;
      }
      if (selector === selectDefaultPaySelectedSection) {
        return defaultPaySelectedSection;
      }
      if (selector === selectEnableMoneyAccountTransactions) {
        return enableMoneyAccountTransactions;
      }
      // The pay-token read is the only inline-arrow selector in the hook.
      return payToken;
    });
  }

  function mockConfirmation(type?: TransactionType) {
    useTransactionMetadataRequestOptionalMock.mockReturnValue(
      type ? ({ id: 'tx-1', type } as never) : undefined,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
    mockSelectors();
    mockConfirmation(TransactionType.perpsWithdraw);
  });

  it('returns false when the flag is not set', () => {
    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    TransactionType.perpsDeposit,
    TransactionType.perpsWithdraw,
    TransactionType.predictWithdraw,
  ])(
    'returns true for %s when the flag maps the type to money-account',
    (type: TransactionType) => {
      mockConfirmation(type);
      mockSelectors({ defaultPaySelectedSection: MONEY_ACCOUNT_FLAG });

      const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
      expect(result.current).toBe(true);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([TransactionType.perpsDeposit, TransactionType.predictDeposit])(
    'returns true for %s when the sibling withdraw key is money-account',
    (type: TransactionType) => {
      mockConfirmation(type);
      mockSelectors({
        defaultPaySelectedSection: {
          perpsWithdraw: 'money-account',
          predictWithdraw: 'money-account',
        },
      });

      const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
      expect(result.current).toBe(true);
    },
  );

  it('returns false for perpsDeposit when the type is explicitly mapped to crypto', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: {
        perpsDeposit: 'crypto',
        perpsWithdraw: 'money-account',
      },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when a pay token is already selected for the transaction', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: MONEY_ACCOUNT_FLAG,
      payToken: { address: '0xToken', chainId: '0x1' },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when the flag is money-account but there is no money account', () => {
    mockSelectors({
      moneyAccount: null,
      defaultPaySelectedSection: MONEY_ACCOUNT_FLAG,
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when the flag maps the type to a different value', () => {
    mockSelectors({
      defaultPaySelectedSection: { perpsWithdraw: 'crypto' },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns true for perpsDeposit when only the default key is money-account', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: { default: 'money-account' },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(true);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    TransactionType.simpleSend,
    TransactionType.swap,
    TransactionType.bridge,
    TransactionType.moneyAccountDeposit,
  ])(
    'returns false for non-perps/predict type %s even when the flag is enabled',
    (type: TransactionType) => {
      mockConfirmation(type);
      mockSelectors({
        defaultPaySelectedSection: {
          [type]: 'money-account',
        },
      });

      const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
      expect(result.current).toBe(false);
    },
  );

  it('returns false when there is no confirmation', () => {
    mockConfirmation(undefined);
    mockSelectors({ defaultPaySelectedSection: MONEY_ACCOUNT_FLAG });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when Money Account pay is not enabled for the type', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: MONEY_ACCOUNT_FLAG,
      enableMoneyAccountTransactions: { perpsWithdraw: true },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when enableMoneyAccountTransactions is empty', () => {
    mockSelectors({
      defaultPaySelectedSection: MONEY_ACCOUNT_FLAG,
      enableMoneyAccountTransactions: {},
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('returns false when Money Account pay is explicitly disabled for the type', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: MONEY_ACCOUNT_FLAG,
      enableMoneyAccountTransactions: {
        ...ENABLED_MONEY_ACCOUNT_TRANSACTIONS,
        perpsDeposit: false,
      },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });
});
