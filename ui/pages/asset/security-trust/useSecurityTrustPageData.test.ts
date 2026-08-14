import type { TokenSecurityData } from '@metamask/assets-controllers';
import { SolScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { renderHook } from '@testing-library/react';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import type { Token } from '../../../components/app/assets/types';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import * as securityTrustUtils from '../utils/security-trust-utils';
import { useSecurityTrustPageData } from './useSecurityTrustPageData';

jest.mock('../../../selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../../selectors/multichain/feature-flags', () => ({
  getIsSecurityTrustTdpEnabled: jest.fn(),
}));

const { getUseExternalServices } = jest.requireMock('../../../selectors') as {
  getUseExternalServices: jest.Mock;
};

const { getIsSecurityTrustTdpEnabled } = jest.requireMock(
  '../../../selectors/multichain/feature-flags',
) as {
  getIsSecurityTrustTdpEnabled: jest.Mock;
};

const mockUseSelector = jest.fn();

let mockLocationState: Record<string, unknown> | null = null;

let mockRouteParams = {
  chainId: 'eip155:1',
  asset: 'eip155:1/erc20:0xabc',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc/security-trust',
    state: mockLocationState,
  }),
  useParams: () => mockRouteParams,
}));

jest.mock('../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: jest.fn(),
}));

jest.mock('../../../selectors/assets', () => ({
  getFungibleAssetForRoute: jest.fn(),
}));

jest.mock('../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('../../../selectors/multichain/networks', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
}));

const mockUseTokenSecurityData = jest.mocked(useTokenSecurityData);

const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;

const baseSecurityData: TokenSecurityData = {
  resultType: 'Verified',
  maliciousScore: '0',
  features: [],
  fees: {
    transfer: 0,
    transferFeeMaxAmount: null,
    buy: 0,
    sell: null,
  },
  financialStats: {
    supply: 1000000,
    topHolders: [],
    holdersCount: 100,
    tradeVolume24h: null,
    lockedLiquidityPct: null,
    markets: [],
  },
  metadata: {
    externalLinks: {
      homepage: null,
      twitterPage: null,
      telegramChannelId: null,
    },
  },
  created: '2020-01-01T00:00:00.000Z',
};

const multichainNetworks = {
  'eip155:1': {
    chainId: 'eip155:1',
    name: 'Ethereum Mainnet',
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: ['https://etherscan.io'],
  },
};

const routeAsset: Token = {
  symbol: 'AAVE',
  decimals: 18,
  address: '0xabc',
  image: '',
  chainId: '0x1',
  isNative: false,
};

describe('useSecurityTrustPageData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockLocationState = null;

    mockRouteParams = {
      chainId: 'eip155:1',
      asset: 'eip155:1/erc20:0xabc',
    };

    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: 'USDC',
      decimals: 6,
      address: '0xabc',
      isNative: false,
    });

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return true;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return true;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    jest.mocked(getFungibleAssetForRoute).mockReturnValue(routeAsset);
  });

  it('falls back to route asset metadata when location state is missing', () => {
    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: undefined,
      decimals: undefined,
      address: undefined,
      isNative: undefined,
    });

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.symbol).toBe('AAVE');
    expect(result.current.decimals).toBe(18);
    expect(result.current.networkName).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.name).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.url).toContain('etherscan.io');
  });

  it('uses fetched token metadata when route asset is unavailable', () => {
    jest.mocked(getFungibleAssetForRoute).mockReturnValue(null);

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.symbol).toBe('USDC');
    expect(result.current.decimals).toBe(6);
    expect(result.current.networkName).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.url).toContain('etherscan.io');
  });

  it('requests security data for the route asset id', () => {
    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId,
      prefetchedData: undefined,
    });
  });

  it('derives CAIP chainId from route when location state is missing', () => {
    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.chainId).toBe('eip155:1');
  });

  it('derives CAIP chainId for non-EVM routes without location state', () => {
    mockRouteParams = {
      chainId: SolScope.Mainnet,
      asset: `${SolScope.Mainnet}/spl:So11111111111111111111111111111111111111112`,
    };

    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: 'SOL',
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
      isNative: false,
    });

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.chainId).toBe(SolScope.Mainnet);
    expect(result.current.blockExplorerLink?.url).toContain('solscan.io');
  });

  it('falls back to EVM network config when CAIP chain id is unavailable', () => {
    jest
      .spyOn(securityTrustUtils, 'toSecurityTrustChainId')
      .mockReturnValue(undefined);
    mockRouteParams = {
      chainId: '0x1',
      asset: '0xabc',
    };

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.networkName).toBe('Ethereum Mainnet Hex');
  });

  it('returns undefined network name when CAIP and hex lookups are unavailable', () => {
    jest
      .spyOn(securityTrustUtils, 'toSecurityTrustChainId')
      .mockReturnValue(undefined);
    mockRouteParams = {
      chainId: SolScope.Mainnet,
      asset: `${SolScope.Mainnet}/spl:So11111111111111111111111111111111111111112`,
    };

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.networkName).toBeUndefined();
  });

  it('does not request security data when feature is disabled', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return true;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return false;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId: null,
      prefetchedData: undefined,
    });
  });

  it('does not request security data when external services are disabled', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return false;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return true;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId: null,
      prefetchedData: undefined,
    });
  });
});
