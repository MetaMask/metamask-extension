import { act } from '@testing-library/react-hooks';
import {
  AssetType,
  FeatureId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { buildAssetRoutePath } from '../../../shared/lib/asset-route';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
import { DEFAULT_ROUTE } from '../../../shared/lib/deep-links/routes/route';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import * as environmentTypeUtils from '../../../shared/lib/environment-type';
import * as bridgeActions from '../../ducks/bridge/actions';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
  PREPARE_SWAP_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import type { BridgeToken } from '../../ducks/bridge/types';
import { useBridgeNavigation } from './useBridgeNavigation';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
const mockDispatch = jest.fn((...args: unknown[]) => jest.fn()(...args));

const BRIDGE_PREPARE_PATH = `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`;
const HARDWARE_WALLET_SIGNATURES_PATH = `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`;

const locationToken = {
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chainId: '0x1',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

const locationBridgeState = {
  fromTokenInputValue: '10',
};

const daiBridgeToken: BridgeToken = {
  assetId: 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
  chainId: 'eip155:1',
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  iconUrl: 'https://example.com/dai.png',
  balance: '100',
};

const nativeEthBridgeToken: BridgeToken = {
  assetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  iconUrl: 'https://example.com/eth.png',
  balance: '1',
};

const solBridgeToken: BridgeToken = {
  assetId: `${MultichainNetworks.SOLANA}/slip44:501`,
  chainId: MultichainNetworks.SOLANA,
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  iconUrl: 'https://example.com/sol.png',
  balance: '5',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch:
    () =>
    (...args: unknown[]) =>
      mockDispatch(...args),
}));

const renderUseBridgeNavigation = (
  mockStoreState: object = createBridgeMockStore(),
  pathname = '/cross-chain/swaps/prepare-bridge-page',
) =>
  renderHookWithProvider(() => useBridgeNavigation(), mockStoreState, pathname);

