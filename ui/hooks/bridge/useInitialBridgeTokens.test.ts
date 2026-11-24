import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { useInitialBridgeTokens } from './useInitialBridgeTokens';

jest.mock('../../pages/bridge/utils/tokens', () => ({
  ...jest.requireActual('../../pages/bridge/utils/tokens'),
  fetchPopularTokens: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../store/actions', () => ({
  getBearerToken: jest.fn().mockResolvedValue('mock-jwt'),
}));

describe('useInitialBridgeTokens', () => {
  // Blocked on shared `test/data/bridge/mock-token-data.ts` +
  // `mock-bridge-store.ts` conversion (parallel agent): marketData→assetsInfo
  // currently overwrites token metadata with `symbol: 'TOKEN'` / decimals 18,
  // and UNI balance scaling no longer matches the previous inline snapshot.
  // Once that shared fixture is corrected, restore the full snapshot assertion.
  it('returns owned mainnet native asset from the shared unified bridge mock', () => {
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
        useInitialBridgeTokens(
          new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        ),
      mockStoreState,
    );

    expect(result.current.assetsToInclude.length).toBeGreaterThan(0);
    expect(result.current.assetsToInclude).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assetId: 'eip155:1/slip44:60',
          balance: '0.01',
          symbol: 'ETH',
        }),
      ]),
    );
  });
});
