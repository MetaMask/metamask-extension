import { renderHook } from '@testing-library/react-hooks';
import { buildBatchSellAsset } from '../../../test/data/batch-sell';
import { useSortBatchSellAssetsByBalance } from './useSortBatchSellAssetsByBalance';

const makeAsset = (symbol: string, tokenFiatAmount: number | undefined) =>
  buildBatchSellAsset({
    assetId: `eip155:1/erc20:0x${symbol}`,
    name: symbol,
    symbol,
    iconUrl: '',
    balance: '1',
    tokenFiatAmount,
  });

const ETH = makeAsset('ETH', 3000);
const USDC = makeAsset('USDC', 500);
const DAI = makeAsset('DAI', 100);
const NO_FIAT = makeAsset('UNKNOWN', undefined);

describe('useSortBatchSellAssetsByBalance', () => {
  describe('desc order', () => {
    it('sorts assets from highest to lowest fiat balance', () => {
      const { result } = renderHook(() =>
        useSortBatchSellAssetsByBalance([DAI, ETH, USDC], 'desc'),
      );

      expect(result.current.map((a) => a.symbol)).toStrictEqual([
        'ETH',
        'USDC',
        'DAI',
      ]);
    });

    it('treats undefined tokenFiatAmount as 0', () => {
      const { result } = renderHook(() =>
        useSortBatchSellAssetsByBalance([NO_FIAT, DAI], 'desc'),
      );

      expect(result.current.map((a) => a.symbol)).toStrictEqual([
        'DAI',
        'UNKNOWN',
      ]);
    });
  });

  describe('asc order', () => {
    it('sorts assets from lowest to highest fiat balance', () => {
      const { result } = renderHook(() =>
        useSortBatchSellAssetsByBalance([ETH, DAI, USDC], 'asc'),
      );

      expect(result.current.map((a) => a.symbol)).toStrictEqual([
        'DAI',
        'USDC',
        'ETH',
      ]);
    });

    it('treats undefined tokenFiatAmount as 0', () => {
      const { result } = renderHook(() =>
        useSortBatchSellAssetsByBalance([DAI, NO_FIAT], 'asc'),
      );

      expect(result.current.map((a) => a.symbol)).toStrictEqual([
        'UNKNOWN',
        'DAI',
      ]);
    });
  });

  it('returns an empty array when given an empty array', () => {
    const { result } = renderHook(() =>
      useSortBatchSellAssetsByBalance([], 'desc'),
    );

    expect(result.current).toStrictEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    const { result } = renderHook(() =>
      useSortBatchSellAssetsByBalance([ETH], 'desc'),
    );

    expect(result.current).toStrictEqual([ETH]);
  });

  it('does not mutate the original array', () => {
    const input = [DAI, ETH, USDC];
    const originalOrder = input.map((a) => a.symbol);

    renderHook(() => useSortBatchSellAssetsByBalance(input, 'desc'));

    expect(input.map((a) => a.symbol)).toStrictEqual(originalOrder);
  });

  it('recomputes when order changes', () => {
    let order: 'asc' | 'desc' = 'desc';
    const { result, rerender } = renderHook(() =>
      useSortBatchSellAssetsByBalance([DAI, ETH, USDC], order),
    );

    const descResult = [...result.current.map((a) => a.symbol)];

    order = 'asc';
    rerender();

    const ascResult = result.current.map((a) => a.symbol);
    expect(ascResult).toStrictEqual([...descResult].reverse());
  });

  it('recomputes when assets change', () => {
    let assets = [ETH, USDC];
    const { result, rerender } = renderHook(() =>
      useSortBatchSellAssetsByBalance(assets, 'desc'),
    );

    expect(result.current.map((a) => a.symbol)).toStrictEqual(['ETH', 'USDC']);

    assets = [DAI, ETH, USDC];
    rerender();

    expect(result.current.map((a) => a.symbol)).toStrictEqual([
      'ETH',
      'USDC',
      'DAI',
    ]);
  });
});
