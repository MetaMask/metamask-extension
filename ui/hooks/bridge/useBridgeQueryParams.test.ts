import { ChainId } from '@metamask/bridge-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import * as assetUtils from '../../../shared/lib/asset-utils';
import { useBridgeQueryParams } from './useBridgeQueryParams';

const renderUseBridgeQueryParams = (mockStoreState: object, path: string) =>
  renderHookWithProvider(() => useBridgeQueryParams(), mockStoreState, path);

describe('useBridgeQueryParams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TODO nav from native asset page
  // TODO nav from erc20
  // TODO partial params
  // TODO fetch metadata throws error

  it('should set solana swap params', async () => {
    jest.spyOn(assetUtils, 'fetchAssetMetadataForAssetIds').mockResolvedValue({
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

    const { history, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(history.location.search).toBe('swaps=true');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    // TODO is valid params or getquote called
    // TODO fetch metadata is only called once
  });

  it('should set evm bridge params', async () => {
    jest.spyOn(assetUtils, 'fetchAssetMetadataForAssetIds').mockResolvedValue({
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
    });

    const searchParams = new URLSearchParams({
      from: 'eip155:59144/erc20:0x8ac76a51cc950d9822d68b83fe1ad97b32cd580D',
      to: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      amount: '100',
      swaps: 'true',
    });

    const { history, waitForNextUpdate, store } = renderUseBridgeQueryParams(
      mockStoreState,
      // eslint-disable-next-line prefer-template
      '/?' + searchParams.toString(),
    );

    await waitForNextUpdate();

    expect(history.location.search).toBe('swaps=true');
    expect(store).toBeDefined();
    const { fromToken, toToken, toChainId, fromTokenInputValue } =
      store?.getState().bridge ?? {};
    expect({
      fromToken,
      toToken,
      toChainId,
      fromTokenInputValue,
    }).toMatchSnapshot();
    // TODO is valid params or getquote called
    // TODO fetch metadata is only called once
  });
});
