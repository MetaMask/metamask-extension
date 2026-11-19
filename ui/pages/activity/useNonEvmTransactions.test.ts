import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { useNonEvmTransactions } from './useNonEvmTransactions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const solanaReceive = {
  type: 'receive',
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  status: 'success',
  timestamp: 1,
  hash: '0xABC',
  data: { from: '0x1', to: '0x2' },
} as unknown as ActivityListItem;

const otherReceive = {
  type: 'receive',
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  status: 'success',
  timestamp: 2,
  hash: '0xdef',
  data: { from: '0x1', to: '0x2' },
} as unknown as ActivityListItem;

describe('useNonEvmTransactions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('omits non-EVM items whose hash matches a ramp settlement hash', () => {
    jest
      .mocked(useSelector)
      .mockReturnValueOnce([solanaReceive, otherReceive])
      .mockReturnValueOnce(new Set(['0xabc']));

    const { result } = renderHook(() =>
      useNonEvmTransactions({
        networks: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      }),
    );

    expect(result.current).toStrictEqual([otherReceive]);
  });

  it('keeps non-EVM items when there are no ramp settlement hashes', () => {
    jest
      .mocked(useSelector)
      .mockReturnValueOnce([solanaReceive, otherReceive])
      .mockReturnValueOnce(new Set());

    const { result } = renderHook(() =>
      useNonEvmTransactions({
        networks: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
      }),
    );

    expect(result.current).toStrictEqual([solanaReceive, otherReceive]);
  });
});
