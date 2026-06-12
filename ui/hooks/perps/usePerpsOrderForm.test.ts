import { act } from '@testing-library/react-hooks';

import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsOrderForm } from './usePerpsOrderForm';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

describe('usePerpsOrderForm', () => {
  const defaultOptions = {
    asset: 'BTC',
    currentPrice: 45000,
    initialDirection: 'long' as const,
    mode: 'new' as const,
  };

  const mockStateWithLocale = {
    metamask: {
      ...mockState.metamask,
    },
  };

  beforeEach(() => {
    jest.mocked(submitRequestToBackground).mockImplementation((method) => {
      const immediate = <ResolvedValue>(
        value: ResolvedValue,
      ): Promise<ResolvedValue> =>
        ({
          then(onFulfilled: (resolved: ResolvedValue) => unknown) {
            const result = onFulfilled(value);
            return immediate(result as ResolvedValue);
          },
          catch() {
            return immediate(value);
          },
          finally(onFinally: () => void) {
            onFinally();
            return immediate(value);
          },
        }) as Promise<ResolvedValue>;

      if (method === 'perpsCalculateLiquidationPrice') {
        return immediate('40000');
      }
      return immediate(undefined);
    });
  });

  describe('initialization', () => {
    it('initializes with default form state', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      expect(result.current.formState).toMatchObject({
        asset: 'BTC',
        direction: 'long',
        amount: '',
        leverage: 3,
        type: 'market',
        autoCloseEnabled: false,
        takeProfitPrice: '',
        stopLossPrice: '',
      });
    });

    it('initializes closePercent to 100', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      expect(result.current.closePercent).toBe(100);
    });

    it('uses initialLeverage when provided for new orders', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            initialLeverage: 7,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.leverage).toBe(7);
    });

    it('applies initialLeverage when it changes after initial render (async hydration)', () => {
      const props = {
        ...defaultOptions,
        initialLeverage: undefined as number | undefined,
      };
      const { result, rerender } = renderHookWithProvider(
        () => usePerpsOrderForm(props),
        mockStateWithLocale,
      );

      expect(result.current.formState.leverage).toBe(3);

      props.initialLeverage = 8;
      act(() => {
        rerender();
      });

      expect(result.current.formState.leverage).toBe(8);
    });

    it('ignores initialLeverage in modify mode (uses position leverage)', () => {
      const existingPosition = {
        size: '1.0',
        leverage: 5,
        entryPrice: '44000',
      };
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'modify',
            existingPosition,
            initialLeverage: 10,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.leverage).toBe(5);
    });

    it('initializes with short direction when specified', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            initialDirection: 'short',
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.direction).toBe('short');
    });
  });

  describe('modify mode', () => {
    const existingPosition = {
      size: '2.5',
      leverage: 5,
      entryPrice: '44000',
      takeProfitPrice: '50000',
      stopLossPrice: '40000',
    };

    it('pre-populates leverage from existing position', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'modify',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.leverage).toBe(5);
    });

    it('pre-populates TP/SL from existing position', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'modify',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.takeProfitPrice).toBe('50000');
      expect(result.current.formState.stopLossPrice).toBe('40000');
    });

    it('enables auto-close when TP/SL exists', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'modify',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.autoCloseEnabled).toBe(true);
    });

    it('initializes amount empty so user enters size increase, not total', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'modify',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      expect(result.current.formState.amount).toBe('');
      expect(result.current.formState.balancePercent).toBe(0);
    });
  });

  describe('handlers', () => {
    it('handleAmountChange updates amount', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('1000');
      });

      expect(result.current.formState.amount).toBe('1000');
    });

    it('handleBalancePercentChange updates balancePercent', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleBalancePercentChange(50);
      });

      expect(result.current.formState.balancePercent).toBe(50);
    });

    it('handleLeverageChange updates leverage', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleLeverageChange(10);
      });

      expect(result.current.formState.leverage).toBe(10);
    });

    it('handleAutoCloseEnabledChange updates autoCloseEnabled', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAutoCloseEnabledChange(true);
      });

      expect(result.current.formState.autoCloseEnabled).toBe(true);
    });

    it('handleTakeProfitPriceChange updates takeProfitPrice', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleTakeProfitPriceChange('50000');
      });

      expect(result.current.formState.takeProfitPrice).toBe('50000');
    });

    it('handleStopLossPriceChange updates stopLossPrice', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleStopLossPriceChange('40000');
      });

      expect(result.current.formState.stopLossPrice).toBe('40000');
    });

    it('handleClosePercentChange updates closePercent', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleClosePercentChange(50);
      });

      expect(result.current.closePercent).toBe(50);
    });

    it('handleSubmit calls onSubmit with form state', () => {
      const onSubmit = jest.fn();
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            onSubmit,
          }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('1000');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 'BTC',
          amount: '1000',
        }),
      );
    });
  });

  describe('calculations', () => {
    it('returns null values when amount is 0', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      expect(result.current.calculations.positionSize).toBeNull();
      expect(result.current.calculations.marginRequired).toBeNull();
      expect(result.current.calculations.liquidationPrice).toBeNull();
      expect(result.current.calculations.orderValue).toBeNull();
      expect(result.current.calculations.estimatedFees).toBeNull();
    });

    it('calculates values when amount is entered', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('1000');
      });

      expect(result.current.calculations.positionSize).toBeDefined();
      expect(result.current.calculations.marginRequired).toBeDefined();
      expect(result.current.calculations.liquidationPrice).toBeDefined();
      expect(result.current.calculations.orderValue).toBeDefined();
      expect(result.current.calculations.estimatedFees).toBeDefined();
    });

    it('calculates close values in close mode', () => {
      const existingPosition = {
        size: '2.0',
        leverage: 5,
        entryPrice: '45000',
      };

      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'close',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      // Default 100% close of 2.0 BTC at $45000
      expect(result.current.calculations.positionSize).toBeDefined();
      expect(result.current.calculations.orderValue).toBeDefined();
      expect(result.current.calculations.marginRequired).toBeNull();
      expect(result.current.calculations.liquidationPrice).toBeNull();
    });

    it('uses markPrice (oracle) for margin calculation when provided', () => {
      // amount=$15, leverage=3x, currentPrice=$24.95, markPrice=$25.65, szDecimals=1
      // positionSize = round(15/24.95, 1) = 0.6, but 0.6 * 24.95 = 14.97 < 15,
      // so calculatePositionSize bumps up to 0.7.
      // notional = 0.7 × 25.65 = $17.955, margin = $17.955 / 3 ≈ $5.98 (float truncation)
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            currentPrice: 24.95, // mid/candle price — different from oracle
            markPrice: 25.65, // oracle price — what mobile uses for margin
            szDecimals: 1,
          }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('15');
        result.current.handleLeverageChange(3);
      });

      // Assertion verified: '5.98' matches the bumped-position-size calculation above.
      expect(result.current.calculations.marginRequired).toContain('5.98');
    });

    it('falls back to currentPrice for margin when markPrice is not provided', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            currentPrice: 45000,
            // markPrice omitted — should fall back
          }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('9000');
        result.current.handleLeverageChange(3);
      });

      // margin = 9000 / 3 = $3,000 using currentPrice as fallback
      expect(result.current.calculations.marginRequired).toContain('3,000');
    });

    it('uses limit price (not markPrice) for margin on limit orders', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            currentPrice: 45000,
            markPrice: 44000, // oracle — should be ignored for limit orders
            orderType: 'limit',
          }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('9000');
        result.current.handleLimitPriceChange('45000');
        result.current.handleLeverageChange(3);
      });

      // margin = 9000 / 3 = $3,000 using the limit price, not markPrice
      expect(result.current.calculations.marginRequired).toContain('3,000');
    });

    it('calculates margin as notional divided by leverage (no fee included)', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('10000');
        result.current.handleLeverageChange(10);
      });

      // Size = $10,000, leverage = 10x → margin = $10,000 / 10 = $1,000
      // Fees are a separate line item and are NOT included in margin
      expect(result.current.calculations.marginRequired).not.toBeNull();
      expect(result.current.calculations.marginRequired).toContain('1,000');
      expect(result.current.calculations.marginRequired).not.toContain(
        '10,000',
      );
    });

    it('sets orderValue equal to size (not size × leverage)', () => {
      const { result } = renderHookWithProvider(
        () => usePerpsOrderForm(defaultOptions),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('5000');
        result.current.handleLeverageChange(5);
      });

      // orderValue should be $5000 (the size), not $25000 (size × leverage)
      expect(result.current.calculations.orderValue).toContain('5,000');
      expect(result.current.calculations.orderValue).not.toContain('25,000');
    });

    it('recalculates balancePercent when leverage changes', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            availableBalance: 1000,
          }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('5000');
        result.current.handleLeverageChange(10);
      });

      // Size $5000, available $1000, leverage 10x → maxSize $10000 → 50%
      expect(result.current.formState.balancePercent).toBe(50);

      act(() => {
        result.current.handleLeverageChange(5);
      });

      // Same size $5000, now leverage 5x → maxSize $5000 → 100%
      expect(result.current.formState.balancePercent).toBe(100);
    });

    it('recalculates when closePercent changes', () => {
      const existingPosition = {
        size: '2.0',
        leverage: 5,
        entryPrice: '45000',
      };

      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            mode: 'close',
            existingPosition,
          }),
        mockStateWithLocale,
      );

      const initialPositionSize = result.current.calculations.positionSize;

      act(() => {
        result.current.handleClosePercentChange(50);
      });

      // 50% close should give different position size than 100%
      expect(result.current.calculations.positionSize).not.toBe(
        initialPositionSize,
      );
    });

    it('uses dot-decimal limit price correctly in calculations', () => {
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            orderType: 'limit',
          }),
        mockState,
      );

      act(() => {
        result.current.handleAmountChange('1000');
      });

      act(() => {
        result.current.handleLimitPriceChange('45050.00');
      });

      expect(result.current.calculations.positionSize).toContain('BTC');
      // Amount is treated as notional position size (TAT-2684 fix), so
      // orderValue equals the entered amount ($1000) regardless of leverage.
      expect(result.current.calculations.orderValue).toBe('$1,000');
    });
  });

  describe('order type prop', () => {
    it('preserves amount and leverage when orderType prop changes', () => {
      let orderType: 'market' | 'limit' = 'market';
      const { result, rerender } = renderHookWithProvider(
        () => usePerpsOrderForm({ ...defaultOptions, orderType }),
        mockStateWithLocale,
      );

      act(() => {
        result.current.handleAmountChange('1000');
        result.current.handleLeverageChange(10);
      });

      orderType = 'limit';
      act(() => {
        rerender();
      });

      expect(result.current.formState.amount).toBe('1000');
      expect(result.current.formState.leverage).toBe(10);
      expect(result.current.formState.type).toBe('limit');
    });
  });

  describe('form state change callback', () => {
    it('calls onFormStateChange when form state changes', () => {
      const onFormStateChange = jest.fn();
      const { result } = renderHookWithProvider(
        () =>
          usePerpsOrderForm({
            ...defaultOptions,
            onFormStateChange,
          }),
        mockStateWithLocale,
      );

      // Clear initial call
      onFormStateChange.mockClear();

      act(() => {
        result.current.handleAmountChange('500');
      });

      expect(onFormStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: '500',
        }),
      );
    });
  });
});
