import { act } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockState from '../../../test/data/mock-state.json';
import { usePerpsOrderForm } from './usePerpsOrderForm';

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
        leverage: 1,
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
