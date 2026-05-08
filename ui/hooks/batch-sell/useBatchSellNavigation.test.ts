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
    it('navigates to the current pathname with stayOnHomePage=false by default and ignores existing location state', () => {
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

    it('does not propagate batch sell selections from location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.resetLocationState();
      });

      const [, options] = mockNavigate.mock.calls[0];
      expect(options.state).not.toHaveProperty('selectedNetworkChainId');
      expect(options.state).not.toHaveProperty('selectedAssetsId');
    });
  });

  describe('navigateToDefaultRoute', () => {
    it('navigates to the DEFAULT_ROUTE with stayOnHomePage=true and no batch sell selections', () => {
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
    it('navigates to BATCH_SELL_SELECT_ROUTE with empty state when called without args, regardless of existing location state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage();
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        { state: {} },
      );
    });

    it('uses only the explicitly provided state and ignores existing location state', () => {
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
            selectedNetworkChainId: 'eip155:8453',
          },
        },
      );
    });

    it('passes selectedAssetsId through verbatim when provided', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellSelectPage({
          selectedNetworkChainId: 'eip155:1',
          selectedAssetsId: ['asset-new'],
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_SELECT_ROUTE },
        {
          state: {
            selectedNetworkChainId: 'eip155:1',
            selectedAssetsId: ['asset-new'],
          },
        },
      );
    });
  });

  describe('navigateToBatchSellConfirmPage', () => {
    it('navigates to BATCH_SELL_CONFIRM_ROUTE with only the explicitly provided state', () => {
      const { result } = renderHook(() => useBatchSellNavigation());

      act(() => {
        result.current.navigateToBatchSellConfirmPage({
          selectedNetworkChainId: 'eip155:1',
          selectedAssetsId: ['asset-1', 'asset-2'],
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        { pathname: BATCH_SELL_CONFIRM_ROUTE },
        {
          state: {
            selectedNetworkChainId: 'eip155:1',
            selectedAssetsId: ['asset-1', 'asset-2'],
          },
        },
      );
    });

    it('does not merge existing location state into the new state', () => {
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

    it('navigates without throwing when location state is null', () => {
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
