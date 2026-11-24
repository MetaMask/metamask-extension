import { matchers, type Mockttp } from 'mockttp';
import {
  KNOWN_ANSWER_HISTORICAL_PRICES_DELAY,
  KNOWN_ANSWER_QUOTE_DELAY,
} from './known-answer';
import {
  MOCK_DELAY_SETS,
  getZeroedMockDelaySet,
  mockAuthAPICall,
  mockBenchmarkEndpoints,
  mockDelayMs,
} from './performance-mocks';

const SWITCH = 'BENCHMARK_ZERO_MOCK_DELAYS';
const SET_SWITCH = 'BENCHMARK_ZERO_MOCK_DELAY_SET';

type Handler = (request: unknown) => Promise<unknown>;

/**
 * A mockttp server that records the handler `mockAuthAPICall` registers, so a
 * test can call it without a network.
 * @returns The fake server and a getter for the registered handler.
 */
function fakeServer() {
  let handler: Handler | undefined;
  const builder = {
    asPriority: () => builder,
    always: () => builder,
    thenCallback: async (callback: Handler) => {
      handler = callback;
      return {};
    },
  };
  const server = { forGet: () => builder } as unknown as Mockttp;
  return {
    server,
    handler: () => {
      if (!handler) {
        throw new Error('no handler registered');
      }
      return handler;
    },
  };
}

const request = {
  path: '/api/v2/nonce',
  body: {
    getJson: async () => ({}),
    getText: async () => '',
  },
};

type RecordedRule = {
  method: string;
  url?: string | RegExp;
  host?: string;
  jsonBody?: Record<string, unknown>;
  // mockttp's default priority (`RulePriority.DEFAULT`) when none is set.
  priority: number;
  handler: Handler;
};

/**
 * A mockttp server that records every rule registered on it, for `resolve` to
 * pick the rule mockttp would answer a request with, without a network.
 * @returns The fake server and the rules registered on it so far.
 */
function recordingServer() {
  const rules: RecordedRule[] = [];
  const builder = (method: string, url?: string | RegExp) => {
    const rule: Omit<RecordedRule, 'handler'> = { method, url, priority: 1 };
    const register = async (handler: Handler) => {
      rules.push({ ...rule, handler });
      return {};
    };
    const ruleBuilder = {
      forHost: (host: string) => {
        rule.host = host;
        return ruleBuilder;
      },
      withJsonBodyIncluding: (jsonBody: Record<string, unknown>) => {
        rule.jsonBody = jsonBody;
        return ruleBuilder;
      },
      asPriority: (priority: number) => {
        rule.priority = priority;
        return ruleBuilder;
      },
      always: () => ruleBuilder,
      thenCallback: register,
      thenJson: (statusCode: number, json: unknown) =>
        register(async () => ({ statusCode, json })),
    };
    return ruleBuilder;
  };
  const server = {
    forGet: (url?: string | RegExp) => builder('GET', url),
    forPost: (url?: string | RegExp) => builder('POST', url),
    forPut: (url?: string | RegExp) => builder('PUT', url),
    forDelete: (url?: string | RegExp) => builder('DELETE', url),
    forAnyRequest: () => builder('ANY'),
  } as unknown as Mockttp;
  return { server, rules };
}

type MatcherRequest = Parameters<matchers.RegexPathMatcher['matches']>[0];

/**
 * The rule mockttp would answer this request with: the highest-priority match,
 * ties going to the first registered (every rule here uses `.always()`).
 * `url` is absolute, query included; mockttp's matchers strip the query.
 */
