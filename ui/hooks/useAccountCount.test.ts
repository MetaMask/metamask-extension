/**
 * useAccountCount Hook Tests
 * Feature: account-count-display
 */

import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useAccountCount } from './useAccountCount';

// Mock react-redux
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('useAccountCount', () => {
  const mockAccountListStats = {
    totalAccounts: 38,
    hiddenCount: 2,
    pinnedCount: 3,
  };

  const mockWalletsWithAccounts = {
    'wallet-1': {
      id: 'wallet-1',
      type: 'HD Key Tree',
      metadata: { name: 'Wallet 1' },
      groups: {
        'group-1': {
          id: 'group-1',
          accounts: [{ id: 'acc-1' }, { id: 'acc-2' }, { id: 'acc-3' }, { id: 'acc-4' }, { id: 'acc-5' }],
        },
      },
    },
    'wallet-2': {
      id: 'wallet-2',
      type: 'HD Key Tree',
      metadata: { name: 'Wallet 2' },
      groups: {
        'group-2': {
          id: 'group-2',
          accounts: Array.from({ length: 20 }, (_, i) => ({ id: `acc-w2-${i}` })),
        },
      },
    },
    imported: {
      id: 'imported',
      type: 'Simple Key Pair',
      metadata: { name: 'Imported' },
      groups: {
        'group-3': {
          id: 'group-3',
          accounts: [{ id: 'acc-imp-1' }, { id: 'acc-imp-2' }],
        },
      },
    },
  };

  beforeEach(() => {
    // useSelector is called twice: once for getAccountListStats, once for getWalletsWithAccounts
    mockUseSelector
      .mockReturnValueOnce(mockAccountListStats)
      .mockReturnValueOnce(mockWalletsWithAccounts);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns totalCount from getAccountListStats', () => {
    const { result } = renderHook(() => useAccountCount());

    expect(result.current.totalCount).toBe(38);
  });

  it('returns hiddenCount from getAccountListStats', () => {
    const { result } = renderHook(() => useAccountCount());

    expect(result.current.hiddenCount).toBe(2);
  });

  it('returns breakdown array derived from getWalletsWithAccounts', () => {
    const { result } = renderHook(() => useAccountCount());

    expect(result.current.breakdown).toBeDefined();
    expect(Array.isArray(result.current.breakdown)).toBe(true);
    expect(result.current.breakdown.length).toBe(3);
  });

  it('returns isLoading as false', () => {
    const { result } = renderHook(() => useAccountCount());

    expect(result.current.isLoading).toBe(false);
  });

  it('breakdown items have correct wallet names and account counts', () => {
    const { result } = renderHook(() => useAccountCount());

    const wallet1 = result.current.breakdown.find((w) => w.id === 'wallet-1');
    expect(wallet1).toBeDefined();
    expect(wallet1?.name).toBe('Wallet 1');
    expect(wallet1?.accountCount).toBe(5);

    const wallet2 = result.current.breakdown.find((w) => w.id === 'wallet-2');
    expect(wallet2).toBeDefined();
    expect(wallet2?.name).toBe('Wallet 2');
    expect(wallet2?.accountCount).toBe(20);

    const imported = result.current.breakdown.find((w) => w.id === 'imported');
    expect(imported).toBeDefined();
    expect(imported?.name).toBe('Imported');
    expect(imported?.accountCount).toBe(2);
  });

  it('returns empty breakdown when walletsWithAccounts is null', () => {
    mockUseSelector.mockReset();
    mockUseSelector
      .mockReturnValueOnce(mockAccountListStats)
      .mockReturnValueOnce(null);

    const { result } = renderHook(() => useAccountCount());

    expect(result.current.breakdown).toEqual([]);
  });

  it('returns zero counts when accountListStats is null', () => {
    mockUseSelector.mockReset();
    mockUseSelector
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(mockWalletsWithAccounts);

    const { result } = renderHook(() => useAccountCount());

    expect(result.current.totalCount).toBe(0);
    expect(result.current.hiddenCount).toBe(0);
  });
});
