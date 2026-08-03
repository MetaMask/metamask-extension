import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { selectNonEvmActivityItems } from '../../selectors/activity';
import { useNonEvmTransactions } from './useNonEvmTransactions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../selectors/activity', () => ({
  selectNonEvmActivityItems: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

function solanaItem(
  overrides: Partial<ActivityListItem> & { chainId?: string } = {},
): ActivityListItem {
  return {
    type: 'send',
    chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    status: 'success',
    timestamp: 1,
    hash: 'sig',
    data: {
      from: 'from',
      to: 'to',
      token: { direction: 'out', symbol: 'SOL', amount: '1' },
    },
    ...overrides,
  } as ActivityListItem;
}

describe('useNonEvmTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectNonEvmActivityItems) {
        return [];
      }
      return undefined;
    });
  });

  it('excludes items without a chainId when filtering by networks', () => {
    const network = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    const withChain = solanaItem({ hash: 'a', chainId: network });
    const withoutChain = solanaItem({ hash: 'b', chainId: undefined });

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectNonEvmActivityItems) {
        return [withChain, withoutChain];
      }
      return undefined;
    });

    const { result } = renderHook(() =>
      useNonEvmTransactions({ networks: [network] }),
    );

    expect(result.current).toMatchSnapshot();
  });

  it('returns an empty list when no networks are selected', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectNonEvmActivityItems) {
        return [solanaItem()];
      }
      return undefined;
    });

    const { result } = renderHook(() =>
      useNonEvmTransactions({ networks: [] }),
    );

    expect(result.current).toEqual([]);
  });
});
