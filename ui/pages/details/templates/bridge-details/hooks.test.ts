import { renderHook } from '@testing-library/react-hooks';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { selectBridgeHistoryItemByHash } from '../../../../ducks/bridge-status/selectors';
import { getBridgeHistoryTokens } from './utils';
import { useBridgeHistoryItem, useHistoryTokens } from './hooks';

jest.mock('react-redux', () => ({
  // The selector is mocked, so the state passed to it is irrelevant here.
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../ducks/bridge-status/selectors', () => ({
  selectBridgeHistoryItemByHash: jest.fn(),
}));

jest.mock('./utils', () => ({
  getBridgeHistoryTokens: jest.fn(),
}));

const mockSelectBridgeHistoryItemByHash =
  selectBridgeHistoryItemByHash as unknown as jest.Mock;
const mockGetBridgeHistoryTokens =
  getBridgeHistoryTokens as unknown as jest.Mock;

const historyItem = { account: '0xabc' } as unknown as BridgeHistoryItem;

describe('useBridgeHistoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the bridge history item for the given source tx hash', () => {
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

  it('maps the resolved history item to tokens', () => {
    const tokens = {
      sourceToken: { symbol: 'ETH' },
      destinationToken: { symbol: 'DAI' },
    };
    mockSelectBridgeHistoryItemByHash.mockReturnValue(historyItem);
    mockGetBridgeHistoryTokens.mockReturnValue(tokens);

    const { result } = renderHook(() => useHistoryTokens('0xhash'));

    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledWith(historyItem);
    expect(result.current).toBe(tokens);
  });

  it('returns undefined when there is no history item', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(undefined);
    mockGetBridgeHistoryTokens.mockReturnValue(undefined);

    const { result } = renderHook(() => useHistoryTokens('0xhash'));

    expect(result.current).toBeUndefined();
  });

  it('memoizes the result while the history item is unchanged', () => {
    mockSelectBridgeHistoryItemByHash.mockReturnValue(historyItem);
    mockGetBridgeHistoryTokens.mockReturnValue({ sourceToken: {} });

    const { result, rerender } = renderHook(() => useHistoryTokens('0xhash'));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledTimes(1);
  });

  it('recomputes when the history item changes', () => {
    const nextHistoryItem = {
      account: '0xdef',
    } as unknown as BridgeHistoryItem;
    const firstTokens = { sourceToken: { symbol: 'ETH' } };
    const secondTokens = { sourceToken: { symbol: 'MATIC' } };

    mockSelectBridgeHistoryItemByHash
      .mockReturnValueOnce(historyItem)
      .mockReturnValueOnce(nextHistoryItem);
    mockGetBridgeHistoryTokens
      .mockReturnValueOnce(firstTokens)
      .mockReturnValueOnce(secondTokens);

    const { result, rerender } = renderHook(() => useHistoryTokens('0xhash'));
    expect(result.current).toBe(firstTokens);

    rerender();

    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(secondTokens);
  });
});
