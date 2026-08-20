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

    const { result } = renderHookWithProvider(
      () =>
        useInitialBridgeTokens(
          new Set([formatChainIdToCaip(CHAIN_IDS.MAINNET)]),
        ),
      mockStoreState,
    );

    expect(result.current.assetsToInclude).toMatchInlineSnapshot(`
      [
        {
          "accountType": undefined,
          "assetId": "eip155:1/slip44:60",
          "balance": "0.01",
          "chainId": "eip155:1",
          "decimals": 18,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png",
          "isVerified": undefined,
          "name": "Ether",
          "rwaData": undefined,
          "securityData": undefined,
          "symbol": "ETH",
          "tokenFiatAmount": 25.242128065034784,
        },
        {
          "accountType": undefined,
          "assetId": "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
          "balance": "0.0000001848",
          "chainId": "eip155:1",
          "decimals": 10,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
          "isVerified": undefined,
          "name": "Uniswap",
          "rwaData": undefined,
          "securityData": undefined,
          "symbol": "UNI",
          "tokenFiatAmount": 0.0010728914112762384,
        },
        {
          "accountType": undefined,
          "assetId": "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
          "balance": "0.000000001",
          "chainId": "eip155:1",
          "decimals": 9,
          "iconUrl": "https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x514910771af9ca656af840dff83e8264ecf986ca.png",
          "isVerified": undefined,
          "name": "Link",
          "rwaData": undefined,
          "securityData": undefined,
          "symbol": "LINK",
          "tokenFiatAmount": 0.0000030290553678041743,
        },
      ]
    `);
  });
});
