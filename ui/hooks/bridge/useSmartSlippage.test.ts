import {
  ChainId,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { useSmartSlippage } from './useSmartSlippage';

const renderUseSmartSlippage = (mockStoreState: object) =>
  renderHookWithProvider(() => useSmartSlippage(), mockStoreState);

describe('useSmartSlippage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches EVM default slippage (2%) for a standard EVM swap', () => {
    const state = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: toBridgeToken(getNativeAssetForChainId(ChainId.ETH)),
        toToken: toBridgeToken(
          getNativeAssetForChainId(formatChainIdToCaip(ChainId.ETH)),
        ),
      },
    });

    const { store } = renderUseSmartSlippage(state);
    expect(store?.getState().bridge.slippage).toBe(2);
  });

  it('dispatches undefined (AUTO) for a Solana-to-Solana swap', () => {
    const state = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [{ chainId: MultichainNetworks.SOLANA }],
        },
      },
      bridgeSliceOverrides: {
        fromToken: toBridgeToken(
          getNativeAssetForChainId(MultichainNetworks.SOLANA),
        ),
        toToken: toBridgeToken({
          decimals: 6,
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          name: 'USD Coin',
        }),
      },
    });

    const { store } = renderUseSmartSlippage(state);
    expect(store?.getState().bridge.slippage).toBeUndefined();
  });

  it('dispatches undefined (AUTO) for an RWA token swap when the feature flag is enabled', () => {
    const rwaToken = toBridgeToken({
      decimals: 18,
      assetId: 'eip155:1/erc20:0xstock',
      symbol: 'AAPL',
      name: 'Apple',
      rwaData: {
        instrumentType: 'stock',
        market: {
          nextOpen: new Date(Date.now() + 100_000).toISOString(),
          nextClose: new Date(Date.now() + 200_000).toISOString(),
        },
      },
    });

    const state = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {},
        rwaTokensEnabled: true,
      } as never,
      bridgeSliceOverrides: {
        fromToken: rwaToken,
        toToken: toBridgeToken(getNativeAssetForChainId(ChainId.ETH)),
      },
    });

    const { store } = renderUseSmartSlippage(state);
    expect(store?.getState().bridge.slippage).toBeUndefined();
  });

  it('dispatches EVM default slippage (2%) for an RWA token swap when the feature flag is disabled', () => {
    const rwaToken = toBridgeToken({
      decimals: 18,
      assetId: 'eip155:1/erc20:0xstock',
      symbol: 'AAPL',
      name: 'Apple',
      rwaData: {
        instrumentType: 'stock',
        market: {
          nextOpen: new Date(Date.now() + 100_000).toISOString(),
          nextClose: new Date(Date.now() + 200_000).toISOString(),
        },
      },
    });

    const state = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {},
        rwaTokensEnabled: false,
      } as never,
      bridgeSliceOverrides: {
        fromToken: rwaToken,
        toToken: toBridgeToken(getNativeAssetForChainId(ChainId.ETH)),
      },
    });

    const { store } = renderUseSmartSlippage(state);
    expect(store?.getState().bridge.slippage).toBe(2);
  });

  it('dispatches bridge default slippage (2%) for a cross-chain RWA swap even when the feature flag is enabled', () => {
    const rwaTokenMainnet = toBridgeToken({
      decimals: 18,
      assetId: 'eip155:1/erc20:0xstock',
      symbol: 'AAPL',
      name: 'Apple',
      rwaData: {
        instrumentType: 'stock',
        market: {
          nextOpen: new Date(Date.now() + 100_000).toISOString(),
          nextClose: new Date(Date.now() + 200_000).toISOString(),
        },
      },
    });
    const rwaTokenBsc = toBridgeToken({
      decimals: 18,
      assetId: 'eip155:56/erc20:0xstock',
      symbol: 'AAPL',
      name: 'Apple',
      rwaData: {
        instrumentType: 'stock',
        market: {
          nextOpen: new Date(Date.now() + 100_000).toISOString(),
          nextClose: new Date(Date.now() + 200_000).toISOString(),
        },
      },
    });

    const state = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {},
        rwaTokensEnabled: true,
      } as never,
      bridgeSliceOverrides: {
        fromToken: rwaTokenMainnet,
        toToken: rwaTokenBsc,
      },
    });

    const { store } = renderUseSmartSlippage(state);
    expect(store?.getState().bridge.slippage).toBe(2);
  });
});
