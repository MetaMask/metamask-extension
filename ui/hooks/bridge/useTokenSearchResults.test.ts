import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { type CaipChainId } from '@metamask/utils';
import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
  MOCK_EXTERNAL_SOLANA_ADDRESS,
} from '../../../test/data/bridge/mock-bridge-store';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { fetchTokensBySearchQuery } from '../../pages/bridge/utils/tokens';
import { useTokenSearchResults } from './useTokenSearchResults';

jest.mock('../../pages/bridge/utils/tokens', () => ({
  ...jest.requireActual('../../pages/bridge/utils/tokens'),
  fetchTokensBySearchQuery: jest.fn().mockResolvedValue({
    tokens: [],
    endCursor: undefined,
    hasNextPage: false,
  }),
}));

jest.mock('../../store/actions', () => ({
  getBearerToken: jest.fn().mockResolvedValue('mock-jwt'),
}));

const mockFetchTokensBySearchQuery =
  fetchTokensBySearchQuery as jest.MockedFunction<
    typeof fetchTokensBySearchQuery
  >;

describe('useTokenSearchResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    const accountGroupId = getAccountGroupsByAddress(mockStoreState, [
      MOCK_EXTERNAL_SOLANA_ADDRESS,
    ])?.[0]?.id;
    const { result } = renderHookWithProvider(
      () =>
        useTokenSearchResults({
          searchQuery: '',
          assetsToInclude: [],
          accountGroupId,
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

    const accountGroupId = getAccountGroupsByAddress(mockStoreState, [
      MOCK_EVM_ACCOUNT.address,
    ])[0].id;

    const { result } = renderHookWithProvider(
      () =>
        useTokenSearchResults({
          searchQuery: '',
          assetsToInclude: [],
          accountGroupId,
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

  it('refetches search results when chainIds change with the same search query', async () => {
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
            [CHAIN_IDS.POLYGON]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
          chainRanking: [
            { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
            { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
          ],
        },
      },
    });

    const mainnetChainId = formatChainIdToCaip(CHAIN_IDS.MAINNET);
    const polygonChainId = formatChainIdToCaip(CHAIN_IDS.POLYGON);
    let chainIds = new Set<CaipChainId>([mainnetChainId]);

    const { rerender } = renderHookWithProvider(
      () =>
        useTokenSearchResults({
          searchQuery: 'usdc',
          // No owned assets match the query so stableMinimalAssetsString stays
          // empty across network changes. chainIds must still trigger a refetch.
          assetsToInclude: [],
          chainIds,
        }),
      mockStoreState,
    );

    await waitFor(() => {
      expect(mockFetchTokensBySearchQuery).toHaveBeenCalledTimes(1);
    });
    expect(mockFetchTokensBySearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chainIds: [mainnetChainId],
        query: 'usdc',
      }),
    );

    mockFetchTokensBySearchQuery.mockClear();
    chainIds = new Set<CaipChainId>([polygonChainId]);
    rerender();

    await waitFor(() => {
      expect(mockFetchTokensBySearchQuery).toHaveBeenCalledTimes(1);
    });
    expect(mockFetchTokensBySearchQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        chainIds: [polygonChainId],
        query: 'usdc',
      }),
    );
  });
});
