import { renderHook } from '@testing-library/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { MUSD_MONEY_ACCOUNT_CHAIN_IDS } from '@metamask/money-account-utils';
import { apiClient } from '../../helpers/api-client';
import { MINUTE } from '../../../shared/constants/time';
import {
  selectMoneyAccountPremiumVaultConfig,
  selectMoneyAccountVaultConfig,
  selectMoneyActivityMockDataEnabled,
  selectMoneyEnableHistoricalVaultShareValuations,
} from '../../selectors/money/money-account-feature-flags';
import { parseAccountsApiActivity } from '../../pages/money/utils/accounts-api';
import type { AccountsApiActivity } from '../../pages/money/types/money-activity';
import { useTrace } from '../useTrace';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyActivityValuations } from './use-money-activity-valuations';
import { useMoneyAccountApiActivity } from './use-money-account-api-activity';

jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../helpers/api-client', () => ({
  apiClient: {
    accounts: {
      getV1AccountTransactionsQueryOptions: jest.fn(),
    },
  },
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  selectMoneyActivityMockDataEnabled: jest.fn(),
  selectMoneyAccountPremiumVaultConfig: jest.fn(),
  selectMoneyAccountVaultConfig: jest.fn(),
  selectMoneyEnableHistoricalVaultShareValuations: jest.fn(),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

jest.mock('./use-money-activity-valuations', () => ({
  useMoneyActivityValuations: jest.fn(),
}));

jest.mock('../useTrace', () => ({
  useTrace: jest.fn(),
}));

jest.mock('../../pages/money/utils/accounts-api', () => ({
  ...jest.requireActual('../../pages/money/utils/accounts-api'),
  parseAccountsApiActivity: jest.fn(),
}));

const mockUseInfiniteQuery = jest.mocked(useInfiniteQuery);
const mockGetQueryOptions = jest.mocked(
  apiClient.accounts.getV1AccountTransactionsQueryOptions,
);
const mockParse = jest.mocked(parseAccountsApiActivity);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockSelectMoneyActivityMockDataEnabled = jest.mocked(
  selectMoneyActivityMockDataEnabled,
);
const mockSelectHistorical = jest.mocked(
  selectMoneyEnableHistoricalVaultShareValuations,
);
const mockSelectStandardVault = jest.mocked(selectMoneyAccountVaultConfig);
const mockSelectPremiumVault = jest.mocked(
  selectMoneyAccountPremiumVaultConfig,
);
const mockUseValuations = jest.mocked(useMoneyActivityValuations);
const mockUseTrace = jest.mocked(useTrace);
const mockGetDisplayAmount = jest.fn();

const ADDR_A = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const QUERY_OPTIONS_MOCK = {
  queryKey: ['accounts', 'transactions', 'v1Account'],
};

const STANDARD_VAULT = {
  chainId: '0x8f',
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
} as const;

const CARD: AccountsApiActivity = {
  kind: 'card',
  hash: '0xabc',
  time: 1,
  chainId: '0x8f',
  token: { address: '0xtoken', symbol: 'mUSD', decimals: 6 },
  amount: '5381986',
  paidTo: '0xdef',
};

const PAGE_MOCK = {
  data: [{ hash: '0xabc', timestamp: '2026-06-04T00:00:00.000Z' }],
  pageInfo: { count: 1, hasNextPage: true, cursor: 'cursor-2' },
};

function mockQueryResult(
  overrides: Partial<ReturnType<typeof useInfiniteQuery>> = {},
) {
  mockUseInfiniteQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    isFetchingNextPage: false,
    hasNextPage: undefined,
    fetchNextPage: jest.fn(),
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useInfiniteQuery>);
}

