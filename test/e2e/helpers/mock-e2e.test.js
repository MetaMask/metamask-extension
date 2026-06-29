/* eslint-env jest */

import { setupMocking } from '../mock-e2e';

const MOCK_INFURA_PROJECT_ID = '0123456789abcdef0123456789abcdef';
const BITCOIN_SCRIPTHASH = 'a'.repeat(64);

/**
 * Creates a minimal Mockttp-like test double for exercising `setupMocking`.
 *
 * The stub records registered rules and supports the chained matcher/handler
 * methods used by `mock-e2e.js`, so tests can assert on the default handlers
 * without starting a real mock server. Any unrecognized chained method is
 * recorded and returns the proxy again, which mirrors Mockttp's fluent setup
 * style while keeping unexpected calls observable through `rule.calls`.
 *
 * @returns {object} A proxy exposing `for*` methods and a collected `rules` array for inspection.
 */
function createMockServerStub() {
  const rules = [];

  /**
   * Creates a single recorded mock rule and returns a fluent chain proxy.
   *
   * @param {string} kind - The registration method name, such as `forGet`.
   * @param {unknown} matcher - The matcher passed to the registration method.
   * @returns {object} A proxy supporting chained Mockttp-style setup calls.
   */
  const createRule = (kind, matcher) => {
    const rule = { kind, matcher, calls: [] };
    rules.push(rule);

    const chain = new Proxy(
      {},
      {
        get: (_, prop) => {
          if (prop === 'thenCallback') {
            return (callback) => {
              rule.callback = callback;
              return Promise.resolve(rule);
            };
          }

          if (prop === 'thenJson') {
            return (statusCode, json) => {
              rule.callback = () => ({ statusCode, json });
              return Promise.resolve(rule);
            };
          }

          if (prop === 'thenPassThrough') {
            return (config) => {
              rule.passThrough = config;
              return Promise.resolve(rule);
            };
          }

          if (prop === 'thenForwardTo') {
            return (target) => {
              rule.forwardTarget = target;
              return Promise.resolve(rule);
            };
          }

          return (...args) => {
            rule.calls.push({ prop, args });
            return chain;
          };
        },
      },
    );

    return chain;
  };

  return new Proxy(
    { rules },
    {
      get: (target, prop) => {
        if (prop === 'rules') {
          return target.rules;
        }

        if (typeof prop === 'string' && prop.startsWith('for')) {
          return (matcher) => createRule(prop, matcher);
        }

        if (prop === 'on') {
          return () => undefined;
        }

        return target[prop];
      },
    },
  );
}

/**
 * Finds a previously registered mock rule matching the given kind and predicate.
 *
 * @param {object} server - The mock
 * server stub that collected the rules.
 * @param {string} kind - The registration kind, such as `forGet` or `forPost`.
 * @param {(matcher: unknown, rule: {kind: string, matcher: unknown}) => boolean} predicate
 * - Returns true when the rule matches the expectation under test.
 * @returns {object | undefined} The first matching rule.
 */
function findRule(server, kind, predicate) {
  return server.rules.find(
    (rule) => rule.kind === kind && predicate(rule.matcher, rule),
  );
}

describe('setupMocking', () => {
  it('registers Bitcoin discovery mocks that return valid empty-scan responses', async () => {
    const server = createMockServerStub();

    await setupMocking(server, async () => [], { chainId: '0x1' });

    const blocksRule = findRule(
      server,
      'forGet',
      (matcher) =>
        matcher instanceof RegExp &&
        matcher.test(
          `https://bitcoin-mainnet.infura.io/v3/${MOCK_INFURA_PROJECT_ID}/esplora/blocks`,
        ),
    );
    const tipHeightRule = findRule(
      server,
      'forGet',
      (matcher) =>
        matcher instanceof RegExp &&
        matcher.test(
          `https://bitcoin-mainnet.infura.io/v3/${MOCK_INFURA_PROJECT_ID}/esplora/blocks/tip/height`,
        ),
    );
    const txsRule = findRule(
      server,
      'forGet',
      (matcher) =>
        matcher instanceof RegExp &&
        matcher.test(
          `https://bitcoin-mainnet.infura.io/v3/${MOCK_INFURA_PROJECT_ID}/esplora/scripthash/${BITCOIN_SCRIPTHASH}/txs`,
        ),
    );
    const feeEstimatesRule = findRule(
      server,
      'forGet',
      (matcher) =>
        matcher instanceof RegExp &&
        matcher.test(
          `https://bitcoin-mainnet.infura.io/v3/${MOCK_INFURA_PROJECT_ID}/esplora/fee-estimates`,
        ),
    );

    expect(blocksRule).toBeDefined();
    expect(tipHeightRule).toBeDefined();
    expect(txsRule).toBeDefined();
    expect(feeEstimatesRule).toBeDefined();
    expect(blocksRule.calls).toContainEqual({ prop: 'always', args: [] });
    expect(tipHeightRule.calls).toContainEqual({ prop: 'always', args: [] });
    expect(txsRule.calls).toContainEqual({ prop: 'always', args: [] });
    expect(feeEstimatesRule.calls).toContainEqual({ prop: 'always', args: [] });

    expect(blocksRule.callback()).toMatchObject({
      statusCode: 200,
      json: [
        expect.objectContaining({
          id: '00000000000000000001d3a19bc9dbde9d1d26b25aa49269b575282bb6d74409',
          height: 932936,
          timestamp: 1768825157,
          merkle_root:
            '68b04e69caac6a24c585e8a357fd9a5de8b084bda8b043690efaafcd11343c2a',
        }),
      ],
    });
    expect(tipHeightRule.callback()).toEqual({
      statusCode: 200,
      body: '932936',
    });
    expect(txsRule.callback()).toEqual({
      statusCode: 200,
      json: [],
    });
    expect(feeEstimatesRule.callback()).toEqual({
      statusCode: 200,
      json: {
        1: 1,
        2: 1,
        3: 1,
        6: 1,
        144: 1,
      },
    });
  });

  it('registers a Solana discovery mock that returns an empty signature list', async () => {
    const server = createMockServerStub();

    await setupMocking(server, async () => [], { chainId: '0x1' });

    const solanaRule = findRule(
      server,
      'forPost',
      (matcher, rule) =>
        matcher instanceof RegExp &&
        matcher.test('https://solana-mainnet.infura.io/v3/test-project-id') &&
        matcher.test('https://solana-devnet.infura.io/v3/test-project-id') &&
        rule.calls.some(
          ({ prop, args }) =>
            prop === 'withBodyIncluding' &&
            args[0] === 'getSignaturesForAddress',
        ),
    );

    expect(solanaRule).toBeDefined();
    expect(solanaRule.calls).toContainEqual({ prop: 'always', args: [] });
    expect(solanaRule.callback()).toEqual({
      statusCode: 200,
      json: {
        id: '1337',
        jsonrpc: '2.0',
        result: [],
      },
    });
  });
});
