/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { act } from '@testing-library/react';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { upsertTransactionUIMetricsFragment } from '../../../../store/actions';
import * as TransactionPayControllerActions from '../../../../store/controller-actions/transaction-pay-controller';
import * as useTokenFiatRatesModule from '../tokens/useTokenFiatRates';
import * as usePayWithNoFeeTokenModule from '../pay/usePayWithNoFeeToken';
import * as useTransactionPayDataModule from '../pay/useTransactionPayData';
import * as useTransactionPayTokenModule from '../pay/useTransactionPayToken';
import {
  useTransactionCustomAmount,
  MAX_LENGTH,
} from './useTransactionCustomAmount';
import { useDepositPrefillAmount } from './useDepositPrefillAmount';
import * as useUpdateTokenAmountModule from './useUpdateTokenAmount';

jest.mock('../../../../store/controller-actions/transaction-pay-controller');
jest.mock('../tokens/useTokenFiatRates');
jest.mock('../pay/usePayWithNoFeeToken');
jest.mock('../pay/useTransactionPayData');
jest.mock('../pay/useTransactionPayToken');
jest.mock('./useDepositPrefillAmount');
jest.mock('./useUpdateTokenAmount');
jest.mock('../../../../store/actions', () => ({
  upsertTransactionUIMetricsFragment: jest.fn(),
}));

const useDepositPrefillAmountMock = jest.mocked(useDepositPrefillAmount);

const DISABLED_DEPOSIT_PREFILL = {
  prefillAmount: undefined,
  enabled: false,
  isLoading: false,
  hasPrefilled: false,
};

const MOCK_TRANSACTION_META =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

function runHook({
  currency,
  disableUpdate = false,
  tokenFiatRate = 1,
  payTokenBalanceUsd = 100,
  payTokenBalanceRaw,
  payTokenDecimals,
  payTokenAddress = '0xpaytoken',
  payTokenChainId = '0x1',
  balanceUsdOverride,
  isNoFeePayToken = true,
  isMaxAmount = false,
  requiredTokens = [],
  updateTokenAmountMock = jest.fn(),
  prefillMaxOnLoad = false,
  transactionMeta = MOCK_TRANSACTION_META,
  depositPrefill = DISABLED_DEPOSIT_PREFILL,
}: {
  currency?: string;
  disableUpdate?: boolean;
  tokenFiatRate?: number;
  payTokenBalanceUsd?: number;
  payTokenBalanceRaw?: string;
  payTokenDecimals?: number;
  payTokenAddress?: string;
  payTokenChainId?: string;
  balanceUsdOverride?: number;
  isNoFeePayToken?: boolean;
  isMaxAmount?: boolean;
  requiredTokens?: { amountUsd?: string; skipIfBalance?: boolean }[];
  updateTokenAmountMock?: jest.Mock;
  prefillMaxOnLoad?: boolean;
  transactionMeta?: TransactionMeta;
  depositPrefill?: ReturnType<typeof useDepositPrefillAmount>;
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
        address: payTokenAddress,
        balanceUsd: String(payTokenBalanceUsd),
        balanceRaw: payTokenBalanceRaw,
        decimals: payTokenDecimals,
        chainId: payTokenChainId,
      } as ReturnType<
        typeof useTransactionPayTokenModule.useTransactionPayToken
      >['payToken'],
      setPayToken: jest.fn(),
      isNative: false,
    });
  jest.mocked(usePayWithNoFeeTokenModule.usePayWithNoFeeToken).mockReturnValue({
    isNoFeeToken: () => isNoFeePayToken,
    renderNoFeeTag: () => null,
  });
  jest.mocked(useUpdateTokenAmountModule.useUpdateTokenAmount).mockReturnValue({
    updateTokenAmount: updateTokenAmountMock,
    isUpdating: false,
  });
  useDepositPrefillAmountMock.mockReturnValue(depositPrefill);

  return renderHookWithConfirmContextProvider(
    () =>
      useTransactionCustomAmount({
        balanceUsdOverride,
        currency,
        disableUpdate,
        prefillMaxOnLoad,
      }),
    getMockConfirmStateForTransaction(transactionMeta),
  );
}

