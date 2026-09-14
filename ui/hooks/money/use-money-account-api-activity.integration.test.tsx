import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '../../helpers/api-client';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import { parseAccountsApiActivity } from '../../pages/money/utils/accounts-api';
import type { AccountsApiActivity } from '../../pages/money/types/money-activity';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAccountApiActivity } from './use-money-account-api-activity';

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
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

jest.mock('../../pages/money/utils/accounts-api', () => ({
  ...jest.requireActual('../../pages/money/utils/accounts-api'),
  parseAccountsApiActivity: jest.fn(),
}));

const mockGetQueryOptions = jest.mocked(
  apiClient.accounts.getV1AccountTransactionsQueryOptions,
);
const mockParse = jest.mocked(parseAccountsApiActivity);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockSelectMoneyActivityMockDataEnabled = jest.mocked(
  selectMoneyActivityMockDataEnabled,
);

const ADDR_A = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const QUERY_KEY = [
  'accounts',
  'transactions',
  'v1Account',
  { address: ADDR_A },
];

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
  pageInfo: { count: 1, hasNextPage: false, cursor: '' },
};

describe('useMoneyAccountApiActivity first-page fetch', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return function wrapperElement({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyActivityMockDataEnabled.mockReturnValue(false);
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: ADDR_A },
    });
    mockParse.mockReturnValue([CARD]);
    mockGetQueryOptions.mockReturnValue({
      queryKey: QUERY_KEY,
      queryFn: jest.fn().mockResolvedValue(PAGE_MOCK),
    } as unknown as ReturnType<typeof mockGetQueryOptions>);
  });

  it('settles the first page without deadlocking on fetchQuery', async () => {
    const { result } = renderHook(() => useMoneyAccountApiActivity(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pageCount).toBe(1);
    expect(result.current.activity).toStrictEqual([CARD]);
    expect(result.current.watermark).toBe(Number.NEGATIVE_INFINITY);
  });
});
