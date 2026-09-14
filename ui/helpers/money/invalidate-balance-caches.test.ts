import { queryClient } from '../../contexts/query-client';
import { submitRequestToBackground } from '../../store/background-connection';
import { invalidateMoneyAccountBalanceCaches } from './invalidate-balance-caches';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  subscribeToMessengerEvent: jest.fn(),
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);

const ADDRESS = '0xAbC0000000000000000000000000000000000001';

const FACADE_QUERY_KEY = [
  'MoneyAccountBalanceService:fetchBalanceWithFallback',
  ADDRESS,
];

const STALE_BALANCE = { totalBalance: '1000000' };
const FRESH_BALANCE = { totalBalance: '2000000' };

const messengerCalls = () =>
  submitRequestToBackgroundMock.mock.calls
    .filter(([method]) => method === 'messengerCall')
    .map(([, args]) => args as [string, unknown[]]);

describe('invalidateMoneyAccountBalanceCaches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    submitRequestToBackgroundMock.mockImplementation(async (_method, args) => {
      const [action] = args as [string, unknown[]];
      return action === 'MoneyAccountBalanceService:fetchBalanceWithFallback'
        ? (FRESH_BALANCE as never)
        : (undefined as never);
    });
  });

  it('busts the RPC source cache in the balance service', async () => {
    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      [
        'MoneyAccountBalanceService:invalidateQueries',
        [
          {
            queryKey: [
              'MoneyAccountBalanceService:getMoneyAccountBalance',
              ADDRESS,
            ],
          },
        ],
      ],
    );
  });

  it('busts the API source cache with the lowercased address the package uses', async () => {
    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      [
        'MoneyAccountApiDataService:invalidateQueries',
        [
          {
            queryKey: [
              'MoneyAccountApiDataService:fetchPositions',
              ADDRESS.toLowerCase(),
            ],
          },
        ],
      ],
    );
  });

  it('busts both source caches, then invalidates the cached facade query and refetches it through the background', async () => {
    queryClient.setQueryData(FACADE_QUERY_KEY, STALE_BALANCE);

    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    expect(messengerCalls().map(([action]) => action)).toStrictEqual([
      'MoneyAccountBalanceService:invalidateQueries',
      'MoneyAccountApiDataService:invalidateQueries',
      'MoneyAccountBalanceService:invalidateQueries',
      'MoneyAccountBalanceService:fetchBalanceWithFallback',
    ]);
    expect(queryClient.getQueryData(FACADE_QUERY_KEY)).toStrictEqual(
      FRESH_BALANCE,
    );
  });

  it('forwards the facade invalidation with arguments that survive JSON-RPC serialization', async () => {
    queryClient.setQueryData(FACADE_QUERY_KEY, STALE_BALANCE);

    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    const forwardedParams = messengerCalls().find(
      ([action, params]) =>
        action === 'MoneyAccountBalanceService:invalidateQueries' &&
        params.length === 2,
    )?.[1];

    expect(forwardedParams).toStrictEqual([
      { queryKey: FACADE_QUERY_KEY, refetchType: 'all' },
      {},
    ]);
    // An `undefined` options argument would cross the UI→background boundary
    // as `null` and crash the background's `options.cancelRefetch` read.
    expect(JSON.parse(JSON.stringify(forwardedParams))).toStrictEqual(
      forwardedParams,
    );
  });

  it('rejects and leaves the facade query untouched when a source cache cannot be busted', async () => {
    queryClient.setQueryData(FACADE_QUERY_KEY, STALE_BALANCE);
    submitRequestToBackgroundMock.mockRejectedValue(new Error('disconnected'));

    await expect(invalidateMoneyAccountBalanceCaches(ADDRESS)).rejects.toThrow(
      'disconnected',
    );
    expect(
      queryClient.getQueryCache().find({ queryKey: FACADE_QUERY_KEY })?.state
        .isInvalidated,
    ).toBe(false);
    expect(queryClient.getQueryData(FACADE_QUERY_KEY)).toStrictEqual(
      STALE_BALANCE,
    );
  });
});
