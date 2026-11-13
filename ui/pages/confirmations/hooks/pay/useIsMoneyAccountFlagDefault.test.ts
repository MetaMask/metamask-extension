import { TransactionType } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { selectPrimaryMoneyAccount } from '../../../../selectors/money-account';
import { selectTransactionPaymentTokenByTransactionId } from '../../../../selectors/transactionPayController';
import {
  selectDefaultPaySelectedSection,
  selectIsMoneyAccountTransactionEnabled,
} from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsMoneyAccountFlagDefault } from './useIsMoneyAccountFlagDefault';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));
jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('../../../../selectors/money-account', () => ({
  selectPrimaryMoneyAccount: jest.fn(),
}));
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectTransactionPaymentTokenByTransactionId: jest.fn(),
}));
jest.mock('../../selectors/feature-flags', () => ({
  selectDefaultPaySelectedSection: jest.fn(),
  selectIsMoneyAccountTransactionEnabled: jest.fn(),
}));

const MONEY_ACCOUNT_ADDRESS = '0xc4ff9e84b5754570812d891ade0bad3952bb5946';

const MONEY_ACCOUNT_FLAG = {
  perpsDeposit: 'money-account',
  perpsWithdraw: 'money-account',
  predictWithdraw: 'money-account',
};

describe('useIsMoneyAccountFlagDefault', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useTransactionMetadataRequestOptionalMock = jest.mocked(
    useTransactionMetadataRequestOptional,
  );
  const selectPrimaryMoneyAccountMock = jest.mocked(selectPrimaryMoneyAccount);
  const selectTransactionPaymentTokenByTransactionIdMock = jest.mocked(
    selectTransactionPaymentTokenByTransactionId,
  );
  const selectDefaultPaySelectedSectionMock = jest.mocked(
    selectDefaultPaySelectedSection,
  );
  const selectIsMoneyAccountTransactionEnabledMock = jest.mocked(
    selectIsMoneyAccountTransactionEnabled,
  );

  function mockSelectors({
    moneyAccount = { address: MONEY_ACCOUNT_ADDRESS },
    defaultPaySelectedSection = {} as Record<string, string>,
    isMoneyAccountPayEnabled = true,
    payToken = undefined,
  }: {
    moneyAccount?: { address: string } | null;
    defaultPaySelectedSection?: Record<string, string>;
    isMoneyAccountPayEnabled?: boolean;
    payToken?: { address: string; chainId: string } | undefined;
  } = {}) {
    selectPrimaryMoneyAccountMock.mockReturnValue(moneyAccount as never);
    selectDefaultPaySelectedSectionMock.mockReturnValue(
      defaultPaySelectedSection,
    );
    selectIsMoneyAccountTransactionEnabledMock.mockReturnValue(
      isMoneyAccountPayEnabled,
    );
    selectTransactionPaymentTokenByTransactionIdMock.mockReturnValue(
      payToken as never,
    );
  }

  function mockConfirmation(type?: TransactionType) {
    useTransactionMetadataRequestOptionalMock.mockReturnValue(
      type ? ({ id: 'tx-1', type } as never) : undefined,
    );
  }

  beforeEach(() => {
    jest.resetAllMocks();
    // Every read in the hook resolves through the mocked selectors above, so
    // the state they are called with is irrelevant.
    useSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) => selector({}),
    );
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
    'returns false for %s when only the sibling withdraw key is money-account',
    (type: TransactionType) => {
      mockConfirmation(type);
      mockSelectors({
        defaultPaySelectedSection: {
          perpsWithdraw: 'money-account',
          predictWithdraw: 'money-account',
        },
      });

      const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
      expect(result.current).toBe(false);
    },
  );

  it('returns false for perpsDeposit when only the default key is money-account', () => {
    mockConfirmation(TransactionType.perpsDeposit);
    mockSelectors({
      defaultPaySelectedSection: { default: 'money-account' },
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

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
      isMoneyAccountPayEnabled: false,
    });

    const { result } = renderHook(() => useIsMoneyAccountFlagDefault());
    expect(result.current).toBe(false);
  });

  it('checks Money Account availability against the confirmation type', () => {
    mockConfirmation(TransactionType.perpsWithdraw);
    mockSelectors({ defaultPaySelectedSection: MONEY_ACCOUNT_FLAG });

    renderHook(() => useIsMoneyAccountFlagDefault());

    expect(selectIsMoneyAccountTransactionEnabledMock).toHaveBeenCalledWith(
      expect.anything(),
      TransactionType.perpsWithdraw,
    );
  });
});
