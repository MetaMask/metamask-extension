import {
  checkContractMocks,
  checkContractsLive,
  ExitCode,
  formatReportMarkdown,
  getExitCode,
  groupMismatches,
} from './contract-checker';
import type { ConsumerTypeValidator } from './type-validator';
import type { ApiContract } from './types';

/**
 * Stand-in for the TypeScript-backed validator: a value matches when it is an
 * object whose `price` is a number.
 */
const priceValidator: ConsumerTypeValidator = {
  typeNames: ['priceApiV3SpotPrices'],
  describeType: () => 'Record<string, { price: number }>',
  validate: (_typeName, value) =>
    Object.entries(value as Record<string, { price: unknown }>).flatMap(
      ([key, entry]) =>
        typeof entry.price === 'number'
          ? []
          : [
              {
                path: `$["${key}"].price`,
                message: `expected number, received ${JSON.stringify(entry.price)}`,
              },
            ],
    ),
};

const buildContract = (overrides: Partial<ApiContract> = {}): ApiContract => ({
  id: 'price-api-v3-spot-prices',
  endpoint: 'GET https://price.api.cx.metamask.io/v3/spot-prices',
  consumerType: 'priceApiV3SpotPrices',
  consumedBy: 'test',
  mocks: [
    {
      name: 'eth',
      source: 'test/e2e/mock-response-data/price-api.ts',
      response: { 'eip155:1/slip44:60': { price: 3010 } },
    },
  ],
  live: {
    description: 'GET https://price.api.cx.metamask.io/v3/spot-prices',
    buildRequest: () => ({
      url: 'https://price.api.cx.metamask.io/v3/spot-prices',
    }),
  },
  shape: { wildcardKeyPaths: ['$'] },
  ...overrides,
});

const respondWith = (body: unknown, status = 200) =>
  jest.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;

describe('groupMismatches', () => {
  it('groups mismatches that share a normalized path', () => {
    expect(
      groupMismatches([
        { path: '$[0].states[0].supported', message: 'expected object' },
        { path: '$[0].states[1].supported', message: 'expected object' },
        { path: '$[1].name', message: 'expected string' },
      ]),
    ).toStrictEqual([
      {
        path: '$[*].states[*].supported',
        message: 'expected object',
        example: '$[0].states[0].supported',
        occurrences: 2,
      },
      {
        path: '$[*].name',
        message: 'expected string',
        example: '$[1].name',
        occurrences: 1,
      },
    ]);
  });
});

describe('checkContractMocks', () => {
  it('passes when every mock matches its consumer type', () => {
    const report = checkContractMocks({
      contracts: [buildContract()],
      validator: priceValidator,
    });

    expect(report.summary.invalidMocks).toBe(0);
    expect(getExitCode(report)).toBe(ExitCode.Ok);
  });

  it('reports drift when a mock does not match its consumer type', () => {
    const report = checkContractMocks({
      contracts: [
        buildContract({
          mocks: [
            {
              name: 'stale',
              source: 'test/e2e/mock-e2e.js',
              response: { 'eip155:1/slip44:60': { price: '3010' } },
            },
          ],
        }),
      ],
      validator: priceValidator,
    });

    expect(report.contracts[0].mocks[0].mismatches).toStrictEqual([
      {
        path: '$.*.price',
        message: 'expected number, received "3010"',
        example: '$["eip155:1/slip44:60"].price',
        occurrences: 1,
      },
    ]);
    expect(getExitCode(report)).toBe(ExitCode.Drift);
    expect(formatReportMarkdown(report)).toContain('❌ mock `stale`');
  });
});

describe('checkContractsLive', () => {
  it('passes when the live response matches the consumer type', async () => {
    const report = await checkContractsLive({
      contracts: [buildContract()],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({ 'eip155:1/slip44:60': { price: 2130.5 } }),
    });

    expect(report.contracts[0].live).toMatchObject({
      status: 'checked',
      mismatches: [],
    });
    expect(getExitCode(report)).toBe(ExitCode.Ok);
  });

  it('reports drift when the live response does not match the consumer type', async () => {
    const report = await checkContractsLive({
      contracts: [buildContract()],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({ 'eip155:1/slip44:60': { price: null } }),
    });

    expect(report.summary.liveTypeDrift).toBe(1);
    expect(getExitCode(report)).toBe(ExitCode.Drift);
  });

  it('does not fail on accepted live mismatches but keeps them in the report', async () => {
    const report = await checkContractsLive({
      contracts: [
        buildContract({
          acceptedLiveMismatches: [
            { path: '$.*.price', reason: 'Tracked in TEST-1' },
          ],
        }),
      ],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({ 'eip155:1/slip44:60': { price: null } }),
    });

    expect(report.contracts[0].live).toMatchObject({
      status: 'checked',
      mismatches: [],
      acceptedMismatches: [{ path: '$.*.price', reason: 'Tracked in TEST-1' }],
    });
    expect(getExitCode(report)).toBe(ExitCode.Ok);
    expect(formatReportMarkdown(report)).toContain('Tracked in TEST-1');
  });

  it('reports mock coverage gaps without failing unless strict', async () => {
    const report = await checkContractsLive({
      contracts: [buildContract()],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({
        'eip155:1/slip44:60': { price: 2130.2485466970497 },
      }),
    });

    expect(report.contracts[0].live).toMatchObject({
      status: 'checked',
      shapeDiff: { uncoveredHighPrecision: ['$.*.price'] },
    });
    expect(getExitCode(report)).toBe(ExitCode.Ok);
    expect(getExitCode(report, true)).toBe(ExitCode.Drift);
  });

  it('reports an error when the live request fails', async () => {
    const report = await checkContractsLive({
      contracts: [buildContract()],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({}, 503),
    });

    expect(report.contracts[0].live).toMatchObject({
      status: 'error',
      error: 'HTTP 503 Service Unavailable',
    });
    expect(getExitCode(report)).toBe(ExitCode.Failure);
  });

  it('skips contracts whose required environment variables are missing', async () => {
    const fetchImpl = respondWith({});
    const report = await checkContractsLive({
      contracts: [
        buildContract({
          live: {
            description: 'GET https://cdn.contentful.com/…',
            requiredEnv: ['CONTENTFUL_ACCESS_TOKEN'],
            buildRequest: () => ({ url: 'https://cdn.contentful.com/' }),
          },
        }),
      ],
      validator: priceValidator,
      env: {},
      fetchImpl,
    });

    expect(report.contracts[0].live).toMatchObject({
      status: 'skipped',
      reason: 'Missing environment variables: CONTENTFUL_ACCESS_TOKEN',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(getExitCode(report)).toBe(ExitCode.Ok);
  });

  it('skips contracts without a queryable live API', async () => {
    const report = await checkContractsLive({
      contracts: [
        buildContract({ live: { unavailableReason: 'Requires auth' } }),
      ],
      validator: priceValidator,
      env: {},
      fetchImpl: respondWith({}),
    });

    expect(report.contracts[0].live).toStrictEqual({
      status: 'skipped',
      reason: 'Requires auth',
    });
  });
});
