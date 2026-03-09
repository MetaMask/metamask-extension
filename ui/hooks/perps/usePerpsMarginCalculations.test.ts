import { renderHook } from '@testing-library/react-hooks';
import {
  mockPositions,
  mockAccountState,
} from '../../components/app/perps/mocks';
import { usePerpsMarginCalculations } from './usePerpsMarginCalculations';

describe('usePerpsMarginCalculations', () => {
  const position = mockPositions[0]; // ETH long, marginUsed 2375, leverage 3
  const currentPrice = 2900;
  const account = mockAccountState;

  describe('add mode', () => {
    it('returns available balance as maxAmount', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'add',
          amount: '0',
        }),
      );

      expect(result.current.maxAmount).toBe(
        parseFloat(mockAccountState.availableBalance),
      );
    });

    it('returns null riskAssessment in add mode', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'add',
          amount: '100',
        }),
      );

      expect(result.current.riskAssessment).toBeNull();
    });

    it('isValid is true when amount is between min and max', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'add',
          amount: '500',
        }),
      );

      expect(result.current.isValid).toBe(true);
    });

    it('isValid is false when amount is zero', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'add',
          amount: '0',
        }),
      );

      expect(result.current.isValid).toBe(false);
    });

    it('computes currentLiquidationDistance from position', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'add',
          amount: '100',
        }),
      );

      const liqPrice = parseFloat(position.liquidationPrice ?? '0');
      const expected = (Math.abs(currentPrice - liqPrice) / currentPrice) * 100;
      expect(result.current.currentLiquidationDistance).toBeCloseTo(expected);
    });
  });

  describe('remove mode', () => {
    it('returns maxRemovable as maxAmount', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'remove',
          amount: '0',
        }),
      );

      expect(result.current.maxAmount).toBeGreaterThanOrEqual(0);
      expect(typeof result.current.maxAmount).toBe('number');
    });

    it('returns riskAssessment when amount is set in remove mode', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'remove',
          amount: '500',
        }),
      );

      expect(result.current.riskAssessment).toEqual(
        expect.objectContaining({
          riskLevel: expect.stringMatching(/^(safe|warning|danger)$/u),
          priceDiff: expect.any(Number),
          riskRatio: expect.any(Number),
        }),
      );
    });

    it('isValid is false when remove amount exceeds maxAmount', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account,
          mode: 'remove',
          amount: '999999',
        }),
      );

      expect(result.current.isValid).toBe(false);
    });
  });

  describe('with null account', () => {
    it('returns maxAmount 0 in add mode', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position,
          currentPrice,
          account: null,
          mode: 'add',
          amount: '100',
        }),
      );

      expect(result.current.maxAmount).toBe(0);
    });
  });

  describe('with position that has no liquidation price', () => {
    const positionNoLiq = {
      ...mockPositions[0],
      liquidationPrice: null as string | null,
    };

    it('returns currentLiquidationDistance 0', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position: positionNoLiq,
          currentPrice,
          account,
          mode: 'add',
          amount: '0',
        }),
      );

      expect(result.current.currentLiquidationDistance).toBe(0);
    });

    it('returns newLiquidationPrice null when current liq is null', () => {
      const { result } = renderHook(() =>
        usePerpsMarginCalculations({
          position: positionNoLiq,
          currentPrice,
          account,
          mode: 'add',
          amount: '100',
        }),
      );

      expect(result.current.newLiquidationPrice).toBeNull();
    });
  });
});
