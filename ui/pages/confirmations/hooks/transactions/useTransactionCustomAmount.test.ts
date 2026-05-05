/* eslint-disable @typescript-eslint/naming-convention */
import type { TransactionMeta } from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
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
jest.mock('../../../../store/actions', () => ({
  upsertTransactionUIMetricsFragment: jest.fn(),
}));

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

const DEFAULT_MOCK_STATE = getMockConfirmStateForTransaction(
  MOCK_TRANSACTION_META,
);

function runHook({
  currency,
  disableUpdate = false,
  tokenFiatRate = 1,
  payTokenBalanceUsd = 100,
  isMaxAmount = false,
  requiredTokens = [],
  updateTokenAmountMock = jest.fn(),
}: {
  currency?: string;
  disableUpdate?: boolean;
  tokenFiatRate?: number;
  payTokenBalanceUsd?: number;
  isMaxAmount?: boolean;
  requiredTokens?: { amountUsd?: string; skipIfBalance?: boolean }[];
  updateTokenAmountMock?: jest.Mock;
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
    .mocked(useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken)
    .mockReturnValue(
      requiredTokens.find((t) => !t.skipIfBalance) as unknown as ReturnType<
        typeof useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken
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
    updateTokenAmount: updateTokenAmountMock,
    isUpdating: false,
  });

  return renderHookWithConfirmContextProvider(
    () => useTransactionCustomAmount({ currency, disableUpdate }),
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

    it('pre-populates from transaction data when user has not typed yet', () => {
      const { result } = runHook({
        isMaxAmount: false,
        requiredTokens: [{ amountUsd: '123.456', skipIfBalance: false }],
      });

      expect(result.current.amountFiat).toBe('123.46');
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

  describe('disableUpdate', () => {
    it('does not call updateTokenAmount when disableUpdate is true and amount changes via debounce', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        disableUpdate: true,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmount('50');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(updateTokenAmountMock).not.toHaveBeenCalled();
    });

    it('calls updateTokenAmount when disableUpdate is false and amount changes via debounce', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        disableUpdate: false,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmount('50');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(updateTokenAmountMock).toHaveBeenCalledWith('50');
    });

    it('does not call updateTokenAmount when disableUpdate is true and percentage button is clicked', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        disableUpdate: true,
        payTokenBalanceUsd: 100,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      expect(updateTokenAmountMock).not.toHaveBeenCalled();
    });

    it('calls updateTokenAmount when disableUpdate is false and percentage button is clicked', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        disableUpdate: false,
        payTokenBalanceUsd: 100,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      expect(updateTokenAmountMock).toHaveBeenCalledWith('50');
    });

    it('still updates local state when disableUpdate is true', () => {
      const { result } = runHook({
        disableUpdate: true,
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      expect(result.current.amountFiat).toBe('50');
    });
  });

  describe('mm_pay_amount_input_type tracking', () => {
    it('dispatches mm_pay_amount_input_type as manual and mm_pay_quote_requested as false when updatePendingAmount is called', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: expect.objectContaining({
            mm_pay_amount_input_type: 'manual',
            mm_pay_quote_requested: false,
          }),
        },
      );
    });

    it('dispatches mm_pay_amount_input_type as percentage when updatePendingAmountPercentage is called', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: expect.objectContaining({
            mm_pay_amount_input_type: '50%',
          }),
        },
      );
    });

    it('dispatches mm_pay_quote_requested when updatePendingAmountPercentage is called', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 100,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(25);
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: expect.objectContaining({
            mm_pay_quote_requested: true,
          }),
        },
      );
    });
  });

  describe('infinite loop prevention', () => {
    it('does not trigger infinite updates when updateTokenAmount callback is recreated', () => {
      const updateTokenAmountMock = jest.fn();
      const { result, rerender } = runHook({
        disableUpdate: false,
        updateTokenAmountMock,
      });

      // User types amount
      act(() => {
        result.current.updatePendingAmount('50');
      });

      // Fast-forward through debounce
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should have been called once
      expect(updateTokenAmountMock).toHaveBeenCalledTimes(1);
      expect(updateTokenAmountMock).toHaveBeenCalledWith('50');

      // Clear the mock to track new calls
      updateTokenAmountMock.mockClear();

      // Simulate callback recreation (as would happen from Redux updates)
      // by creating a new mock and rerendering
      const newUpdateTokenAmountMock = jest.fn();
      jest
        .mocked(useUpdateTokenAmountModule.useUpdateTokenAmount)
        .mockReturnValue({
          updateTokenAmount: newUpdateTokenAmountMock,
          isUpdating: false,
        });

      // Rerender to trigger the effect that recreates the debounced function
      rerender();

      // Fast-forward to ensure no debounced calls are pending
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // The new callback should NOT have been called automatically
      // (this was the bug - callback recreation was triggering the effect)
      expect(newUpdateTokenAmountMock).not.toHaveBeenCalled();
    });

    it('only calls updateTokenAmount when amountHuman actually changes, not when callback recreates', () => {
      const updateTokenAmountMock = jest.fn();
      const { result, rerender } = runHook({
        disableUpdate: false,
        tokenFiatRate: 2,
        isMaxAmount: true,
        requiredTokens: [{ amountUsd: '100', skipIfBalance: false }],
        updateTokenAmountMock,
      });

      // Initial render - amountHuman is 50 (100 / 2)
      // Fast-forward to clear any initial debounce calls
      act(() => {
        jest.advanceTimersByTime(500);
      });

      const initialCallCount = updateTokenAmountMock.mock.calls.length;

      // Simulate multiple callback recreations without amountHuman changing
      for (let i = 0; i < 5; i++) {
        const newMock = jest.fn();
        jest
          .mocked(useUpdateTokenAmountModule.useUpdateTokenAmount)
          .mockReturnValue({
            updateTokenAmount: newMock,
            isUpdating: false,
          });

        rerender();

        act(() => {
          jest.advanceTimersByTime(500);
        });

        // Should not have triggered additional calls
        expect(newMock).not.toHaveBeenCalled();
      }

      // Verify no additional calls were made
      expect(updateTokenAmountMock).toHaveBeenCalledTimes(initialCallCount);
    });

    it('does not call updateTokenAmount when amountUsd changes while isMaxAmount is true', () => {
      const updateTokenAmountMock = jest.fn();
      const { rerender } = runHook({
        disableUpdate: false,
        isMaxAmount: true,
        tokenFiatRate: 2,
        requiredTokens: [{ amountUsd: '100', skipIfBalance: false }],
        updateTokenAmountMock,
      });

      // Clear any initial calls from mount
      act(() => {
        jest.advanceTimersByTime(500);
      });
      updateTokenAmountMock.mockClear();

      // Simulate QuoteRefresher updating amountUsd (price movement)
      jest
        .mocked(
          useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken,
        )
        .mockReturnValue({
          amountUsd: '100.01',
          skipIfBalance: false,
        } as unknown as ReturnType<
          typeof useTransactionPayDataModule.useTransactionPayPrimaryRequiredToken
        >);

      rerender();
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Must NOT call updateTokenAmount — doing so restarts the quote cycle
      expect(updateTokenAmountMock).not.toHaveBeenCalled();
    });
  });
});
