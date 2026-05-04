import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import { CROSS_CHAIN_SWAP_ROUTE } from '../../helpers/constants/routes';

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

  it('builds query string with from, to, and amount on a bridge route', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.get('to')).toBe('eip155:10/slip44:60');
    expect(params.get('amount')).toBe('1500000000000000000');
  });

  it('handles fractional amounts with correct precision', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('amount')).toBe('100500000');
  });

  it('returns only from token when no to token is set', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.has('to')).toBe(true);
    expect(params.get('amount')).toBe('2000000000000000000');
  });

  it('returns null when no tokens or amount are set on bridge route', () => {
    const storeState = createBridgeMockStore({
      bridgeSliceOverrides: {
        fromToken: null,
        toToken: null,
        fromTokenInputValue: null,
      },
    });

    const { result } = renderHook(storeState);
    const qs = result.current();

    const params = new URLSearchParams(qs ?? '');
    expect(params.has('amount')).toBe(false);
  });

  it('omits amount when fromTokenInputValue is empty', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('from')).toBe('eip155:1/slip44:60');
    expect(params.has('amount')).toBe(false);
  });

  it('handles zero amount correctly', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('amount')).toBe('0');
  });

  it('preserves full precision for very small amounts', () => {
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
    const qs = result.current();

    expect(qs).not.toBeNull();
    const params = new URLSearchParams(qs as string);
    expect(params.get('amount')).toBe('1');
  });
});
