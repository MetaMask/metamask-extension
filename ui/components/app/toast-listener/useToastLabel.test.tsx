import { renderHook } from '@testing-library/react';
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

function addClaimMusdBonusItem(
  id: string,
  overrides: Partial<ActivityListItem> = {},
) {
  mockItems.set(id, {
    type: 'claimMusdBonus',
    chainId: 'eip155:59144',
    status: 'pending',
    timestamp: 0,
    data: {},
    ...overrides,
  } as ActivityListItem);
}

function addPerpsWithdrawItem(
  id: string,
  overrides: Partial<ActivityListItem> = {},
) {
  mockItems.set(id, {
    type: 'perpsWithdraw',
    chainId: 'eip155:42161',
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

  it('returns the pending title for a claimMusdBonus toast', () => {
    addClaimMusdBonusItem('tx-1');

    const { result } = renderHook(() => useToastLabel('pending', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'merklRewardsToastInProgress',
      description: undefined,
    });
  });

  it('returns the success title for a claimMusdBonus toast', () => {
    addClaimMusdBonusItem('tx-1', {
      status: 'success',
    } as Partial<ActivityListItem>);

    const { result } = renderHook(() => useToastLabel('success', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'merklRewardsToastSuccess',
      description: undefined,
    });
  });

  it('returns the failed title for a claimMusdBonus toast', () => {
    addClaimMusdBonusItem('tx-1', {
      status: 'failed',
    } as Partial<ActivityListItem>);

    const { result } = renderHook(() => useToastLabel('failed', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'merklRewardsToastFailed',
      description: undefined,
    });
  });

  it('returns pending perps withdraw toast content', () => {
    addPerpsWithdrawItem('tx-1');

    const { result } = renderHook(() => useToastLabel('pending', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'perpsWithdrawPostQuoteToastPendingTitle',
      description: 'perpsWithdrawPostQuoteToastPendingDescription',
    });
  });

  it('returns success perps withdraw toast content with amount and symbol', () => {
    addPerpsWithdrawItem('tx-1', {
      data: {
        fiat: { amount: '20.73' },
        token: { symbol: 'BNB', direction: 'out' },
      },
    } as Partial<ActivityListItem>);

    const { result } = renderHook(() => useToastLabel('success', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'perpsWithdrawPostQuoteToastSuccessTitle',
      description: 'perpsWithdrawPostQuoteToastSuccessDescription:$20.73,BNB',
    });
  });

  it('returns generic success description when amount or symbol is missing', () => {
    addPerpsWithdrawItem('tx-1');

    const { result } = renderHook(() => useToastLabel('success', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'perpsWithdrawPostQuoteToastSuccessTitle',
      description: 'perpsWithdrawPostQuoteToastSuccessGenericDescription',
    });
  });

  it('returns failed perps withdraw toast content', () => {
    addPerpsWithdrawItem('tx-1');

    const { result } = renderHook(() => useToastLabel('failed', 'tx-1'));

    expect(result.current).toStrictEqual({
      title: 'perpsWithdrawPostQuoteToastErrorTitle',
      description: 'perpsWithdrawPostQuoteToastErrorDescription',
    });
  });
});
