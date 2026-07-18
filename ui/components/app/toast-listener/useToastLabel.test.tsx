import { renderHook } from '@testing-library/react-hooks';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useToastLabel } from './useToastLabel';

const mockT = jest.fn((key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key,
);

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

const mockItems = new Map<string, ActivityListItem>();

jest.mock('../../../selectors/activity', () => ({
  selectLocalActivityItemsByIdentifier: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: () => mockItems,
}));

function addConvertItem(id: string, overrides: Partial<ActivityListItem> = {}) {
  mockItems.set(id, {
    type: 'convert',
    chainId: 'eip155:1',
    status: 'pending',
    timestamp: 0,
    data: {},
    ...overrides,
  } as ActivityListItem);
}

describe('useToastLabel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockItems.clear();
  });

  it('returns the generic status label when the transaction has no activity item', () => {
    const { result } = renderHook(() => useToastLabel('pending', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'transactionSubmitted',
      description: undefined,
    });
  });

  it('interpolates the source token symbol for a pending convert toast', () => {
    addConvertItem('tx-1', {
      data: { sourceToken: { symbol: 'USDC', direction: 'out' } },
    } as Partial<ActivityListItem>);

    const { result } = renderHook(() => useToastLabel('pending', 'tx-1'));

    expect(result.current.title).toBe('musdConversionToastInProgress:USDC');
  });

  it('falls back to a generic token label when the source token symbol is unknown', () => {
    addConvertItem('tx-1');

    const { result } = renderHook(() => useToastLabel('pending', 'tx-1'));

    expect(result.current.title).toBe('musdConversionToastInProgress:Token');
  });

  it('returns the success title and description for a convert toast', () => {
    addConvertItem('tx-1', { status: 'success' } as Partial<ActivityListItem>);

    const { result } = renderHook(() => useToastLabel('success', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'musdConversionToastSuccess',
      description: 'musdConversionToastSuccessDescription',
    });
  });
});
