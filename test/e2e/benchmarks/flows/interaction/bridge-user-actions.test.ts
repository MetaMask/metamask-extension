/**
 * Order and mock checks for the bridge flow. The browser, page objects and
 * timers are recorders that append to `mockEvents`.
 */

import type { Mockttp } from 'mockttp';
import bridgeTokensPopular from '../../mocks/bridge-tokens-popular.json';
import type { BenchmarkRunResult } from '../../utils/types';

const mockEvents: string[] = [];
const mockFixtureOptions: Record<string, unknown>[] = [];

/**
 * A selector, or the page-object field holding it, as the recorder logs it.
 * @param locator - What the flow handed the driver.
 * @returns A short name for it.
 */
function mockLocatorName(locator: unknown): string {
  if (locator === undefined || typeof locator === 'string') {
    return String(locator ?? '');
  }
  const { css, text } = locator as { css?: string; text?: string };
  return text === undefined ? String(css) : `${css}:${text}`;
}

jest.mock('selenium-webdriver', () => ({
  Key: { chord: (...keys: string[]) => keys.join('') },
}));
jest.mock('../../../webdriver/driver', () => ({}));
jest.mock('../../../helpers', () => ({
  withFixtures: jest.fn(
    async (
      options: Record<string, unknown>,
      callback: (args: unknown) => Promise<void>,
    ): Promise<void> => {
      mockFixtureOptions.push(options);
      const element = {
        getAttribute: async () => '',
        sendKeys: async () => undefined,
      };
      await callback({
        driver: new Proxy(
          {},
          {
            get: (_target, prop) => async (locator: unknown) => {
              mockEvents.push(
                `driver.${String(prop)}:${mockLocatorName(locator)}`,
              );
              return prop === 'findElement' ? element : undefined;
            },
          },
        ),
        mockServer: {},
      });
    },
  ),
}));
jest.mock('../../../fixtures/fixture-builder-v2', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    withEnabledNetworks: () => ({ build: () => ({}) }),
  })),
}));
jest.mock('../../../page-objects/flows/login.flow', () => ({
  login: jest.fn(async () => {
    mockEvents.push('login');
  }),
}));
jest.mock('../../../page-objects/pages/bridge/quote-page', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sourceAssetPickerButton: 'sourceAssetPickerButton',
    assetPrickerSearchInput: 'assetPickerSearchInput',
    tokenButton: 'tokenButton',
  })),
}));
jest.mock('../../../page-objects/pages/swap/swap-page', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkPageIsLoaded: async () => {
      mockEvents.push('SwapPage.checkPageIsLoaded');
    },
  })),
}));
jest.mock('../../../tests/bridge/constants', () => ({
  DEFAULT_BRIDGE_FEATURE_FLAGS: {},
  MOCK_TOKENS_ETHEREUM: [
    { symbol: 'FXS', address: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0' },
  ],
}));
jest.mock('../../utils/long-task-helper', () => ({
  buildLongTaskTimerResults: jest.fn(() => []),
  legacyStepTimerId: (id: string) => `${id}Legacy`,
}));
jest.mock('../../utils/in-page-step-timer', () => ({
  IN_PAGE_DESTINATIONS: new Proxy({}, { get: (_target, prop) => [prop] }),
  startInPageStep: jest.fn(async (_driver: unknown, id: string) => {
    mockEvents.push(`probe:${id}`);
    return true;
  }),
  finishInPageStep: jest.fn(async (_driver: unknown, id: string) => {
    mockEvents.push(`read:${id}`);
    return [{ id, value: 1, unit: 'ms' }];
  }),
  logRequestsWithinInPageSteps: jest.fn(async () => {
    mockEvents.push('requestLog');
  }),
}));
jest.mock('../../utils/sidepanel-onboarding', () => ({
  waitForPageIdleBeforeStep: jest.fn(async () => {
    mockEvents.push('pageIdle');
  }),
}));
jest.mock('../../utils', () => ({
  collectWebVitals: jest.fn(async () => undefined),
  runUserActionBenchmark: jest.fn(
    async (
      measure: () => Promise<{ timers: unknown[]; webVitals: unknown }>,
    ) => {
      try {
        return { ...(await measure()), success: true };
      } catch (error) {
        return { timers: [], success: false, error: String(error) };
      }
    },
  ),
}));

// Imported after the mocks above, which jest hoists over it.
// eslint-disable-next-line import-x/first
import { resolveFlowIterations } from '../../utils/flow-iterations';
// eslint-disable-next-line import-x/first
import {
  BRIDGE_17_ITERATIONS,
  BRIDGE_POPULAR_TOKENS_MOCK,
  iterations as bridgeIterations,
  run as runBridge,
} from './bridge-user-actions';

/**
 * Where an event was recorded; fails the test when it was not.
 * @param event - The event to find.
 * @returns Its index in `mockEvents`.
 */
function at(event: string): number {
  const index = mockEvents.indexOf(event);
  if (index === -1) {
    throw new Error(`"${event}" was not recorded: ${mockEvents.join(', ')}`);
  }
  return index;
}

type RecordedRule = {
  method: string;
  pattern: RegExp;
  respond: () => Promise<unknown> | unknown;
};

/**
 * A mock server that records the rules registered on it.
 *
 * @returns The server and its rules.
 */
function recordingMockServer() {
  const rules: RecordedRule[] = [];
  const rule = (method: string) => (pattern: RegExp) => ({
    thenCallback: async (respond: RecordedRule['respond']) => {
      rules.push({ method, pattern, respond });
      return { method, pattern };
    },
  });
  const server = {
    forPost: rule('POST'),
    forGet: rule('GET'),
  } as unknown as Mockttp;
  return { server, rules };
}

describe('bridge user actions', () => {
  const original = process.env[BRIDGE_POPULAR_TOKENS_MOCK];

  beforeEach(() => {
    mockEvents.length = 0;
    mockFixtureOptions.length = 0;
  });
  afterEach(() => {
    if (original === undefined) {
      delete process.env[BRIDGE_POPULAR_TOKENS_MOCK];
    } else {
      process.env[BRIDGE_POPULAR_TOKENS_MOCK] = original;
    }
  });

  async function run(): Promise<BenchmarkRunResult> {
    const result = await runBridge();
    expect(result.error).toBeUndefined();
    expect(result.success).toBe(true);
    return result;
  }

  /**
   * Run the flow, then register its test-specific mocks on a recorder.
   *
   * @returns The rules the flow registers.
   */
  async function mockRules(): Promise<RecordedRule[]> {
    await run();
    const { testSpecificMock } = mockFixtureOptions[0] as {
      testSpecificMock: (server: Mockttp) => Promise<unknown>;
    };
    const { server, rules } = recordingMockServer();
    await testSpecificMock(server);
    return rules;
  }

  it('waits for the page to go idle once, after the asset-picker button is clickable and before its probe and click', async () => {
    await run();

    expect(mockEvents.filter((event) => event === 'pageIdle')).toHaveLength(1);
    expect(at('read:bridge_load_page')).toBeLessThan(at('pageIdle'));
    expect(
      at('driver.findClickableElement:sourceAssetPickerButton'),
    ).toBeLessThan(at('pageIdle'));
    expect(at('pageIdle')).toBeLessThan(at('probe:bridge_load_asset_picker'));
    expect(at('pageIdle')).toBeLessThan(
      at('driver.clickElement:sourceAssetPickerButton'),
    );
  });

  it('leaves the popular-token request to the default mocks when the switch is 0', async () => {
    process.env[BRIDGE_POPULAR_TOKENS_MOCK] = '0';

    const rules = await mockRules();

    expect(rules.map((rule) => `${rule.method} ${rule.pattern}`)).toStrictEqual(
      ['POST /getTokens\\/search/u'],
    );
  });

  it('answers the popular-token request with the JSON list the swap flow serves when the switch is unset', async () => {
    delete process.env[BRIDGE_POPULAR_TOKENS_MOCK];

    const rules = await mockRules();

    expect(rules.map((rule) => `${rule.method} ${rule.pattern}`)).toStrictEqual(
      ['POST /getTokens\\/search/u', 'POST /getTokens\\/popular/u'],
    );
    const popular = rules[1];
    expect(
      popular.pattern.test(
        'https://bridge.dev-api.cx.metamask.io/getTokens/popular',
      ),
    ).toBe(true);
    const response = (await popular.respond()) as {
      statusCode: number;
      json: unknown;
    };
    expect(response).toStrictEqual({
      statusCode: 200,
      json: bridgeTokensPopular,
    });
    // A body the app can parse: what the default mocks sent was empty.
    expect(JSON.parse(JSON.stringify(response.json))).toHaveLength(6);
    // The search step's destination is not among them, so it is still absent
    // when the search starts.
    expect(JSON.stringify(response.json)).not.toContain(
      '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
    );
  });
});

describe("bridge user actions' iteration count", () => {
  const original = process.env[BRIDGE_17_ITERATIONS];

  // `restoreMocks` in `jest.config.js` restores the spy after each test.
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => {
    if (original === undefined) {
      delete process.env[BRIDGE_17_ITERATIONS];
    } else {
      process.env[BRIDGE_17_ITERATIONS] = original;
    }
  });

  /**
   * The count `run-benchmark.ts` runs this flow at, under CI's default of 5.
   * @returns The iterations.
   */
  function resolve(): number {
    return resolveFlowIterations(
      'bridge-user-actions',
      { iterations: bridgeIterations },
      { iterations: 5, retries: 2 },
    );
  }

  it("runs the invocation's count, and logs it, when the switch is unset", () => {
    delete process.env[BRIDGE_17_ITERATIONS];

    expect(bridgeIterations()).toBeUndefined();
    expect(resolve()).toBe(5);
    expect(console.log).toHaveBeenCalledWith(
      'Running bridge-user-actions with 5 iterations (retries: 2)',
    );
  });

  it('runs 17 iterations, the warm-up and 16 scored, and logs 17, when the switch is 1', () => {
    process.env[BRIDGE_17_ITERATIONS] = '1';

    expect(resolve()).toBe(17);
    expect(console.log).toHaveBeenCalledWith(
      'Running bridge-user-actions with 17 iterations (retries: 2)',
    );
  });

  // @ts-expect-error '.each' is missing from type definitions
  it.each(['0', '', 'true', '17'])(
    "stays on the invocation's count when the switch is %j",
    (value: string) => {
      process.env[BRIDGE_17_ITERATIONS] = value;

      expect(resolve()).toBe(5);
    },
  );
});
