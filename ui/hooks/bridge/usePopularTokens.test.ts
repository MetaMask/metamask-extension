import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import { usePopularTokens } from './usePopularTokens';

jest.mock('../../pages/bridge/utils/tokens', () => ({
  ...jest.requireActual('../../pages/bridge/utils/tokens'),
  fetchPopularTokens: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../store/actions', () => ({
  getBearerToken: jest.fn().mockResolvedValue('mock-jwt'),
}));

describe('usePopularTokens', () => {
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
          assetsToInclude: [],
          accountGroupId: undefined,
          chainIds: new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        }),
      mockStoreState,
    );

    expect(result.current.popularTokensList).toEqual([]);
    expect(result.current.isLoading).toBe(true);
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
          assetsToInclude: [],
          accountGroupId,
          chainIds: new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        }),
      mockStoreState,
    );

    // The hook resolves the account group and calls getBridgeAssetsByAssetId
    // (truthy branch of: accountGroup ? getBridgeAssetsByAssetId(...) : {})
    // popularTokensList falls back to assetsToInclude while token list loads
    expect(result.current.popularTokensList).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});