describe('useTransactionCustomAmount', () => {
  const setIsMaxAmountMock = jest.mocked(
    TransactionPayControllerActions.setIsMaxAmount,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    useDepositPrefillAmountMock.mockReturnValue(DISABLED_DEPOSIT_PREFILL);
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

    it('uses the fiat amount directly when balanceUsdOverride is provided', () => {
      const { result } = runHook({
        balanceUsdOverride: 7.863083,
        tokenFiatRate: 0.999692,
      });

      act(() => {
        result.current.updatePendingAmount('7.86308329211399939404');
      });

      expect(result.current.amountHuman).toBe('7.86308329211399939404');
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

    it('normalizes a comma decimal separator to a dot', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('1,5');
      });

      expect(result.current.amountFiat).toBe('1.5');
      expect(result.current.amountHuman).toBe('1.5');
    });

    it('adds leading zero for inputs starting with comma', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount(',5');
      });

      expect(result.current.amountFiat).toBe('0.5');
    });

    it('keeps the amount parseable when input ends with a comma', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('0,');
      });

      expect(result.current.amountFiat).toBe('0.');
      expect(result.current.amountHuman).toBe('0');
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

    it('does not inflate max amount with token fiat rate when balanceUsdOverride is provided', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        balanceUsdOverride: 7.863083,
        tokenFiatRate: 0.999692,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      expect(result.current.amountFiat).toBe('7.863083');
      expect(result.current.amountHuman).toBe('7.863083');
      expect(updateTokenAmountMock).toHaveBeenCalledWith('7.863083');
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

  describe('hasAmount', () => {
    it('has hasAmount as false initially', () => {
      const { result } = runHook();

      expect(result.current.hasAmount).toBe(false);
    });

    it('sets hasAmount to true immediately, without waiting for the debounce', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      expect(result.current.hasAmount).toBe(true);
    });

    it('sets hasAmount back to false immediately when the amount is cleared', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current.updatePendingAmount('');
      });

      expect(result.current.hasAmount).toBe(false);
    });

    it('treats an explicit zero amount as no amount', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('0');
      });

      expect(result.current.hasAmount).toBe(false);
    });

    it('treats a zero-valued decimal amount as no amount', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('0.00');
      });

      expect(result.current.hasAmount).toBe(false);
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
    it('dispatches mm_pay_amount_input_type as manual without mm_pay_quote_requested when updatePendingAmount is called', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: {
            mm_pay_amount_input_type: 'manual',
          },
        },
      );
    });

    it('dispatches mm_pay_quote_requested as true after debounce when manual input triggers a quote refresh', () => {
      const { result } = runHook();

      act(() => {
        result.current.updatePendingAmount('50');
      });

      jest.mocked(upsertTransactionUIMetricsFragment).mockClear();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: {
            mm_pay_quote_requested: true,
          },
        },
      );
    });

    it('does not dispatch mm_pay_quote_requested after debounce when disableUpdate is true', () => {
      const { result } = runHook({ disableUpdate: true });

      act(() => {
        result.current.updatePendingAmount('50');
      });

      jest.mocked(upsertTransactionUIMetricsFragment).mockClear();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(upsertTransactionUIMetricsFragment).not.toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        expect.objectContaining({
          properties: expect.objectContaining({
            mm_pay_quote_requested: expect.anything(),
          }),
        }),
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

  describe('prefillMaxOnLoad', () => {
    it('pre-fills the max amount on mount when enabled and balance is known', () => {
      const { result } = runHook({
        prefillMaxOnLoad: true,
        payTokenBalanceUsd: 100,
      });

      expect(result.current.amountFiat).toBe('100');
    });

    it('enables max amount mode when pre-filling', () => {
      runHook({ prefillMaxOnLoad: true, payTokenBalanceUsd: 100 });

      expect(setIsMaxAmountMock).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        true,
      );
    });

    it('tags mm_pay_amount_input_type as prefilled_max when pre-filling', () => {
      runHook({ prefillMaxOnLoad: true, payTokenBalanceUsd: 100 });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        {
          properties: expect.objectContaining({
            mm_pay_amount_input_type: 'prefilled_max',
          }),
        },
      );
    });

    it('does not pre-fill when disabled', () => {
      const { result } = runHook({
        prefillMaxOnLoad: false,
        payTokenBalanceUsd: 100,
      });

      expect(result.current.amountFiat).toBe('0');
    });

    it('does not pre-fill when the balance is zero', () => {
      const { result } = runHook({
        prefillMaxOnLoad: true,
        payTokenBalanceUsd: 0,
      });

      expect(result.current.amountFiat).toBe('0');
    });
  });

  describe('deposit prefill', () => {
    const moneyAccountDepositMeta = {
      ...MOCK_TRANSACTION_META,
      type: TransactionType.moneyAccountDeposit,
    } as TransactionMeta;

    it('applies the deposit prefill amount for money account deposits', () => {
      const { result } = runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      expect(result.current.amountFiat).toBe('500');
      expect(result.current.isDepositPrefillEnabled).toBe(true);
      expect(result.current.isDepositPrefilled).toBe(true);
    });

    it('does not set max amount mode for deposit prefill', () => {
      runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '1000',
        },
      });

      expect(setIsMaxAmountMock).not.toHaveBeenCalledWith(
        moneyAccountDepositMeta.id,
        true,
      );
    });

    it('records prefilled amount metrics for deposit prefill', () => {
      runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      expect(upsertTransactionUIMetricsFragment).toHaveBeenCalledWith(
        moneyAccountDepositMeta.id,
        {
          properties: expect.objectContaining({
            mm_pay_amount_input_type: 'prefilled_max',
            mm_pay_prefilled_amount: 500,
          }),
        },
      );
    });

    it('does not apply deposit prefill for non-deposit transactions', () => {
      const { result } = runHook({
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      expect(result.current.amountFiat).toBe('0');
      expect(result.current.isDepositPrefillEnabled).toBe(false);
    });

    it('reports prefill loading while the amount recomputes', () => {
      const { result } = runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: false,
          isLoading: true,
          prefillAmount: undefined,
        },
      });

      expect(result.current.isDepositPrefillLoading).toBe(true);
    });

    it('does not report prefill loading after a manual edit', () => {
      const { result, rerender } = runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      act(() => {
        result.current.updatePendingAmount('123');
      });

      // Changing the pay token or funding account restarts the computation.
      useDepositPrefillAmountMock.mockReturnValue({
        enabled: true,
        hasPrefilled: false,
        isLoading: true,
        prefillAmount: undefined,
      });

      act(() => {
        rerender();
      });

      expect(result.current.isDepositPrefillLoading).toBe(false);
      expect(result.current.amountFiat).toBe('123');
    });

    it('keeps a user-typed amount after a pay token change', () => {
      const { result, rerender } = runHook({
        transactionMeta: moneyAccountDepositMeta,
        payTokenAddress: '0xtokena',
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      act(() => {
        result.current.updatePendingAmount('123');
      });

      jest
        .mocked(useTransactionPayTokenModule.useTransactionPayToken)
        .mockReturnValue({
          payToken: {
            address: '0xtokenb',
            balanceUsd: '2000',
            chainId: '0x1',
          } as unknown as ReturnType<
            typeof useTransactionPayTokenModule.useTransactionPayToken
          >['payToken'],
          setPayToken: jest.fn(),
          isNative: false,
        });

      // Token switch releases the previous prefill, then commits the new
      // token's 50%/100% amount. Neither step should overwrite a typed value.
      useDepositPrefillAmountMock.mockReturnValue({
        enabled: true,
        hasPrefilled: false,
        isLoading: true,
        prefillAmount: undefined,
      });

      act(() => {
        rerender();
      });

      useDepositPrefillAmountMock.mockReturnValue({
        enabled: true,
        hasPrefilled: true,
        isLoading: false,
        prefillAmount: '2000',
      });

      act(() => {
        rerender();
      });

      expect(result.current.amountFiat).toBe('123');
    });

    it('skips prefillMaxOnLoad when deposit prefill is enabled', () => {
      const { result } = runHook({
        transactionMeta: moneyAccountDepositMeta,
        prefillMaxOnLoad: true,
        payTokenBalanceUsd: 1000,
        depositPrefill: {
          enabled: true,
          hasPrefilled: true,
          isLoading: false,
          prefillAmount: '500',
        },
      });

      expect(result.current.amountFiat).toBe('500');
      expect(setIsMaxAmountMock).not.toHaveBeenCalledWith(
        moneyAccountDepositMeta.id,
        true,
      );
    });
  });

  describe('money account deposit max precision', () => {
    const moneyAccountDepositMeta = {
      ...MOCK_TRANSACTION_META,
      type: TransactionType.moneyAccountDeposit,
    } as TransactionMeta;

    const depositMaxPayToken = {
      payTokenBalanceUsd: 2.246912,
      payTokenBalanceRaw: '1123456',
      payTokenDecimals: 6,
      tokenFiatRate: 2,
      transactionMeta: moneyAccountDepositMeta,
    };

    it('submits the raw token balance for Max without setting isMaxAmount', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      // 1123456 × 10^-6 = 1.123456, not the fiat roundtrip 2.24 ÷ 2 = 1.12
      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.123456');
      expect(result.current.amountFiat).toBe('2.24');
      expect(setIsMaxAmountMock).not.toHaveBeenCalledWith(
        moneyAccountDepositMeta.id,
        true,
      );
    });

    it('does not overwrite the raw Max amount with the fiat-derived value after debounce', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });
      updateTokenAmountMock.mockClear();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.123456');
      expect(updateTokenAmountMock).not.toHaveBeenCalledWith('1.12');
    });

    it('uses the fiat-derived amount for a sub-100% deposit', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(50);
      });

      // 50% of 2.246912 rounded down = 1.12, ÷ 2 = 0.56
      expect(updateTokenAmountMock).toHaveBeenCalledWith('0.56');
    });

    it('clears the raw Max override after manual input', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });
      act(() => {
        result.current.updatePendingAmount('7');
      });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // amountFiat = 7, amountHuman = 7 ÷ 2 = 3.5
      expect(updateTokenAmountMock).toHaveBeenCalledWith('3.5');
    });

    it('does not use the raw balance for Max on non-deposit transactions', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        payTokenBalanceUsd: 2.246912,
        payTokenBalanceRaw: '1123456',
        payTokenDecimals: 6,
        tokenFiatRate: 2,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      // 100% of 2.246912 rounded down = 2.24, ÷ 2 = 1.12
      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.12');
      expect(setIsMaxAmountMock).toHaveBeenCalledWith(
        MOCK_TRANSACTION_META.id,
        true,
      );
    });

    it('defaults to 6 decimals when payToken.decimals is missing', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        payTokenDecimals: undefined,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.123456');
    });

    it('uses the fiat-derived amount for Max when the pay token is not a no-fee token', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        ...depositMaxPayToken,
        isNoFeePayToken: false,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      // The raw balance is denominated in the pay token, not mUSD, so a
      // non-1:1 token must go through the fiat conversion:
      // 100% of 2.246912 rounded down = 2.24, ÷ 2 = 1.12
      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.12');
      expect(updateTokenAmountMock).not.toHaveBeenCalledWith('1.123456');
    });

    it('falls back to the fiat-derived amount when balanceRaw is missing', () => {
      const updateTokenAmountMock = jest.fn();
      const { result } = runHook({
        payTokenBalanceUsd: 2.246912,
        tokenFiatRate: 2,
        transactionMeta: moneyAccountDepositMeta,
        updateTokenAmountMock,
      });

      act(() => {
        result.current.updatePendingAmountPercentage(100);
      });

      expect(updateTokenAmountMock).toHaveBeenCalledWith('1.12');
      expect(setIsMaxAmountMock).not.toHaveBeenCalledWith(
        moneyAccountDepositMeta.id,
        true,
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