function resolve(
  rules: RecordedRule[],
  method: string,
  url: string,
  jsonBody?: Record<string, unknown>,
): RecordedRule | undefined {
  const matcherRequest = { url } as MatcherRequest;
  const matching = rules.filter((rule) => {
    if (rule.method !== 'ANY' && rule.method !== method) {
      return false;
    }
    if (rule.url instanceof RegExp) {
      if (!new matchers.RegexPathMatcher(rule.url).matches(matcherRequest)) {
        return false;
      }
    } else if (
      rule.url !== undefined &&
      !new matchers.FlexiblePathMatcher(rule.url).matches(matcherRequest)
    ) {
      return false;
    }
    if (
      rule.host !== undefined &&
      !new matchers.HostMatcher(rule.host).matches(matcherRequest)
    ) {
      return false;
    }
    if (rule.jsonBody !== undefined) {
      const filter = rule.jsonBody;
      return (
        jsonBody !== undefined &&
        Object.keys(filter).every((key) => jsonBody[key] === filter[key])
      );
    }
    return true;
  });
  if (matching.length === 0) {
    return undefined;
  }
  const top = Math.max(...matching.map((rule) => rule.priority));
  return matching.find((rule) => rule.priority === top);
}

/**
 * A request object every registered handler can read, whose `getJson`
 * resolves to `jsonBody`.
 */
function requestFor(url: string, jsonBody: Record<string, unknown> = {}) {
  return {
    url,
    path: new URL(url).pathname,
    body: {
      getJson: async () => jsonBody,
      getText: async () => JSON.stringify(jsonBody),
    },
  };
}

/**
 * Call a handler under fake timers.
 * @returns The fake-clock milliseconds before it responded, and the response.
 */
async function timed(handler: Handler, handlerRequest: unknown) {
  const start = Date.now();
  let response: unknown;
  // Some handlers (`mockTokensV3Assets`) respond synchronously.
  const pending = Promise.resolve(handler(handlerRequest)).then(
    (value) => {
      response = value;
    },
    () => undefined,
  );
  await jest.runAllTimersAsync();
  await pending;
  return { elapsedMs: Date.now() - start, response };
}

/**
 * Register the benchmark mocks on a recording server.
 *
 * @returns The rules `mockBenchmarkEndpoints` registered.
 */
async function registeredRules() {
  const { server, rules } = recordingServer();
  await mockBenchmarkEndpoints(server);
  return rules;
}

/**
 * Resolve a request to its rule and time the response; `url` is absolute.
 * @returns The fake-clock milliseconds before it responded, and the response.
 */
async function respond(
  rules: RecordedRule[],
  method: string,
  url: string,
  jsonBody?: Record<string, unknown>,
) {
  const rule = resolve(rules, method, url, jsonBody);
  if (!rule) {
    throw new Error(`no rule matches ${method} ${url}`);
  }
  return timed(rule.handler, requestFor(url, jsonBody));
}

/**
 * Time every registered rule's response, in registration order.
 * @returns Each rule's fake-clock delay in milliseconds.
 */
