import { renderHook } from '@testing-library/react-hooks';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { selectBridgeHistoryItemByHash } from '../../../../../ducks/bridge-status/selectors';
import { useBridgeHistoryItem } from './useBridgeHistoryItem';

const mockState = { metamask: {} };

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

jest.mock('../../../../../ducks/bridge-status/selectors', () => ({
  selectBridgeHistoryItemByHash: jest.fn(),
}));

const mockSelectBridgeHistoryItemByHash =
  selectBridgeHistoryItemByHash as unknown as jest.Mock;

describe('useBridgeHistoryItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the bridge history item for the given source tx hash', () => {
    const historyItem = { account: '0xfrom' } as unknown as BridgeHistoryItem;
    mockSelectBridgeHistoryItemByHash.mockReturnValue(historyItem);

    const { result } = renderHook(() => useBridgeHistoryItem('0xsourcehash'));

    expect(mockSelectBridgeHistoryItemByHash).toHaveBeenCalledWith(
      mockState,
      '0xsourcehash',
    );
    expect(result.current).toBe(historyItem);
  });

  it('returns undefined without querying when no source tx hash is provided', () => {
    const { result } = renderHook(() => useBridgeHistoryItem(undefined));

    expect(result.current).toBeUndefined();
    expect(mockSelectBridgeHistoryItemByHash).not.toHaveBeenCalled();
  });
});
