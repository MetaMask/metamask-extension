import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';

import { useSelector } from 'react-redux';
import { useConfirmContext } from '../../pages/confirmations/context/confirm';
import { useCustomAmount } from './useCustomAmount';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../pages/confirmations/context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseConfirmContext = useConfirmContext as jest.MockedFunction<
  typeof useConfirmContext
>;

describe('useCustomAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when mUSD conversion is enabled and transaction type is musdConversion', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(true); // selectIsMusdConversionFlowEnabled
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          type: TransactionType.musdConversion,
        },
      } as ReturnType<typeof useConfirmContext>);
    });

    it('should return shouldShowOutputAmountTag as true', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.shouldShowOutputAmountTag).toBe(true);
    });

    it('should return outputSymbol as "mUSD"', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputSymbol).toBe('mUSD');
    });

    it('should format outputAmount to 2 decimal places', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100.5678' }),
      );

      expect(result.current.outputAmount).toBe('100.57');
    });

    it('should handle whole numbers', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputAmount).toBe('100.00');
    });

    it('should handle amounts with 1 decimal place', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '50.5' }),
      );

      expect(result.current.outputAmount).toBe('50.50');
    });

    it('should handle empty string input', () => {
      const { result } = renderHook(() => useCustomAmount({ amountHuman: '' }));

      expect(result.current.outputAmount).toBe('0.00');
    });

    it('should handle invalid input', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: 'invalid' }),
      );

      expect(result.current.outputAmount).toBe('0.00');
    });

    it('should handle zero amount', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '0' }),
      );

      expect(result.current.outputAmount).toBe('0.00');
    });
  });

  describe('when mUSD conversion is disabled', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(false); // selectIsMusdConversionFlowEnabled
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          type: TransactionType.musdConversion,
        },
      } as ReturnType<typeof useConfirmContext>);
    });

    it('should return shouldShowOutputAmountTag as false', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.shouldShowOutputAmountTag).toBe(false);
    });

    it('should return outputAmount as null', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputAmount).toBeNull();
    });

    it('should return outputSymbol as null', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputSymbol).toBeNull();
    });
  });

  describe('when transaction type is not musdConversion', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(true); // selectIsMusdConversionFlowEnabled
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: {
          type: TransactionType.simpleSend,
        },
      } as ReturnType<typeof useConfirmContext>);
    });

    it('should return shouldShowOutputAmountTag as false', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.shouldShowOutputAmountTag).toBe(false);
    });

    it('should return outputAmount as null', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputAmount).toBeNull();
    });

    it('should return outputSymbol as null', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.outputSymbol).toBeNull();
    });
  });

  describe('when currentConfirmation is undefined', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(true); // selectIsMusdConversionFlowEnabled
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: undefined,
      } as ReturnType<typeof useConfirmContext>);
    });

    it('should return shouldShowOutputAmountTag as false', () => {
      const { result } = renderHook(() =>
        useCustomAmount({ amountHuman: '100' }),
      );

      expect(result.current.shouldShowOutputAmountTag).toBe(false);
    });
  });
});
