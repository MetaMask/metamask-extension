import { renderHook, act } from '@testing-library/react';
import {
  BATCH_SELL_SELECT_ROUTE,
  BATCH_SELL_REVIEW_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { useBatchSellNavigation } from './useBatchSellNavigation';

const mockNavigate = jest.fn();
const mockPathname = '/some-page';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname, state: null }),
}));

describe('useBatchSellNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resetLocationState', () => {
    it('navigates to the current pathname by default', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState();
      });

      expect(mockNavigate).toHaveBeenCalledWith({ pathname: mockPathname });
    });

    it('navigates to a custom destination when provided', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState('/custom-route');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route');
    });
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
