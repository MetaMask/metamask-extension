import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import { CROSS_CHAIN_SWAP_ROUTE } from '../../helpers/constants/routes';
import * as bridgeSelectors from '../../ducks/bridge/selectors';

import { useBridgeRedirectQueryString } from './useBridgeRedirectQueryString';

const renderHook = (
  storeState: object,
  pathname = `${CROSS_CHAIN_SWAP_ROUTE}/swaps/prepare-bridge-page`,
) =>
  renderHookWithProvider(
    () => useBridgeRedirectQueryString(),
    storeState,
    pathname,
  );

describe('useBridgeRedirectQueryString', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when not on a bridge route', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '1.5',
      },
    });

    const { result } = renderHook(storeState, '/send');

    expect(typeof result.current).toBe('function');
    expect(result.current()).toBeNull();
  });

  it('encodes from token, to token, and amount as deep-link query params', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        toToken: {
          assetId: 'eip155:10/slip44:60',
          chainId: 'eip155:10',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '1.5',
      },
      metamaskStateOverrides: {
        ...mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.OPTIMISM },
        ),
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.get('to')).toBe('eip155:10/slip44:60');
    expect(params.get('amount')).toBe('1500000000000000000');
  });

  it('converts fractional display amount to base units using token decimals', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: 'eip155:1',
          decimals: 6,
          symbol: 'USDC',
        },
        toToken: {
          assetId: 'eip155:10/erc20:0x7f5c764cbc14f9669b88837ca1490cca17c31607',
          chainId: 'eip155:10',
          decimals: 6,
          symbol: 'USDC',
        },
        fromTokenInputValue: '100.5',
      },
      metamaskStateOverrides: {
        ...mockNetworkState(
          { chainId: CHAIN_IDS.MAINNET },
          { chainId: CHAIN_IDS.OPTIMISM },
        ),
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    // 100.5 USDC * 10^6 = 100500000 base units
    expect(params.get('amount')).toBe('100500000');
  });

  it('includes default to token when toToken is null (selector provides fallback)', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        toToken: null,
        fromTokenInputValue: '2',
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    // getToToken selector returns a default destination token even when toToken is null
    expect(params.has('to')).toBe(true);
    expect(params.get('amount')).toBe('2000000000000000000');
  });

  it('omits amount param when no tokens or amount are set', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: null,
        toToken: null,
        fromTokenInputValue: null,
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    const params = new URLSearchParams(queryString ?? '');
    expect(params.has('amount')).toBe(false);
  });

  it('omits amount param when fromTokenInputValue is null', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: null,
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.has('amount')).toBe(false);
  });

  it('converts zero display amount to zero base units', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '0',
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    expect(params.get('amount')).toBe('0');
  });

  it('converts smallest representable amount (1 wei) without precision loss', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '0.000000000000000001',
      },
    });

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).not.toBeNull();
    const params = new URLSearchParams(queryString as string);
    // 0.000000000000000001 ETH * 10^18 = 1 wei
    expect(params.get('amount')).toBe('1');
  });

  it('omits from param when fromToken has no assetId', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '1',
      },
    });

    jest
      .spyOn(bridgeSelectors, 'getFromToken')
      .mockReturnValue({ chainId: 'eip155:1', decimals: 18 } as never);

    const { result } = renderHook(storeState);
    const queryString = result.current();

    const params = new URLSearchParams(queryString ?? '');
    expect(params.has('from')).toBe(false);

    jest.restoreAllMocks();
  });

  it('omits to param when toToken has no assetId', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: {
          assetId: 'eip155:1/slip44:60',
          chainId: 'eip155:1',
          decimals: 18,
          symbol: 'ETH',
        },
        fromTokenInputValue: '1',
      },
    });

    jest
      .spyOn(bridgeSelectors, 'getToToken')
      .mockReturnValue({ chainId: 'eip155:10' } as never);

    const { result } = renderHook(storeState);
    const queryString = result.current();

    const params = new URLSearchParams(queryString as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.has('to')).toBe(false);

    jest.restoreAllMocks();
  });

  it('returns null on bridge route when all params are empty', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromTokenInputValue: null,
      },
    });

    jest.spyOn(bridgeSelectors, 'getFromToken').mockReturnValue({} as never);
    jest.spyOn(bridgeSelectors, 'getToToken').mockReturnValue({} as never);

    const { result } = renderHook(storeState);
    const queryString = result.current();

    expect(queryString).toBeNull();

    jest.restoreAllMocks();
  });
});
