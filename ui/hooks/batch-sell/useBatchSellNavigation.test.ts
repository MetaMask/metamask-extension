import { renderHook, act } from '@testing-library/react-hooks';
import {
  BATCH_SELL_SELECT_ROUTE,
  BATCH_SELL_CONFIRM_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { useBatchSellNavigation } from './useBatchSellNavigation';

const mockNavigate = jest.fn();
const mockPathname = '/some-page';
const mockLocationState = {
  selectedNetworkChainId: 'eip155:1',
  selectedAssetsId: ['asset-1'],
};

// Mutable so individual tests can override state / pathname.
let mockUseLocation: () => {
  pathname: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
} = () => ({
  pathname: mockPathname,
  state: mockLocationState,
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

describe('useBatchSellNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resetLocationState', () => {
    it('navigates to the current pathname with merged state and stayOnHomePage=false by default', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: mockPathname },
        {
          state: { ...mockLocationState, stayOnHomePage: false },
        },
      );
    });

    it('navigates to a custom destination when provided', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState('/custom-route');
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route', {
        state: { ...mockLocationState, stayOnHomePage: false },
      });
    });

    it('sets stayOnHomePage=true when the flag is passed', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState('/custom-route', true);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/custom-route', {
        state: { ...mockLocationState, stayOnHomePage: true },
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
        state: { ...mockLocationState, stayOnHomePage: true },
      });
    });
  });

  describe('navigateToBatchSellSelectPage', () => {
    it('navigates to BATCH_SELL_SELECT_ROUTE merging current location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        { state: { ...mockLocationState } },
      );
    });

    it('merges extra state with the current location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage({
          selectedNetworkChainId: 'eip155:8453',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        {
          state: {
            ...mockLocationState,
            selectedNetworkChainId: 'eip155:8453',
          },
        },
      );
    });

    it('extra state overrides matching keys from location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage({
          selectedAssetsId: ['asset-new'],
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        {
          state: {
            ...mockLocationState,
            selectedAssetsId: ['asset-new'],
          },
        },
      );
    });
  });

  describe('navigateToBatchSellConfirmPage', () => {
    it('navigates to BATCH_SELL_CONFIRM_ROUTE merging current location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellConfirmPage({
          selectedAssetsId: ['asset-1', 'asset-2'],
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_CONFIRM_ROUTE },
        {
          state: {
            ...mockLocationState,
            selectedAssetsId: ['asset-1', 'asset-2'],
          },
        },
      );
    });

    it('extra state overrides matching keys from location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellConfirmPage({
          selectedNetworkChainId: 'eip155:42161',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_CONFIRM_ROUTE },
        {
          state: {
            ...mockLocationState,
            selectedNetworkChainId: 'eip155:42161',
          },
        },
      );
    });
  });

  describe('when location state is null', () => {
    beforeEach(() => {
      mockUseLocation = () => ({ pathname: mockPathname, state: null });
    });

    afterEach(() => {
      mockUseLocation = () => ({
        pathname: mockPathname,
        state: mockLocationState,
      });
    });

    it('treats null location state as an empty object', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        { state: {} },
      );
    });
  });
});
