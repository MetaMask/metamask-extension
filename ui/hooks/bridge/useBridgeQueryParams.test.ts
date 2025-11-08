import * as bridgeControllerUtils from '@metamask/bridge-controller';
import { BigNumber } from 'ethers';
import { useLocation } from 'react-router-dom-v5-compat';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import * as assetUtils from '../../../shared/lib/asset-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';

import { useBridgeQueryParams } from './useBridgeQueryParams';

// Helper hook that combines useBridgeQueryParams with useLocation
// so we can inspect the router state from the same v5-compat context
const useBridgeQueryParamsWithLocation = () => {
  const location = useLocation();
  useBridgeQueryParams();
  return { location };
};

const renderUseBridgeQueryParams = (mockStoreState: object, path?: string) =>
  renderHookWithProvider(
    () => useBridgeQueryParamsWithLocation(),
    mockStoreState,
    path,
  );

let calcLatestSrcBalanceSpy: jest.SpyInstance;

describe('useBridgeQueryParams', () => {
  const { ChainId } = bridgeControllerUtils;

  beforeEach(() => {
    jest.clearAllMocks();
    calcLatestSrcBalanceSpy = jest
      .spyOn(bridgeControllerUtils, 'calcLatestSrcBalance')
      .mockResolvedValue(BigNumber.from('1000000'));
  });

  it('should set solana swap params', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
          {
            symbol: 'USDC',
            decimals: 9,
            name: 'Solana',
            assetId:
              'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          symbol: 'SOL',
          decimals: 9,
          name: 'Solana',
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.SOLANA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
    });

    const searchParams = new URLSearchParams({
      from: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      to: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      amount: '100',
      swaps: 'true',
    });
    const renderResult = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    const { waitForNextUpdate, store, result } = renderResult;

    await waitForNextUpdate();
    expect(result.current.location.search).toBe('?swaps=true');
    expect(result.current.location.pathname).toBe('/');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
  });

  it('should set evm bridge params', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
          symbol: 'USDC',
          decimals: 6,
          name: 'USDC',
          assetId:
            'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        },
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501': {
          symbol: 'SOL',
          decimals: 9,
          name: 'Solana',
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.SOLANA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    const searchParams = new URLSearchParams({
      from: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
      to: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      amount: '100',
      swaps: 'true',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('?swaps=true');
    expect(store).toBeDefined();
    const {
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    } = store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
    expect(calcLatestSrcBalanceSpy.mock.calls).toMatchSnapshot();
  });

  it('should not set params when fetchAssetMetadataForAssetIds fails', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockRejectedValue(new Error('Failed to fetch asset metadata'));
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.SOLANA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
    });

    const searchParams = new URLSearchParams({
      from: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
      to: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      amount: '100',
      swaps: 'true',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('?swaps=true');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
  });

  it('should set src token after navigating from ERC20 asset page', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
          symbol: 'USDC',
          decimals: 6,
          name: 'USDC',
          assetId:
            'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    const searchParams = new URLSearchParams({
      from: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
    expect(calcLatestSrcBalanceSpy).toHaveBeenCalledTimes(2);
  });

  it('should set src token after navigating from native asset page', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'eip155:59144/slip44:60': {
          symbol: 'ETH',
          decimals: 18,
          name: 'Ethereum',
          assetId: 'eip155:59144/slip44:60',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    const searchParams = new URLSearchParams({
      from: 'eip155:59144/slip44:60',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
    expect(calcLatestSrcBalanceSpy.mock.calls).toMatchSnapshot();
  });

  it('should not set inputs when there are no query params', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest.spyOn(
      assetUtils,
      'fetchAssetMetadataForAssetIds',
    );

    const mockStoreState = createBridgeMockStore();

    const { result, store } = renderUseBridgeQueryParams(mockStoreState);

    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).not.toHaveBeenCalled();
    expect(calcLatestSrcBalanceSpy.mock.calls).toMatchSnapshot();
  });

  it('should only set dest token', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
          symbol: 'USDC',
          decimals: 6,
          name: 'USDC',
          assetId:
            'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    const searchParams = new URLSearchParams({
      amount: '100',
      to: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect(fromTokenInputValue).toBeUndefined();
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
  });

  it('should only set src token and amount', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockResolvedValue({
        'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
          symbol: 'USDC',
          decimals: 6,
          name: 'USDC',
          assetId:
            'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        },
      });
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      },
    });

    const searchParams = new URLSearchParams({
      amount: '100',
      from: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
    });

    const { result, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
    expect(calcLatestSrcBalanceSpy.mock.calls).toMatchSnapshot();
  });

  it('should unset amount', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest.spyOn(
      assetUtils,
      'fetchAssetMetadataForAssetIds',
    );
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chains: {
            [ChainId.LINEA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
    });

    const searchParams = new URLSearchParams({
      amount: '100',
    });

    const { result, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );
    expect(result.current.location.search).toBe('');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).not.toHaveBeenCalled();
  });
});
