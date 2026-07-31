import { renderHook } from '@testing-library/react-hooks';
import type { TokenSecurityData } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import type { Token } from '../../../components/app/assets/types';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import { useSecurityTrustPageData } from './useSecurityTrustPageData';

const mockUseSelector = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc/security-trust',
    state: null,
  }),
  useParams: () => ({
    chainId: 'eip155:1',
    asset: 'eip155:1/erc20:0xabc',
  }),
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
});
