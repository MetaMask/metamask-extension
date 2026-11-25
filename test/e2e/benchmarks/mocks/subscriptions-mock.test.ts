import type { Mockttp } from 'mockttp';
import { setPassThroughInterceptor } from '../../mock-e2e-pass-through';
import { subscriptionsMock } from './performance-mocks';

type Callback = () => { statusCode: number; json: unknown };

// A stand-in for the part of mockttp's rule builder the mock uses.
function fakeServer() {
  const rules: { url: RegExp; callback?: Callback }[] = [];
  const server = {
    forGet: (url: RegExp) => {
      const rule: (typeof rules)[number] = { url };
      rules.push(rule);
      const builder = {
        always: () => builder,
        thenCallback: (callback: Callback) => {
          rule.callback = callback;
          return Promise.resolve(rule);
        },
      };
      return builder;
    },
  } as unknown as Mockttp;
  return { server, rules };
}

const EMPTY = { subscriptions: [], trialedProducts: [] };

describe('subscriptionsMock', () => {
  it('answers the subscriptions poll with no subscriptions', async () => {
    const { server, rules } = fakeServer();
    await subscriptionsMock(server);

    expect(rules).toHaveLength(1);
    expect(
      rules[0].url.test(
        'https://subscription.api.cx.metamask.io/v1/subscriptions',
      ),
    ).toBe(true);
    expect(
      rules[0].url.test(
        'https://subscription.api.cx.metamask.io/v1/subscriptions/eligibility',
      ),
    ).toBe(false);
    expect(rules[0].callback?.()).toStrictEqual({
      statusCode: 200,
      json: EMPTY,
    });
  });

  it('short-circuits the poll in pass-through mode and leaves other requests to the earlier interceptor', async () => {
    const { server } = fakeServer();
    const earlier = jest.fn(() => ({ response: { statusCode: 204 } }));
    setPassThroughInterceptor(server, earlier);
    await subscriptionsMock(server);
    const interceptor = (
      server as unknown as Record<string, (req: unknown) => unknown>
    ).__passThroughInterceptor;

    expect(
      interceptor({
        url: 'https://subscription.api.cx.metamask.io/v1/subscriptions',
        method: 'GET',
      }),
    ).toStrictEqual({ response: { statusCode: 200, json: EMPTY } });
    expect(earlier).not.toHaveBeenCalled();
    expect(
      interceptor({ url: 'https://example.test/x', method: 'GET' }),
    ).toStrictEqual({ response: { statusCode: 204 } });
  });
});