describe('useMoneyAccountApiActivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(false);
    mockSelectHistorical.mockReturnValue(false);
    mockSelectStandardVault.mockReturnValue(undefined);
    mockSelectPremiumVault.mockReturnValue(undefined);
    mockGetDisplayAmount.mockReturnValue(undefined);
    mockUseValuations.mockReturnValue({
      getDisplayAmount: mockGetDisplayAmount,
      isSettling: false,
    });
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: ADDR_A },
    });
    mockGetQueryOptions.mockReturnValue(
      QUERY_OPTIONS_MOCK as unknown as ReturnType<typeof mockGetQueryOptions>,
    );
    mockQueryResult();
    mockParse.mockReturnValue([]);
  });

  it('composes query options from the checksummed money address on Monad', () => {
    renderHook(() => useMoneyAccountApiActivity());

    expect(mockGetQueryOptions).toHaveBeenCalledWith(ADDR_A, {
      chainIds: MUSD_MONEY_ACCOUNT_CHAIN_IDS,
      sortDirection: 'DESC',
    });
  });

  it('delegates to useInfiniteQuery with a cursor-free query key', () => {
    renderHook(() => useMoneyAccountApiActivity());

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: QUERY_OPTIONS_MOCK.queryKey,
        queryFn: expect.any(Function),
        getNextPageParam: expect.any(Function),
        enabled: true,
        staleTime: 5 * MINUTE,
        retry: false,
      }),
    );
  });

  it('disables the query when there is no money account', () => {
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });

    renderHook(() => useMoneyAccountApiActivity());

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('disables the query in mock-data mode', () => {
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(true);

    renderHook(() => useMoneyAccountApiActivity());

    expect(mockUseInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it('queryFn fetches pages via the SDK queryFn, not fetchQuery', async () => {
    const fetchPage = jest.fn().mockResolvedValue(PAGE_MOCK);
    mockGetQueryOptions.mockReturnValue({
      queryKey: QUERY_OPTIONS_MOCK.queryKey,
      queryFn: fetchPage,
    } as unknown as ReturnType<typeof mockGetQueryOptions>);
    renderHook(() => useMoneyAccountApiActivity());
    const { queryFn } = mockUseInfiniteQuery.mock.calls[0][0] as unknown as {
      queryFn: (ctx: {
        pageParam?: string;
        signal?: AbortSignal;
      }) => Promise<unknown>;
    };
    const { signal } = new AbortController();

    await queryFn({ pageParam: 'cursor-1', signal });

    expect(mockGetQueryOptions).toHaveBeenCalledWith(ADDR_A, {
      chainIds: MUSD_MONEY_ACCOUNT_CHAIN_IDS,
      sortDirection: 'DESC',
      cursor: 'cursor-1',
    });
    expect(fetchPage).toHaveBeenCalledWith({ signal });
  });

  it('getNextPageParam returns the cursor only while more pages remain', () => {
    renderHook(() => useMoneyAccountApiActivity());
    const { getNextPageParam } = mockUseInfiniteQuery.mock
      .calls[0][0] as unknown as {
      getNextPageParam: (page: {
        pageInfo?: { hasNextPage?: boolean; cursor?: string };
      }) => string | undefined;
    };

    expect(getNextPageParam(PAGE_MOCK)).toBe('cursor-2');
    expect(
      getNextPageParam({ pageInfo: { hasNextPage: true, cursor: '' } }),
    ).toBeUndefined();
    expect(
      getNextPageParam({ pageInfo: { hasNextPage: false, cursor: 'x' } }),
    ).toBeUndefined();
  });

  it('parses and dedupes activity across pages', () => {
    mockParse.mockReturnValue([CARD]);
    mockQueryResult({
      data: { pages: [PAGE_MOCK, PAGE_MOCK], pageParams: [undefined, 'c2'] },
      hasNextPage: true,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());

    expect(result.current.activity).toStrictEqual([CARD]);
    expect(result.current.pageCount).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('keeps raw amounts and skips valuations when the flag is off', () => {
    mockParse.mockReturnValue([CARD]);
    mockQueryResult({
      data: { pages: [PAGE_MOCK], pageParams: [undefined] },
      hasNextPage: false,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());

    expect(mockParse).toHaveBeenCalledWith(
      PAGE_MOCK,
      ADDR_A,
      expect.any(Array),
      [],
    );
    expect(mockUseValuations).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(result.current.activity).toStrictEqual([CARD]);
  });

  it('parses with the configured vault-share tokens and attaches valuations', () => {
    mockSelectHistorical.mockReturnValue(true);
    mockSelectStandardVault.mockReturnValue(STANDARD_VAULT);
    mockParse.mockReturnValue([CARD]);
    mockGetDisplayAmount.mockReturnValue({
      type: 'historical',
      value: '1017488',
      decimals: 6,
    });
    mockQueryResult({
      data: { pages: [PAGE_MOCK], pageParams: [undefined] },
      hasNextPage: false,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());

    expect(mockParse).toHaveBeenCalledWith(
      PAGE_MOCK,
      ADDR_A,
      expect.any(Array),
      [
        {
          chainId: STANDARD_VAULT.chainId,
          address: STANDARD_VAULT.boringVault,
        },
      ],
    );
    expect(result.current.activity).toStrictEqual([
      {
        ...CARD,
        displayAmount: { type: 'historical', value: '1017488', decimals: 6 },
      },
    ]);
    expect(mockUseValuations).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    );
    expect(mockUseTrace).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, ready: true }),
    );
  });

  it('opens the watermark once paging is complete', () => {
    mockQueryResult({
      data: { pages: [PAGE_MOCK], pageParams: [undefined] },
      hasNextPage: false,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());

    expect(result.current.watermark).toBe(Number.NEGATIVE_INFINITY);
    expect(result.current.hasMore).toBe(false);
  });

  it('does not freeze the list when fetched pages have no parseable timestamps', () => {
    mockQueryResult({
      data: {
        pages: [{ data: [{ hash: '0xabc', timestamp: 'not-a-date' }] }],
        pageParams: [undefined],
      },
      hasNextPage: true,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());

    expect(result.current.watermark).toBe(Number.NEGATIVE_INFINITY);
    expect(result.current.hasMore).toBe(true);
  });

  it('does not load more after an error', () => {
    const fetchNextPage = jest.fn();
    mockQueryResult({
      hasNextPage: true,
      isError: true,
      fetchNextPage,
    });

    const { result } = renderHook(() => useMoneyAccountApiActivity());
    result.current.loadMore();

    expect(fetchNextPage).not.toHaveBeenCalled();
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBe(true);
  });
});
