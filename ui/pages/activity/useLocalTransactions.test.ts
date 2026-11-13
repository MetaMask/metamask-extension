import { renderHook } from '@testing-library/react';
import {
  selectLocalActivityItems,
  selectLocalTransactionsByHash,
} from '#ui/selectors/activity';
import { selectRampsSettlementHashes } from '#ui/selectors/rampsController';
import type { ActivityListItem } from '#shared/lib/activity/types';
import { useLocalTransactions } from './useLocalTransactions';

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));
jest.mock('#ui/selectors/activity', () => ({
  selectLocalActivityItems: jest.fn(),
  selectLocalTransactionsByHash: jest.fn(),
}));
jest.mock('#ui/selectors/rampsController', () => ({
  selectRampsSettlementHashes: jest.fn(),
}));

jest.mock('../../hooks/useEarliestNonceByChain', () => ({
  isTransactionEarliestNonce: () => false,
  useEarliestNonceByChain: () => ({}),
}));

const localSend = {
  type: 'send',
  chainId: 'eip155:1',
  status: 'success',
  timestamp: 1,
  hash: '0xABC',
  data: { from: '0x1', to: '0x2' },
} as ActivityListItem;

const otherSend = {
  type: 'send',
  chainId: 'eip155:1',
  status: 'success',
  timestamp: 2,
  hash: '0xdef',
  data: { from: '0x1', to: '0x2' },
} as ActivityListItem;

describe('useLocalTransactions', () => {
  beforeEach(() => {
    jest
      .mocked(selectLocalActivityItems)
      .mockReturnValue([localSend, otherSend]);
    jest.mocked(selectLocalTransactionsByHash).mockReturnValue(new Map());
    jest.mocked(selectRampsSettlementHashes).mockReturnValue(new Set());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('omits local items whose hash matches a ramp settlement hash', () => {
    jest
      .mocked(selectRampsSettlementHashes)
      .mockReturnValue(new Set(['0xabc']));

    const { result } = renderHook(() =>
      useLocalTransactions({ networks: ['eip155:1'] }),
    );

    expect(result.current).toStrictEqual([otherSend]);
  });

  it('returns items newest-first when the selector returns them oldest-first', () => {
    const { result } = renderHook(() =>
      useLocalTransactions({ networks: ['eip155:1'] }),
    );

    expect(result.current).toStrictEqual([otherSend, localSend]);
  });
});
