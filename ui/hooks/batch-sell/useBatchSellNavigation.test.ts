import { renderHook, act } from '@testing-library/react';
import {
  BATCH_SELL_SELECT_ROUTE,
  BATCH_SELL_REVIEW_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { useBatchSellNavigation } from './useBatchSellNavigation';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('useBatchSellNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('navigateToDefaultRoute', () => {
    it('navigates to the DEFAULT_ROUTE', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToDefaultRoute();
      });

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });
  });

  describe('navigateToBatchSellSelectPage', () => {
    it('navigates to BATCH_SELL_SELECT_ROUTE', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage();
      });

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: BATCH_SELL_SELECT_ROUTE,
      });
    });
  });

  describe('navigateToBatchSellConfirmPage', () => {
    it('navigates to BATCH_SELL_REVIEW_ROUTE', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellConfirmPage();
      });

      expect(mockNavigate).toHaveBeenCalledWith({
        pathname: BATCH_SELL_REVIEW_ROUTE,
      });
    });
  });
});
