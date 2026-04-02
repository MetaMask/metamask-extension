import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
  MOCK_EXTERNAL_SOLANA_ADDRESS,
} from '../../../test/data/bridge/mock-bridge-store';
import { useTokenSearchResults } from './useTokenSearchResults';

jest.mock('../../pages/bridge/utils/tokens', () => ({
  fetchTokensBySearchQuery: jest.fn().mockResolvedValue({
    tokens: [],
    endCursor: undefined,
    hasNextPage: false,
  }),
}));

jest.mock('../../store/actions', () => ({
  getBearerToken: jest.fn().mockResolvedValue('mock-jwt'),
}));

describe('useTokenSearchResults', () => {
  it('does not crash when accountAddress is an external address with no matching account group', () => {
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          refreshRate: 30000,
          maxRefreshCount: 5,
          support: true,
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
          chainRanking: [{ chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) }],
        },
      },
    });

    const { result } = renderHookWithProvider(
      () =>
        useTokenSearchResults({
          searchQuery: '',
          assetsToInclude: [],
          accountAddress: MOCK_EXTERNAL_SOLANA_ADDRESS,
          chainIds: new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        }),
      mockStoreState,
    );

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearchResultsLoading).toBe(false);
    expect(result.current.hasMoreResults).toBe(false);
  });

  it('returns empty search results when accountAddress belongs to a known account group', () => {
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          refreshRate: 30000,
          maxRefreshCount: 5,
          support: true,
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
          chainRanking: [{ chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) }],
        },
      },
    });

    const { result } = renderHookWithProvider(
      () =>
        useTokenSearchResults({
          searchQuery: '',
          assetsToInclude: [],
          accountAddress: MOCK_EVM_ACCOUNT.address,
          chainIds: new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        }),
      mockStoreState,
    );

    // The hook resolves the account group and calls getBridgeAssetsByAssetId
    // (truthy branch of: accountGroup ? getBridgeAssetsByAssetId(...) : {})
    // No search query → no fetch triggered, empty results
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isSearchResultsLoading).toBe(false);
    expect(result.current.hasMoreResults).toBe(false);
  });
});
