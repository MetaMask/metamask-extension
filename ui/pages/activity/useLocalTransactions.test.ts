import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import {
  selectLocalActivityItems,
  selectLocalTransactionsByHash,
} from '../../selectors/activity';
import { useLocalTransactions } from './useLocalTransactions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../hooks/useEarliestNonceByChain', () => ({
  useEarliestNonceByChain: () => new Map(),
  isTransactionEarliestNonce: () => false,
}));

jest.mock('../../selectors/activity', () => ({
  selectLocalActivityItems: jest.fn(),
  selectLocalTransactionsByHash: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

function sendItem(
  overrides: Partial<ActivityListItem> & { chainId?: string } = {},
): ActivityListItem {
  return {
    type: 'send',
    chainId: 'eip155:1',
    status: 'success',
    timestamp: 1,
    hash: '0xabc',
    data: {
      from: '0x1',
      to: '0x2',
      token: { direction: 'out', symbol: 'ETH', amount: '1' },
    },
    ...overrides,
  } as ActivityListItem;
}

describe('useLocalTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectLocalActivityItems) {
        return [];
      }
      if (selector === selectLocalTransactionsByHash) {
        return new Map();
      }
      return undefined;
    });
  });

  it('excludes items without a chainId when filtering by networks', () => {
    const withChain = sendItem({ hash: '0x1', chainId: 'eip155:1' });
    const withoutChain = sendItem({
      hash: '0x2',
      chainId: undefined,
    });

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectLocalActivityItems) {
        return [withChain, withoutChain];
      }
      if (selector === selectLocalTransactionsByHash) {
        return new Map();
      }
      return undefined;
    });

    const { result } = renderHook(() =>
      useLocalTransactions({ networks: ['eip155:1'] }),
    );

    expect(result.current).toEqual([withChain]);
  });

  it('returns an empty list when no networks are selected', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectLocalActivityItems) {
        return [sendItem()];
      }
      if (selector === selectLocalTransactionsByHash) {
        return new Map();
      }
      return undefined;
    });

    const { result } = renderHook(() => useLocalTransactions({ networks: [] }));

    expect(result.current).toEqual([]);
  });
});
