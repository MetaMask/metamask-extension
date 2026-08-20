import { queryClient } from '../../contexts/query-client';
import { submitRequestToBackground } from '../../store/background-connection';
import { invalidateMoneyAccountBalanceCaches } from './invalidate-balance-caches';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../contexts/query-client', () => ({
  queryClient: { invalidateQueries: jest.fn() },
}));

const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);
const invalidateQueriesMock = jest.mocked(queryClient.invalidateQueries);

const ADDRESS = '0xAbC0000000000000000000000000000000000001';

describe('invalidateMoneyAccountBalanceCaches', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    submitRequestToBackgroundMock.mockResolvedValue(undefined);
    invalidateQueriesMock.mockResolvedValue(undefined);
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

  it('invalidates the UI facade query so mounted observers refetch', async () => {
    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    expect(invalidateQueriesMock).toHaveBeenCalledWith({
      queryKey: [
        'MoneyAccountBalanceService:fetchBalanceWithFallback',
        ADDRESS,
      ],
      refetchType: 'all',
    });
  });

  it('busts both source caches before invalidating the facade', async () => {
    const order: string[] = [];
    submitRequestToBackgroundMock.mockImplementation(async (_method, args) => {
      order.push(`source:${(args as [string, unknown[]])[0]}`);
    });
    invalidateQueriesMock.mockImplementation(async () => {
      order.push('facade');
    });

    await invalidateMoneyAccountBalanceCaches(ADDRESS);

    expect(order).toStrictEqual([
      'source:MoneyAccountBalanceService:invalidateQueries',
      'source:MoneyAccountApiDataService:invalidateQueries',
      'facade',
    ]);
  });

  it('rejects when a source cache cannot be busted', async () => {
    submitRequestToBackgroundMock.mockRejectedValue(new Error('disconnected'));

    await expect(invalidateMoneyAccountBalanceCaches(ADDRESS)).rejects.toThrow(
      'disconnected',
    );
    expect(invalidateQueriesMock).not.toHaveBeenCalled();
  });
});
