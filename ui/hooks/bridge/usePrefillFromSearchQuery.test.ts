import * as bridgeControllerUtils from '@metamask/bridge-controller';
import { useLocation } from 'react-router-dom';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_SOLANA_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import * as assetUtils from '../../../shared/lib/asset-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';

import { usePrefillFromSearchQuery } from './usePrefillFromSearchQuery';

// Helper hook that combines useBridgeQueryParams with useLocation
// so we can inspect the router state from the same v6 context
const useBridgeQueryParamsWithLocation = () => {
  const location = useLocation();
  usePrefillFromSearchQuery();
  return { location };
};

const renderUseBridgeQueryParams = (mockStoreState: object, path?: string) =>
  renderHookWithProvider(
    () => useBridgeQueryParamsWithLocation(),
    mockStoreState,
    path,
  );

describe('usePrefillFromSearchQuery', () => {
  const { ChainId } = bridgeControllerUtils;

  beforeEach(() => {
    jest.clearAllMocks();
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
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            [ChainId.SOLANA]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
          },
        },
      },
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: MOCK_SOLANA_ACCOUNT.id,
        },
        balances: {
          'bf13d52c-d6e8-40ea-9726-07d7149a3ca5': {
            [bridgeControllerUtils.getNativeAssetForChainId(ChainId.SOLANA)
              .assetId]: {
              amount: '2',
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
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
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    } = store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
  });

  it('should not set params when fetchAssetMetadataForAssetIds fails', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest
      .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
      .mockRejectedValue(new Error('Failed to fetch asset metadata'));
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(
                ChainId.SOLANA,
              ),
            },
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
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
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
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
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
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
    const {
      fromToken,
      toToken,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    } = store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
      fromTokenBalance,
      fromNativeBalance,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).not.toHaveBeenCalled();
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
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect(fromTokenInputValue).toBeUndefined();
    expect({
      fromToken,
      toToken,
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
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).toHaveBeenCalledTimes(1);
  });

  describe('malformed or unknown chain/token params', () => {
    it('does not throw and skips metadata fetch when the from param is completely malformed', () => {
      // CaipAssetTypeStruct.create('not-a-caip-id') throws → parseAsset returns null
      // → the search-params effect condition (from || to || amount) is false
      // → the block is skipped entirely: no resetSearchParams, no fetch, no state update.
      const fetchSpy = jest.spyOn(assetUtils, 'fetchAssetMetadataForAssetIds');
      const mockStoreState = createBridgeMockStore({});

      const searchParams = new URLSearchParams({ from: 'not-a-caip-id' });
      const { store, result } = renderUseBridgeQueryParams(
        mockStoreState,
        // eslint-disable-next-line prefer-template
        '/?' + searchParams.toString(),
      );

      // Effect block was skipped → no fetch and URL was NOT cleared
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.current.location.search).toContain('from=not-a-caip-id');
      const { fromToken } = store?.getState().bridge ?? {};
      expect(fromToken?.chainId).not.toBe('not-a-caip-id');
    });

    it('does not throw and skips metadata fetch when the to param is completely malformed', () => {
      const fetchSpy = jest.spyOn(assetUtils, 'fetchAssetMetadataForAssetIds');
      const mockStoreState = createBridgeMockStore({});

      const searchParams = new URLSearchParams({ to: ':::invalid:::' });
      const { store, result } = renderUseBridgeQueryParams(
        mockStoreState,
        // eslint-disable-next-line prefer-template
        '/?' + searchParams.toString(),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(result.current.location.search).toContain('to=');
      const { toToken } = store?.getState().bridge ?? {};
      expect(toToken?.chainId).toBeUndefined();
    });

    it('does not throw and leaves state unchanged when both from and to are malformed', () => {
      const fetchSpy = jest.spyOn(assetUtils, 'fetchAssetMetadataForAssetIds');
      const mockStoreState = createBridgeMockStore({});

      const searchParams = new URLSearchParams({
        from: 'garbage-from',
        to: 'garbage-to',
      });
      const { store } = renderUseBridgeQueryParams(
        mockStoreState,
        // eslint-disable-next-line prefer-template
        '/?' + searchParams.toString(),
      );

      expect(fetchSpy).not.toHaveBeenCalled();
      const { fromToken, toToken } = store?.getState().bridge ?? {};
      expect(fromToken?.chainId).toBeUndefined();
      expect(toToken?.chainId).toBeUndefined();
    });

    it('does not set fromToken when metadata is not found for the from token address', async () => {
      // Valid CAIP format and supported chain, but the token address is unknown —
      // fetchAssetMetadataForAssetIds returns an empty object, so fromTokenMetadata
      // is undefined and the effect returns early before dispatching setFromToken.
      jest
        .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
        .mockResolvedValue({});

      const mockStoreState = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const searchParams = new URLSearchParams({
        from: 'eip155:1/erc20:0x0000000000000000000000000000000000000001',
      });

      const { waitForNextUpdate, store } = renderUseBridgeQueryParams(
        mockStoreState,
        // eslint-disable-next-line prefer-template
        '/?' + searchParams.toString(),
      );

      await waitForNextUpdate();

      const { fromToken } = store?.getState().bridge ?? {};
      expect(fromToken?.assetId).not.toBe(
        'eip155:1/erc20:0x0000000000000000000000000000000000000001',
      );
    });

    it('does not set toToken when metadata is not found for the to token address', async () => {
      jest
        .spyOn(assetUtils, 'fetchAssetMetadataForAssetIds')
        .mockResolvedValue({});

      const mockStoreState = createBridgeMockStore({
        metamaskStateOverrides: {
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
        },
      });

      const searchParams = new URLSearchParams({
        to: 'eip155:1/erc20:0x0000000000000000000000000000000000000001',
      });

      const { waitForNextUpdate, store } = renderUseBridgeQueryParams(
        mockStoreState,
        // eslint-disable-next-line prefer-template
        '/?' + searchParams.toString(),
      );

      await waitForNextUpdate();

      const { toToken } = store?.getState().bridge ?? {};
      expect(toToken?.assetId).not.toBe(
        'eip155:1/erc20:0x0000000000000000000000000000000000000001',
      );
    });
  });

  it('should unset amount', async () => {
    const fetchAssetMetadataForAssetIdsSpy = jest.spyOn(
      assetUtils,
      'fetchAssetMetadataForAssetIds',
    );
    const mockStoreState = createBridgeMockStore({
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            {
              chainId: bridgeControllerUtils.formatChainIdToCaip(ChainId.LINEA),
            },
          ],
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
    const { fromToken, toToken, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      fromTokenInputValue,
    }).toMatchSnapshot();
    expect(fetchAssetMetadataForAssetIdsSpy).not.toHaveBeenCalled();
  });
});