async function everyDelay(rules: RecordedRule[]) {
  const delays: number[] = [];
  for (const rule of rules) {
    const { elapsedMs } = await timed(
      rule.handler,
      requestFor('https://mock.test/path?srcChainId=1', {
        id: '1',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        raw_message: 'metamask:nonce:pubkey',
      }),
    );
    delays.push(elapsedMs);
  }
  return delays;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

const QUOTE_STREAM_URL =
  'https://bridge.api.cx.metamask.io/getQuoteStream?srcChainId=1&destChainId=1';
const QUOTE_URL =
  'https://bridge.api.cx.metamask.io/getQuote?srcChainId=1&destChainId=1';
const HISTORICAL_PRICES_EVM_URL =
  'https://price.api.cx.metamask.io/v3/historical-prices/eip155:1/slip44:60?vsCurrency=usd&timePeriod=1D';
const HISTORICAL_PRICES_SOLANA_URL =
  'https://price.api.cx.metamask.io/v3/historical-prices/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501?vsCurrency=usd&timePeriod=1D';
const SOLANA_RPC_URL = 'https://solana-mainnet.infura.io/v3/test-project';
const USER_STORAGE_URL =
  'https://user-storage.api.cx.metamask.io/api/v1/userstorage/accounts';
const ACCOUNTS_BALANCES_URL =
  'https://accounts.api.cx.metamask.io/v1/accounts/0x0/balances';

const ENV = [
  SWITCH,
  SET_SWITCH,
  KNOWN_ANSWER_QUOTE_DELAY,
  KNOWN_ANSWER_HISTORICAL_PRICES_DELAY,
];

describe('performance-mocks delays', () => {
  afterEach(() => {
    for (const name of ENV) {
      delete process.env[name];
    }
    jest.useRealTimers();
  });

  describe('mockDelayMs', () => {
    it('keeps the fixture delay when the switch is unset or 0', () => {
      expect(mockDelayMs(250)).toBe(250);
      process.env[SWITCH] = '0';
      expect(mockDelayMs(250)).toBe(250);
    });

    it('zeroes the delay when the switch is 1', () => {
      process.env[SWITCH] = '1';
      expect(mockDelayMs(250)).toBe(0);
      expect(mockDelayMs(250, 'auth-api')).toBe(0);
    });

    it('zeroes only the delays in the set the set switch names', () => {
      process.env[SET_SWITCH] = 'user-storage';

      expect(mockDelayMs(500, 'user-storage')).toBe(0);
      expect(mockDelayMs(250, 'auth-api')).toBe(250);
      expect(mockDelayMs(150, 'solana-rpc')).toBe(150);
      expect(mockDelayMs(600)).toBe(600);
    });

    it('keeps every delay when the set switch is unset or empty', () => {
      for (const set of MOCK_DELAY_SETS) {
        expect(mockDelayMs(300, set)).toBe(300);
      }
      process.env[SET_SWITCH] = '';
      expect(getZeroedMockDelaySet()).toBeUndefined();
      expect(mockDelayMs(300, 'auth-api')).toBe(300);
    });

    it('rejects a set name the code does not define', () => {
      process.env[SET_SWITCH] = 'price-api';

      expect(() => getZeroedMockDelaySet()).toThrow(
        `${SET_SWITCH} must be one of auth-api, user-storage, solana-rpc, got "price-api"`,
      );
      expect(() => mockDelayMs(300)).toThrow(SET_SWITCH);
    });
  });

  describe('mockAuthAPICall', () => {
    async function registered(delayMs: number) {
      const { server, handler } = fakeServer();
      await mockAuthAPICall(
        server,
        { url: /nonce/u, requestMethod: 'GET', response: () => ({ ok: true }) },
        delayMs,
      );
      return handler();
    }

    it('waits the fixture delay before responding when the switch is unset', async () => {
      jest.useFakeTimers();
      const handler = await registered(250);
      let response: unknown;

      const pending = handler(request).then((value) => {
        response = value;
      });
      await jest.advanceTimersByTimeAsync(249);
      expect(response).toBeUndefined();
      await jest.advanceTimersByTimeAsync(1);
      await pending;

      expect(response).toStrictEqual({ statusCode: 200, json: { ok: true } });
    });

    it('responds without waiting when the switch is 1', async () => {
      jest.useFakeTimers();
      process.env[SWITCH] = '1';
      const handler = await registered(250);

      const response = await handler(request);

      expect(response).toStrictEqual({ statusCode: 200, json: { ok: true } });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('responds without waiting when the auth-api set is zeroed', async () => {
      jest.useFakeTimers();
      process.env[SET_SWITCH] = 'auth-api';
      const handler = await registered(250);

      const response = await handler(request);

      expect(response).toStrictEqual({ statusCode: 200, json: { ok: true } });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('waits the fixture delay when another set is zeroed', async () => {
      jest.useFakeTimers();
      process.env[SET_SWITCH] = 'user-storage';
      const handler = await registered(250);

      expect(await timed(handler, request)).toStrictEqual({
        elapsedMs: 250,
        response: { statusCode: 200, json: { ok: true } },
      });
    });

    it('fails at registration on an unknown set name', async () => {
      process.env[SET_SWITCH] = 'auth';

      await expect(registered(250)).rejects.toThrow(SET_SWITCH);
    });
  });
});

describe('mockBenchmarkEndpoints', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    for (const name of ENV) {
      delete process.env[name];
    }
    jest.useRealTimers();
  });

  describe('every fixture delay', () => {
    it('sums to the written values, with the quote responses at 2000 ms', async () => {
      const delays = await everyDelay(await registeredRules());

      // 77 delay sites totalling 26,550 ms, as the `mockDelayMs` comment
      // says, plus the two quote responses at 2000 ms.
      expect(delays.filter((delayMs) => delayMs > 0)).toHaveLength(79);
      expect(sum(delays)).toBe(26550 + 2 * 2000);
    });

    it('is zero with BENCHMARK_ZERO_MOCK_DELAYS=1', async () => {
      process.env[SWITCH] = '1';

      const delays = await everyDelay(await registeredRules());

      expect(delays.filter((delayMs) => delayMs > 0)).toStrictEqual([]);
    });

    // @ts-expect-error '.each' is missing from type definitions
    it.each([
      ['auth-api', 3, 800],
      ['user-storage', 2, 1000],
      ['solana-rpc', 9, 1900],
    ])(
      'with the %s set zeroed, only that set changes: %i delays, %i ms',
      async (set: string, changedCount: number, changedMs: number) => {
        const written = await everyDelay(await registeredRules());
        process.env[SET_SWITCH] = set;

        const zeroed = await everyDelay(await registeredRules());

        const changed = written.filter(
          (delayMs, index) => zeroed[index] !== delayMs,
        );
        expect(changed).toHaveLength(changedCount);
        expect(sum(changed)).toBe(changedMs);
        expect(sum(written) - sum(zeroed)).toBe(changedMs);
      },
    );

    it('fails at registration on an unknown set name', async () => {
      process.env[SET_SWITCH] = 'historical-prices';

      await expect(registeredRules()).rejects.toThrow(SET_SWITCH);
    });
  });

  describe('BENCHMARK_ZERO_MOCK_DELAY_SET', () => {
    it('user-storage zeroes the GET and PUT and leaves the rest', async () => {
      process.env[SET_SWITCH] = 'user-storage';
      const rules = await registeredRules();

      expect((await respond(rules, 'GET', USER_STORAGE_URL)).elapsedMs).toBe(0);
      expect((await respond(rules, 'PUT', USER_STORAGE_URL)).elapsedMs).toBe(0);
      expect(
        (await respond(rules, 'GET', ACCOUNTS_BALANCES_URL)).elapsedMs,
      ).toBe(550);
    });

    it('solana-rpc zeroes the Solana RPC responses and leaves the rest', async () => {
      process.env[SET_SWITCH] = 'solana-rpc';
      const rules = await registeredRules();

      for (const method of ['getBalance', 'getLatestBlockhash', 'getSlot']) {
        const { elapsedMs } = await respond(rules, 'POST', SOLANA_RPC_URL, {
          id: '1',
          method,
        });
        expect(elapsedMs).toBe(0);
      }
      expect((await respond(rules, 'GET', USER_STORAGE_URL)).elapsedMs).toBe(
        500,
      );
    });
  });

  describe('quote responses', () => {
    // @ts-expect-error '.each' is missing from type definitions
    it.each([
      ['getQuoteStream', QUOTE_STREAM_URL],
      ['getQuote', QUOTE_URL],
    ])(
      '%s waits the fixed 2000 ms by default',
      async (_name: string, url: string) => {
        const rules = await registeredRules();

        expect((await respond(rules, 'GET', url)).elapsedMs).toBe(2000);
      },
    );

    // @ts-expect-error '.each' is missing from type definitions
    it.each([
      ['getQuoteStream', QUOTE_STREAM_URL],
      ['getQuote', QUOTE_URL],
    ])(
      '%s adds the known-answer delay to the fixed delay',
      async (_name: string, url: string) => {
        process.env[KNOWN_ANSWER_QUOTE_DELAY] = '300';
        const rules = await registeredRules();

        expect((await respond(rules, 'GET', url)).elapsedMs).toBe(2300);
      },
    );

    // @ts-expect-error '.each' is missing from type definitions
    it.each([
      ['getQuoteStream', QUOTE_STREAM_URL],
      ['getQuote', QUOTE_URL],
    ])(
      '%s keeps the known-answer delay with BENCHMARK_ZERO_MOCK_DELAYS=1',
      async (_name: string, url: string) => {
        process.env[SWITCH] = '1';
        process.env[KNOWN_ANSWER_QUOTE_DELAY] = '300';
        const rules = await registeredRules();

        const { elapsedMs, response } = await respond(rules, 'GET', url);

        expect(elapsedMs).toBe(300);
        expect(response).toMatchObject({ statusCode: 200 });
      },
    );
  });

  describe('historical prices', () => {
    // @ts-expect-error '.each' is missing from type definitions
    it.each([
      ['an EVM asset', HISTORICAL_PRICES_EVM_URL],
      ['a Solana asset', HISTORICAL_PRICES_SOLANA_URL],
    ])(
      'answers the v3 URL the price chart requests for %s with prices, after 600 ms',
      async (_asset: string, url: string) => {
        const rules = await registeredRules();

        const { elapsedMs, response } = await respond(rules, 'GET', url);

        expect(elapsedMs).toBe(600);
        const { statusCode, json } = response as {
          statusCode: number;
          json: { prices: unknown[] };
        };
        expect(statusCode).toBe(200);
        expect(json.prices.length).toBeGreaterThan(0);
        for (const point of json.prices) {
          expect(point).toStrictEqual([expect.any(Number), expect.any(Number)]);
        }
      },
    );

    it('keeps the v1 chains and networks patterns', async () => {
      const rules = await registeredRules();

      for (const url of [
        'https://price.api.cx.metamask.io/v1/chains/1/historical-prices/0x0000000000000000000000000000000000000000',
        'https://price.api.cx.metamask.io/v1/networks/1/historical-prices',
      ]) {
        const { elapsedMs, response } = await respond(rules, 'GET', url);
        expect(elapsedMs).toBe(600);
        expect(response).toMatchObject({ statusCode: 200 });
      }
    });

    it('matches no historical-prices path the app does not call', async () => {
      const rules = await registeredRules();

      for (const url of [
        'https://price.api.cx.metamask.io/v1/historical-prices/ethereum',
        'https://price.api.cx.metamask.io/v3/historical-prices/eip155:1',
      ]) {
        expect(resolve(rules, 'GET', url)).toBeUndefined();
      }
    });

    it('adds the known-answer delay to the fixed delay', async () => {
      process.env[KNOWN_ANSWER_HISTORICAL_PRICES_DELAY] = '300';
      const rules = await registeredRules();

      expect(
        (await respond(rules, 'GET', HISTORICAL_PRICES_EVM_URL)).elapsedMs,
      ).toBe(900);
    });

    it('keeps the known-answer delay with BENCHMARK_ZERO_MOCK_DELAYS=1', async () => {
      process.env[SWITCH] = '1';
      process.env[KNOWN_ANSWER_HISTORICAL_PRICES_DELAY] = '300';
      const rules = await registeredRules();

      for (const url of [
        HISTORICAL_PRICES_EVM_URL,
        HISTORICAL_PRICES_SOLANA_URL,
      ]) {
        const { elapsedMs, response } = await respond(rules, 'GET', url);
        expect(elapsedMs).toBe(300);
        expect(response).toMatchObject({ statusCode: 200 });
      }
    });

    it('responds at once with the delays zeroed and the lever unset', async () => {
      process.env[SWITCH] = '1';
      const rules = await registeredRules();

      expect(
        (await respond(rules, 'GET', HISTORICAL_PRICES_SOLANA_URL)).elapsedMs,
      ).toBe(0);
    });
  });
});
