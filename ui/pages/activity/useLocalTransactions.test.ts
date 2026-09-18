import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { useLocalTransactions } from './useLocalTransactions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('omits local items whose hash matches a ramp settlement hash', () => {
    // selectLocalActivityItems, selectLocalTransactionsByHash, selectRampsSettlementHashes
    jest
      .mocked(useSelector)
      .mockReturnValueOnce([localSend, otherSend])
      .mockReturnValueOnce(new Map())
      .mockReturnValueOnce(new Set(['0xabc']));

    const { result } = renderHook(() =>
      useLocalTransactions({ networks: ['eip155:1'] }),
    );

    expect(result.current).toStrictEqual([otherSend]);
  });
});
