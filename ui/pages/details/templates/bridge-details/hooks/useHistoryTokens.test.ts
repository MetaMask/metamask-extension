import { renderHook } from '@testing-library/react-hooks';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { TokenAmount } from '../../../../../../shared/lib/activity/types';
import { getBridgeHistoryTokens } from '../utils/getBridgeHistoryTokens';
import { useBridgeHistoryItem } from './useBridgeHistoryItem';
import { useHistoryTokens } from './useHistoryTokens';

jest.mock('./useBridgeHistoryItem', () => ({
  useBridgeHistoryItem: jest.fn(),
}));

jest.mock('../utils/getBridgeHistoryTokens', () => ({
  getBridgeHistoryTokens: jest.fn(),
}));

const mockUseBridgeHistoryItem = useBridgeHistoryItem as unknown as jest.Mock;
const mockGetBridgeHistoryTokens =
  getBridgeHistoryTokens as unknown as jest.Mock;

const tokens = {
  sourceToken: { symbol: 'ETH', direction: 'out' } as TokenAmount,
  destinationToken: { symbol: 'DAI', direction: 'in' } as TokenAmount,
};

describe('useHistoryTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the resolved bridge history item to tokens', () => {
    const historyItem = { account: '0xfrom' } as unknown as BridgeHistoryItem;
    mockUseBridgeHistoryItem.mockReturnValue(historyItem);
    mockGetBridgeHistoryTokens.mockReturnValue(tokens);

    const { result } = renderHook(() => useHistoryTokens('0xsourcehash'));

    expect(mockUseBridgeHistoryItem).toHaveBeenCalledWith('0xsourcehash');
    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledWith(historyItem);
    expect(result.current).toBe(tokens);
  });

  it('returns undefined when there is no bridge history item', () => {
    mockUseBridgeHistoryItem.mockReturnValue(undefined);
    mockGetBridgeHistoryTokens.mockReturnValue(undefined);

    const { result } = renderHook(() => useHistoryTokens(undefined));

    expect(result.current).toBeUndefined();
  });

  it('memoizes the result while the bridge history item is unchanged', () => {
    const historyItem = { account: '0xfrom' } as unknown as BridgeHistoryItem;
    mockUseBridgeHistoryItem.mockReturnValue(historyItem);
    mockGetBridgeHistoryTokens.mockReturnValue(tokens);

    const { result, rerender } = renderHook(() =>
      useHistoryTokens('0xsourcehash'),
    );
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledTimes(1);
  });

  it('recomputes when the bridge history item changes', () => {
    const firstItem = { account: '0xfrom' } as unknown as BridgeHistoryItem;
    const secondItem = { account: '0xother' } as unknown as BridgeHistoryItem;
    mockUseBridgeHistoryItem.mockReturnValue(firstItem);
    mockGetBridgeHistoryTokens.mockReturnValue(tokens);

    const { rerender } = renderHook(() => useHistoryTokens('0xsourcehash'));

    mockUseBridgeHistoryItem.mockReturnValue(secondItem);
    rerender();

    expect(mockGetBridgeHistoryTokens).toHaveBeenCalledTimes(2);
    expect(mockGetBridgeHistoryTokens).toHaveBeenLastCalledWith(secondItem);
  });
});
