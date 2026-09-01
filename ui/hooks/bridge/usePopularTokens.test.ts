import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { usePopularTokens } from './usePopularTokens';

const mockFetchPopularTokens = jest.fn().mockResolvedValue([]);

describe('usePopularTokens', () => {
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

    const { result } = renderHookWithProvider(
      () =>
        usePopularTokens({
          fetchTokens: mockFetchPopularTokens,
          assetsToInclude: [],
          accountGroupId: undefined,
        }),
      mockStoreState,
    );

    expect(result.current.popularTokensList).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(mockFetchPopularTokens).toHaveBeenCalledTimes(1);
  });

  it('returns owned assets when accountAddress belongs to a known account group', () => {
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
        usePopularTokens({
          fetchTokens: mockFetchPopularTokens,
          assetsToInclude: [],
          accountGroupId,
        }),
      mockStoreState,
    );

    // The hook resolves the account group and calls getBridgeAssetsByAssetId
    // (truthy branch of: accountGroup ? getBridgeAssetsByAssetId(...) : {})
    // popularTokensList falls back to assetsToInclude while token list loads
    expect(result.current.popularTokensList).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(mockFetchPopularTokens).toHaveBeenCalledTimes(1);
  });
});