describe('useBridgeNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: '/cross-chain/swaps/prepare-bridge-page',
      search: '',
      state: {
        token: locationToken,
        bridgeState: locationBridgeState,
      },
    });
  });

  it('exposes token and bridgeState from location state', () => {
    const { result } = renderUseBridgeNavigation();

    expect(result.current.token).toEqual(locationToken);
    expect(result.current.bridgeState).toEqual(locationBridgeState);
    expect(result.current.search).toBe('');
  });

  describe('navigateToAssetPage', () => {
    it('navigates to the CAIP-19 asset route for an EVM ERC-20 token', () => {
      const { result } = renderUseBridgeNavigation(createBridgeMockStore());

      act(() => {
        result.current.navigateToAssetPage(daiBridgeToken);
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        buildAssetRoutePath(daiBridgeToken.assetId),
        {
          state: {
            bridgeState: expect.any(Object),
            token: {
              type: AssetType.token,
              assetId: daiBridgeToken.assetId,
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              symbol: 'DAI',
              name: 'Dai Stablecoin',
              chainId: '0x1',
              image: daiBridgeToken.iconUrl,
              isNative: false,
              decimals: 18,
            },
          },
        },
      );
    });

    it('navigates to the CAIP-19 asset route for a native EVM token', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.navigateToAssetPage(nativeEthBridgeToken);
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        buildAssetRoutePath(nativeEthBridgeToken.assetId),
        expect.objectContaining({
          state: expect.objectContaining({
            token: expect.objectContaining({
              type: AssetType.native,
              assetId: nativeEthBridgeToken.assetId,
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              chainId: '0x1',
              isNative: true,
            }),
          }),
        }),
      );
    });

    it('navigates to the CAIP-19 asset route for a non-EVM token', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.navigateToAssetPage(solBridgeToken);
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        buildAssetRoutePath(solBridgeToken.assetId),
        expect.objectContaining({
          state: expect.objectContaining({
            token: expect.objectContaining({
              type: AssetType.native,
              assetId: solBridgeToken.assetId,
              address: solBridgeToken.assetId,
              symbol: 'SOL',
              chainId: MultichainNetworks.SOLANA,
              isNative: true,
            }),
          }),
        }),
      );
    });
  });

  describe('navigateToBridgePage', () => {
    it('tracks page view and navigates without replace on entrypoint', () => {
      const trackUnifiedSwapBridgeEventSpy = jest
        .spyOn(bridgeActions, 'trackUnifiedSwapBridgeEvent')
        .mockImplementation((...args: unknown[]) => jest.fn()(...args));
      jest
        .spyOn(environmentTypeUtils, 'getEnvironmentType')
        .mockReturnValue('popup');

      const { result } = renderUseBridgeNavigation();
      const searchParams = new URLSearchParams('from=test-from');

      act(() => {
        result.current.navigateToBridgePage({
          token: locationToken,
          search: searchParams,
          isEntrypoint: true,
        });
      });

      expect(trackUnifiedSwapBridgeEventSpy).toHaveBeenCalledWith(
        UnifiedSwapBridgeEventName.PageViewed,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'popup',
        }),
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: 'from=test-from',
        },
        {
          state: {
            bridgeState: locationBridgeState,
            sendBundle: null,
            token: locationToken,
          },
          replace: false,
        },
      );
    });

    it('navigates with replace when not an entrypoint', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.navigateToBridgePage({
          token: locationToken,
          search: new URLSearchParams(''),
          isEntrypoint: false,
        });
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        {
          pathname: BRIDGE_PREPARE_PATH,
          search: '',
        },
        expect.objectContaining({
          replace: true,
        }),
      );
    });
  });

  describe('resetSearchParams', () => {
    it('removes the requested search params and preserves location state', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/cross-chain/swaps/prepare-bridge-page',
        search: `?${BridgeQueryParams.From}=from-token&${BridgeQueryParams.Amount}=10`,
        state: {
          token: locationToken,
          bridgeState: locationBridgeState,
        },
      });

      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.resetSearchParams([BridgeQueryParams.From]);
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        {
          pathname: '/cross-chain/swaps/prepare-bridge-page',
          search: `${BridgeQueryParams.Amount}=10`,
        },
        {
          replace: true,
          state: {
            token: locationToken,
            bridgeState: locationBridgeState,
          },
        },
      );
    });
  });

  describe('resetLocationState', () => {
    it('clears bridge navigation state on the current route', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.resetLocationState();
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        { pathname: '/cross-chain/swaps/prepare-bridge-page' },
        {
          state: {
            bridgeState: null,
            sendBundle: null,
            token: null,
            stayOnHomePage: false,
          },
        },
      );
    });
  });

  describe('navigateToHwSigningPage', () => {
    it('navigates to the hardware wallet signatures route', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.navigateToHwSigningPage();
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        HARDWARE_WALLET_SIGNATURES_PATH,
        {
          state: {
            token: locationToken,
            bridgeState: locationBridgeState,
            sendBundle: null,
          },
        },
      );
    });
  });

  describe('navigateToActivityPage', () => {
    it('navigates to the activity tab and clears bridge navigation state', () => {
      const { result } = renderUseBridgeNavigation();

      act(() => {
        result.current.navigateToActivityPage();
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          state: {
            bridgeState: null,
            sendBundle: null,
            token: null,
            stayOnHomePage: true,
          },
          replace: true,
        },
      );
    });
  });

  describe('navigateToDefaultRoute', () => {
    it('resets the bridge controller and navigates home by default', async () => {
      const resetBridgeControllerSpy = jest
        .spyOn(bridgeActions, 'resetBridgeController')
        .mockImplementation((...args: unknown[]) => jest.fn()(...args));

      const { result } = renderUseBridgeNavigation();

      await act(async () => {
        await result.current.navigateToDefaultRoute();
      });

      expect(resetBridgeControllerSpy).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        state: {
          bridgeState: null,
          sendBundle: null,
          token: null,
          stayOnHomePage: true,
        },
      });
    });

    it('navigates to transaction shield when the query param is present', async () => {
      jest
        .spyOn(bridgeActions, 'resetBridgeController')
        .mockImplementation((...args: unknown[]) => jest.fn()(...args));

      mockUseLocation.mockReturnValue({
        pathname: '/cross-chain/swaps/prepare-bridge-page',
        search: `?${BridgeQueryParams.IsFromTransactionShield}=true`,
        state: {
          token: locationToken,
          bridgeState: locationBridgeState,
        },
      });

      const { result } = renderUseBridgeNavigation();

      await act(async () => {
        await result.current.navigateToDefaultRoute();
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(TRANSACTION_SHIELD_ROUTE, {
        state: {
          bridgeState: null,
          sendBundle: null,
          token: null,
          stayOnHomePage: false,
        },
      });
    });
  });
});
