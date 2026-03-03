/**
 * Tests for index.ts (the `start()` entry point).
 *
 * `start()` is immediately invoked when the module is loaded. Each test:
 * 1. Sets the required environment variables.
 * 2. Calls `jest.resetModules()` so the module loads fresh.
 * 3. Requires (dynamically) `./index` which triggers `start()`.
 * 4. Flushes the microtask queue so `start()` has time to finish.
 * 5. Asserts via the stable jest.mock references.
 */

jest.mock('./artifacts');
jest.mock('./bundle-size');
jest.mock('./dapp-benchmarks');
jest.mock('./performance-benchmarks');
jest.mock('./utils');

const BASE_ENV: Record<string, string> = {
  PR_COMMENT_TOKEN: 'token',
  OWNER: 'MetaMask',
  REPOSITORY: 'metamask-extension',
  RUN_ID: '99',
  PR_NUMBER: '42',
  HEAD_COMMIT_HASH: 'abc1234567',
  MERGE_BASE_COMMIT_HASH: 'def7654321',
  HOST_URL: 'https://ci.example.com',
  LAVAMOAT_POLICY_CHANGED: 'false',
  POST_NEW_BUILDS: 'false',
};

function setEnv(overrides: Record<string, string | undefined> = {}): void {
  for (const key of Object.keys(BASE_ENV)) {
    delete process.env[key];
  }
  for (const [k, v] of Object.entries({ ...BASE_ENV, ...overrides })) {
    if (v !== undefined) {
      process.env[k] = v;
    }
  }
}

/** Drain the microtask + macrotask queue to let `start()` finish. */
async function flushPromises(): Promise<void> {
  // Several passes to let chained promises resolve
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMocks(): Record<string, any> {
  return {
    artifacts: jest.requireMock('./artifacts'),
    bundleSize: jest.requireMock('./bundle-size'),
    dapp: jest.requireMock('./dapp-benchmarks'),
    perf: jest.requireMock('./performance-benchmarks'),
    utils: jest.requireMock('./utils'),
  };
}

function configureMocks(): void {
  const { artifacts, bundleSize, dapp, perf, utils } = getMocks();

  artifacts.getArtifactLinks.mockReturnValue({
    link: () => '<a href="#">link</a>',
    bundleSizeStats: { url: 'https://ci/bundle.json', label: 'bundle' },
    bundleSizeData: { url: 'https://ci/data.json', label: 'data' },
    interactionStats: { url: 'https://ci/inter.json', label: 'inter' },
    storybook: { url: 'https://ci/storybook', label: 'Storybook' },
    tsMigrationDashboard: { url: 'https://ci/ts', label: 'TS' },
    depViz: { url: 'https://ci/dep', label: 'dep' },
    allArtifacts: { url: 'https://ci/all', label: 'All' },
  });
  artifacts.buildArtifactsBody.mockResolvedValue('<p>artifacts</p>');
  perf.buildPerformanceBenchmarksSection.mockResolvedValue('<p>perf</p>');
  dapp.getDappBenchmarkComment.mockResolvedValue('<p>dapp</p>');
  bundleSize.buildBundleSizeDiffSection.mockResolvedValue('<p>bundle</p>');
  utils.buildSectionWithFallback.mockImplementation(
    (fn: () => Promise<string | null | undefined>) =>
      fn().then((r: string | null | undefined) => r ?? ''),
  );
  utils.postCommentWithMetamaskBot.mockResolvedValue(null);
}

describe('start() entry point', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    configureMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (const key of Object.keys(BASE_ENV)) {
      delete process.env[key];
    }
  });

  it('logs a warning and returns early when PR_NUMBER is not set', async () => {
    setEnv({ PR_NUMBER: undefined });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No pull request detected'),
    );
    expect(getMocks().utils.postCommentWithMetamaskBot).not.toHaveBeenCalled();
  });

  it('invokes console.error when required env vars are missing', async () => {
    setEnv({ HOST_URL: undefined });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          'Missing required environment variables',
        ),
      }),
    );
  });

  it('calls postCommentWithMetamaskBot with assembled comment body', async () => {
    setEnv();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    expect(getMocks().utils.postCommentWithMetamaskBot).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'MetaMask',
        repository: 'metamask-extension',
        prNumber: '42',
        commentToken: 'token',
        commentBody: expect.stringContaining('<p>artifacts</p>'),
      }),
    );
  });
});
