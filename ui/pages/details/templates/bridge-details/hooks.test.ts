import { renderHook } from '@testing-library/react-hooks';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { selectBridgeHistoryItemByHash } from '../../../../ducks/bridge-status/selectors';
import { useBridgeHistoryItem, useHistoryTokens } from './hooks';

jest.mock('react-redux', () => ({
  // The selector is mocked, so the state passed to it is irrelevant here.
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../ducks/bridge-status/selectors', () => ({
  selectBridgeHistoryItemByHash: jest.fn(),
}));

const mockSelectBridgeHistoryItemByHash =
  selectBridgeHistoryItemByHash as unknown as jest.Mock;

const buildHistoryItem = (
  overrides: Partial<BridgeHistoryItem> = {},
): BridgeHistoryItem =>
  ({
    account: '0xabc',
    quote: {
      srcTokenAmount: '1000',
      srcAsset: {
        assetId: 'eip155:1/slip44:60',
        decimals: 18,
        symbol: 'ETH',
      },
      destTokenAmount: '2000',
      destAsset: {
        assetId: 'eip155:137/erc20:0xdai',
        decimals: 18,
        symbol: 'DAI',
      },
    },
    status: { destChain: { amount: '2100' } },
    ...overrides,
  }) as unknown as BridgeHistoryItem;

describe('useBridgeHistoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the bridge history item for the given source tx hash', () => {
    const historyItem = buildHistoryItem();
    mockSelectBridgeHistoryItemByHash.mockReturnValue(historyItem);

    const { result } = renderHook(() => useBridgeHistoryItem('0xhash'));

    expect(mockSelectBridgeHistoryItemByHash).toHaveBeenCalledWith(
      {},
      '0xhash',
    );
    expect(result.current).toBe(historyItem);
  });

  it('returns undefined and does not query when no source tx hash is provided', () => {
    const { result } = renderHook(() => useBridgeHistoryItem());

    expect(result.current).toBeUndefined();
    expect(mockSelectBridgeHistoryItemByHash).not.toHaveBeenCalled();
  });
});

describe('useHistoryTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the history item to source and destination tokens', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(buildHistoryItem());

    const { result } = renderHook(() => useHistoryTokens('0xhash'));

    expect(result.current?.sourceToken).toStrictEqual({
      amount: '1000',
      assetId: 'eip155:1/slip44:60',
      decimals: 18,
      direction: 'out',
      symbol: 'ETH',
    });
    expect(result.current?.destinationToken).toStrictEqual({
      amount: '2100',
      assetId: 'eip155:137/erc20:0xdai',
      decimals: 18,
      direction: 'in',
      symbol: 'DAI',
    });
  });

  it('falls back to the quote destination amount when the destination chain amount is missing', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(
      buildHistoryItem({ status: {} } as Partial<BridgeHistoryItem>),
    );

    const { result } = renderHook(() => useHistoryTokens('0xhash'));

    expect(result.current?.destinationToken.amount).toBe('2000');
  });

  it('returns undefined when there is no history item', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(undefined);

    const { result } = renderHook(() => useHistoryTokens('0xhash'));

    expect(result.current).toBeUndefined();
  });

  it('memoizes the result while the history item is unchanged', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(buildHistoryItem());

    const { result, rerender } = renderHook(() => useHistoryTokens('0xhash'));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it('recomputes when the history item changes', () => {
    mockSelectBridgeHistoryItemByHash
      .mockReturnValueOnce(buildHistoryItem())
      .mockReturnValueOnce(
        buildHistoryItem({
          quote: {
            srcTokenAmount: '5',
            srcAsset: { assetId: 'eip155:1/slip44:60', decimals: 18, symbol: 'ETH' },
            destTokenAmount: '9',
            destAsset: {
              assetId: 'eip155:10/erc20:0xusdc',
              decimals: 6,
              symbol: 'USDC',
            },
          },
        } as unknown as Partial<BridgeHistoryItem>),
      );

    const { result, rerender } = renderHook(() => useHistoryTokens('0xhash'));
    const firstResult = result.current;

    rerender();

    expect(result.current).not.toBe(firstResult);
    expect(result.current?.destinationToken.symbol).toBe('USDC');
  });
});
