import { createUIQueryClient } from '@metamask/react-data-query';
import { subscribeToMessengerEvent } from '../store/background-connection';

jest.mock('@metamask/react-data-query', () => ({
  createUIQueryClient: jest.fn(),
}));

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  subscribeToMessengerEvent: jest.fn(() => Promise.resolve(jest.fn())),
}));

const createUIQueryClientMock = jest.mocked(createUIQueryClient);
const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);

describe('queryClient', () => {
  beforeAll(async () => {
    await import('./query-client');
  });

  it('unwraps messenger cache updates before they reach the query client', () => {
    const adapter = createUIQueryClientMock.mock.calls[0]?.[1] as {
      subscribe: (
        event: string,
        callback: (payload: { type: string; state: unknown }) => void,
      ) => void;
    };
    const callback = jest.fn();

    adapter.subscribe('MoneyAccountBalanceService:cacheUpdated:hash', callback);

    const listener = subscribeToMessengerEventMock.mock.calls[0]?.[1] as (
      payload: unknown,
    ) => void;
    const update = {
      type: 'updated',
      state: { queries: [], mutations: [] },
    };
    listener([update]);

    expect(callback).toHaveBeenCalledWith(update);
  });
});
