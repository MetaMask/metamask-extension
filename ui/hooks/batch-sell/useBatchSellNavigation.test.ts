import { renderHook, act } from '@testing-library/react-hooks';
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
    it('navigates to the current pathname with stayOnHomePage=false by default', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: mockPathname },
        {
          state: { stayOnHomePage: false },
        },
      );
    });

    it('navigates to a custom destination when provided', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState('/custom-route');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route', {
        state: { stayOnHomePage: false },
      });
    });

    it('sets stayOnHomePage=true when the flag is passed', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState('/custom-route', true);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route', {
        state: { stayOnHomePage: true },
      });
    });
  });

  describe('navigateToDefaultRoute', () => {
    it('navigates to the DEFAULT_ROUTE with stayOnHomePage=true', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToDefaultRoute();
      });

      expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        state: { stayOnHomePage: true },
      });
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
