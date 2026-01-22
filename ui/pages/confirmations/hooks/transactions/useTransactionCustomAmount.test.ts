import type { TransactionMeta } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import * as TransactionPayControllerActions from '../../../../store/controller-actions/transaction-pay-controller';
import * as useTokenFiatRatesModule from '../tokens/useTokenFiatRates';
import * as useTransactionPayDataModule from '../pay/useTransactionPayData';
import * as useTransactionPayTokenModule from '../pay/useTransactionPayToken';
import {
  useTransactionCustomAmount,
  MAX_LENGTH,
} from './useTransactionCustomAmount';
import * as useUpdateTokenAmountModule from './useUpdateTokenAmount';

jest.mock('../../../../store/controller-actions/transaction-pay-controller');
jest.mock('../tokens/useTokenFiatRates');
jest.mock('../pay/useTransactionPayData');
jest.mock('../pay/useTransactionPayToken');
jest.mock('./useUpdateTokenAmount');

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

const DEFAULT_MOCK_STATE = getMockConfirmStateForTransaction(
  MOCK_TRANSACTION_META,
);

function runHook({
  currency,
  tokenFiatRate = 1,
  payTokenBalanceUsd = 100,
  isMaxAmount = false,
  requiredTokens = [],
}: {
  currency?: string;
  tokenFiatRate?: number;
  payTokenBalanceUsd?: number;
  isMaxAmount?: boolean;
  requiredTokens?: { amountUsd?: string; skipIfBalance?: boolean }[];
} = {}) {
  jest
    .mocked(useTokenFiatRatesModule.useTokenFiatRate)
    .mockReturnValue(tokenFiatRate);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayIsMaxAmount)
    .mockReturnValue(isMaxAmount);
  jest
    .mocked(useTransactionPayDataModule.useTransactionPayRequiredTokens)
    .mockReturnValue(
      requiredTokens as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayRequiredTokens
      >,
    );
  jest
    .mocked(useTransactionPayTokenModule.useTransactionPayToken)
    .mockReturnValue({
      payToken: {
        balanceUsd: String(payTokenBalanceUsd),
      } as ReturnType<
        typeof useTransactionPayTokenModule.useTransactionPayToken
      >['payToken'],
      setPayToken: jest.fn(),
      isNative: false,
    });
  jest.mocked(useUpdateTokenAmountModule.useUpdateTokenAmount).mockReturnValue({
    updateTokenAmount: jest.fn(),
    isUpdating: false,
  });

  return renderHookWithConfirmContextProvider(
    () => useTransactionCustomAmount({ currency }),
    DEFAULT_MOCK_STATE,
  );
}

describe('useTransactionCustomAmount', () => {
  const setIsMaxAmountMock = jest.mocked(
    TransactionPayControllerActions.setIsMaxAmount,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('amountFiat', () => {
    it('returns "0" initially', () => {
      const { result } = runHook();

      expect(result.current.amountFiat).toBe('0');
    });

    it('returns target amount USD when isMaxAmount is true and target amount exists', () => {
      const { result } = runHook({
        isMaxAmount: true,
        requiredTokens: [{ amountUsd: '123.456', skipIfBalance: false }],
      });

      expect(result.current.amountFiat).toBe('123.46');
    });

    it('returns state amount when isMaxAmount is false', () => {
      const { result } = runHook({
        isMaxAmount: false,
        requiredTokens: [{ amountUsd: '123.456', skipIfBalance: false }],
      });

      expect(result.current.amountFiat).toBe('0');
    });
  });

  describe('amountHuman', () => {
    it('calculates amountHuman by dividing amountFiat by tokenFiatRate', () => {
      const { result } = runHook({
        tokenFiatRate: 2,
        isMaxAmount: true,
        requiredTokens: [{ amountUsd: '100', skipIfBalance: false }],
      });

      // amountFiat = 100, tokenFiatRate = 2, so amountHuman = 100 / 2 = 50
      expect(result.current.amountHuman).toBe('50');
    });

    it('returns "0" when amountFiat is "0"', () => {
      const { result } = runHook({
        tokenFiatRate: 2,
      });

      expect(result.current.amountHuman).toBe('0');
    });
  });

  describe('updatePendingAmount', () => {
    it('strips leading zeros from input', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('0045');
      });

      expect(result.current.amountFiat).toBe('45');
    });

    it('adds leading zero for inputs starting with decimal', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('.5');
      });

      expect(result.current.amountFiat).toBe('0.5');
    });

    it('ignores input exceeding MAX_LENGTH', () => {
      const { result } = runHook();

      const longInput = '1'.repeat(MAX_LENGTH);
      act(() => {
        result.current.updatePendingAmount(longInput);
      });

      // Should remain unchanged because length >= MAX_LENGTH
      expect(result.current.amountFiat).toBe('0');
    });

    it('sets isMaxAmount to false when changing amount while isMaxAmount is true', () => {
      const { result } = runHook({
        isMaxAmount: true,
        requiredTokens: [{ amountUsd: '100', skipIfBalance: false }],
      });

      act(() => {
        result.current.updatePendingAmount('50');
      });

      expect(setIsMaxAmountMock).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        false,
      );
    });
  });

  describe('updatePendingAmountPercentage', () => {
    it('calculates amount based on percentage of balance', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      // 50% of 100 = 50
      expect(result.current.amountFiat).toBe('50');
    });

    it('sets isMaxAmount to true when percentage is 100', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      expect(setIsMaxAmountMock).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        true,
      );
    });

    it('sets isMaxAmount to false when percentage is less than 100 and isMaxAmount was true', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
        isMaxAmount: true,
        requiredTokens: [{ amountUsd: '100', skipIfBalance: false }],
      });

      act(() => {
        result.current.updatePendingAmountPercentage(75);
      });

      expect(setIsMaxAmountMock).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        false,
      );
    });

    it('does nothing when balanceUsd is falsy', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 0,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      expect(result.current.amountFiat).toBe('0');
    });

    it('rounds down to 2 decimal places', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(33);
      });

      // 33% of 100 = 33, rounded down to 2 decimals
      expect(result.current.amountFiat).toBe('33');
    });
  });

  describe('hasInput and isInputChanged', () => {
    it('has hasInput as false initially', () => {
      const { result } = runHook();

      expect(result.current.hasInput).toBe(false);
    });

    it('has isInputChanged as false initially', () => {
      const { result } = runHook();

      expect(result.current.isInputChanged).toBe(false);
    });

    it('sets hasInput to true after debounce when amount is non-zero', async () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      // Fast-forward debounce delay (500ms)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.hasInput).toBe(true);
    });

    it('sets isInputChanged to true after debounce when amount is non-zero', async () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      // Fast-forward debounce delay (500ms)
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isInputChanged).toBe(true);
    });
  });

  describe('primary required token selection', () => {
    it('uses the first required token without skipIfBalance flag', () => {
      const { result } = runHook({
        isMaxAmount: true,
        requiredTokens: [
          { amountUsd: '50', skipIfBalance: true },
          { amountUsd: '100', skipIfBalance: false },
          { amountUsd: '150', skipIfBalance: false },
        ],
      });

      // Should use the second token (first without skipIfBalance)
      expect(result.current.amountFiat).toBe('100');
    });
  });
});
