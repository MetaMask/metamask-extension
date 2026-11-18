import { createUIQueryClient } from '@metamask/react-data-query';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';

jest.mock('@metamask/react-data-query', () => ({
  createUIQueryClient: jest.fn(),
}));

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  subscribeToMessengerEvent: jest.fn(),
}));

type Adapter = {
  call: (method: string, ...params: unknown[]) => Promise<unknown>;
  subscribe: (event: string, callback: (payload: unknown) => void) => void;
  unsubscribe: (event: string, callback: (payload: unknown) => void) => void;
};

const createUIQueryClientMock = jest.mocked(createUIQueryClient);
const submitRequestToBackgroundMock = jest.mocked(submitRequestToBackground);
const subscribeToMessengerEventMock = jest.mocked(subscribeToMessengerEvent);

const EVENT = 'MoneyAccountBalanceService:cacheUpdated:hash';
const UPDATE = { type: 'updated', state: { queries: [], mutations: [] } };

let adapter: Adapter;

function getListener(): (payload: unknown) => void {
  const listener = subscribeToMessengerEventMock.mock.lastCall?.[1];
  if (!listener) {
    throw new Error('subscribeToMessengerEvent was not called');
  }
  return listener as (payload: unknown) => void;
}

async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('queryClient', () => {
  beforeAll(async () => {
    await import('./query-client');
    adapter = createUIQueryClientMock.mock.calls[0]?.[1] as Adapter;
  });

  beforeEach(() => {
    submitRequestToBackgroundMock.mockReset();
    subscribeToMessengerEventMock.mockReset();
    subscribeToMessengerEventMock.mockResolvedValue(jest.fn());
  });

  it('forwards calls to the background messenger', async () => {
    submitRequestToBackgroundMock.mockResolvedValue({ balance: '1' });

    const result = await adapter.call(
      'MoneyAccountBalanceService:fetchBalance',
      'a',
      1,
    );

    expect(submitRequestToBackgroundMock).toHaveBeenCalledWith(
      'messengerCall',
      ['MoneyAccountBalanceService:fetchBalance', ['a', 1]],
    );
    expect(result).toStrictEqual({ balance: '1' });
  });

  it('unwraps messenger cache updates before they reach the query client', () => {
    const callback = jest.fn();

    adapter.subscribe(EVENT, callback);
    getListener()([UPDATE]);

    expect(subscribeToMessengerEventMock).toHaveBeenCalledWith(
      EVENT,
      expect.any(Function),
    );
    expect(callback).toHaveBeenCalledWith(UPDATE);
  });

  it('passes through payloads that are already a cache update object', () => {
    const callback = jest.fn();

    adapter.subscribe(EVENT, callback);
    getListener()(UPDATE);

    expect(callback).toHaveBeenCalledWith(UPDATE);
  });

  it('ignores payloads without a cache update object', () => {
    const callback = jest.fn();

    adapter.subscribe(EVENT, callback);
    const listener = getListener();
    listener([]);
    listener(null);
    listener(['not-an-object']);

    expect(callback).not.toHaveBeenCalled();
  });

  it('unsubscribes the messenger listener registered for the callback', async () => {
    const unsubscribe = jest.fn().mockResolvedValue(undefined);
    subscribeToMessengerEventMock.mockResolvedValue(unsubscribe);
    const callback = jest.fn();

    adapter.subscribe(EVENT, callback);
    await flushPromises();
    adapter.unsubscribe(EVENT, callback);

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does nothing when unsubscribing a callback that was never subscribed', () => {
    expect(() => adapter.unsubscribe(EVENT, jest.fn())).not.toThrow();
  });

  it('logs subscription failures instead of throwing', async () => {
    const error = new Error('subscribe failed');
    subscribeToMessengerEventMock.mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    adapter.subscribe(EVENT, jest.fn());
    await flushPromises();

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it('logs unsubscribe failures instead of throwing', async () => {
    const error = new Error('unsubscribe failed');
    subscribeToMessengerEventMock.mockResolvedValue(
      jest.fn().mockRejectedValue(error),
    );
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const callback = jest.fn();

    adapter.subscribe(EVENT, callback);
    await flushPromises();
    adapter.unsubscribe(EVENT, callback);
    await flushPromises();

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });
});
