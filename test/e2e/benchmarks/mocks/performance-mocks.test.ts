import type { Mockttp } from 'mockttp';
import type { PassThroughInterceptor } from '../../mock-e2e-pass-through';
import {
  benchmarkPassThroughInterceptor,
  subscriptionsHostMock,
  userStorageHostMock,
} from './performance-mocks';

const EMPTY_SUBSCRIPTIONS = {
  statusCode: 200,
  json: { subscriptions: [], trialedProducts: [] },
};

function createServer() {
  const thenCallback = jest.fn().mockResolvedValue({});
  const always = jest.fn(() => ({ thenCallback }));
  const forGet = jest.fn(() => ({ always, forHost: () => ({ always }) }));
  const server = { forGet } as unknown as Mockttp;
  const getInterceptor = () =>
    (server as unknown as Record<string, unknown>)
      .__passThroughInterceptor as PassThroughInterceptor;
  return { server, forGet, getInterceptor };
}

describe('subscriptionsHostMock', () => {
  it('answers the subscriptions poll with an empty response', () => {
    const { server, getInterceptor } = createServer();
    subscriptionsHostMock(server);

    expect(
      getInterceptor()({
        url: 'https://subscription.api.cx.metamask.io/v1/subscriptions',
        method: 'GET',
      }),
    ).toStrictEqual({ response: EMPTY_SUBSCRIPTIONS });
  });

  it('registers a rule for the subscriptions URL', () => {
    const { server, forGet } = createServer();
    subscriptionsHostMock(server);

    expect(forGet).toHaveBeenCalledWith(
      'https://subscription.api.cx.metamask.io/v1/subscriptions',
    );
  });

  it('leaves the eligibility request and other hosts to pass through', () => {
    const { server, getInterceptor } = createServer();
    subscriptionsHostMock(server);

    expect(
      getInterceptor()({
        url: 'https://subscription.api.cx.metamask.io/v1/subscriptions/eligibility?balanceCategory=0-99',
        method: 'GET',
      }),
    ).toBeNull();
    expect(
      getInterceptor()({
        url: 'https://accounts.api.cx.metamask.io/v2/accounts',
        method: 'GET',
      }),
    ).toBeNull();
  });

  it('keeps the interceptor registered before it', () => {
    const { server, getInterceptor } = createServer();
    userStorageHostMock(server);
    subscriptionsHostMock(server);

    expect(
      getInterceptor()({
        url: 'https://user-storage.api.cx.metamask.io/api/v1/userstorage',
        method: 'GET',
      }),
    ).toStrictEqual({ response: { statusCode: 200, json: null } });
    expect(
      getInterceptor()({
        url: 'https://subscription.api.cx.metamask.io/v1/subscriptions',
        method: 'GET',
      }),
    ).toStrictEqual({ response: EMPTY_SUBSCRIPTIONS });
  });
});

describe('benchmarkPassThroughInterceptor', () => {
  it('still answers the subscriptions poll', () => {
    expect(
      benchmarkPassThroughInterceptor({
        url: 'https://subscription.api.cx.metamask.io/v1/subscriptions',
        method: 'GET',
      }),
    ).toStrictEqual({ response: EMPTY_SUBSCRIPTIONS });
  });
});
