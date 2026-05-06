/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck Vitest hoisted mocks and dynamic entry imports are runtime-only here.
const mockModules = vi.hoisted(() => ({
  artifacts: {
    buildArtifactsBody: vi.fn(),
    getArtifactLinks: vi.fn(),
  },
  bundleSize: {
    buildBundleSizeDiffSection: vi.fn(),
  },
  perf: {
    buildPerformanceBenchmarksSection: vi.fn(),
  },
  testPlan: {
    buildTestPlanSection: vi.fn(),
  },
  utils: {
    buildSectionWithFallback: vi.fn(),
    postCommentWithMetamaskBot: vi.fn(),
  },
}));

jest.mock('./artifacts', () => mockModules.artifacts);
jest.mock('./bundle-size', () => mockModules.bundleSize);
jest.mock('./performance-benchmarks', () => mockModules.perf);
jest.mock('./test-plan', () => mockModules.testPlan);
jest.mock('./utils', () => mockModules.utils);

const BASE_ENV: Record<string, string> = {
  PR_COMMENT_TOKEN: 'token',
  OWNER: 'MetaMask',
  REPOSITORY: 'metamask-extension',
  RUN_ID: '99',
  PR_NUMBER: '42',
  HEAD_COMMIT_HASH: 'abc1234567',
  MERGE_BASE_COMMIT_HASH: 'def7654321',
  HOST_URL: 'https://ci.example.com',
  BUILDS_FROM_SHA: 'abc1234567',
  BUILDS_FROM_RUN: '99',
};

function setEnv(overrides: Record<string, string | undefined> = {}): void {
  for (const key of [...Object.keys(BASE_ENV), 'TEST_PLAN_VERSION']) {
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
  return mockModules;
}

function configureMocks(): void {
  const { artifacts, bundleSize, perf, testPlan, utils } = getMocks();

  artifacts.getArtifactLinks.mockReturnValue({
    link: () => '<a href="#">link</a>',
    bundleSizeStats: { url: 'https://ci/bundle.json', label: 'bundle' },
    bundleSizeData: { url: 'https://ci/data.json', label: 'data' },
    interactionStats: { url: 'https://ci/inter.json', label: 'inter' },
    storybook: { url: 'https://ci/storybook', label: 'Storybook' },
    tsMigrationDashboard: { url: 'https://ci/ts', label: 'TS' },
    bundleAnalyzer: {
      url: 'https://ci/bundle-analyzer/report.html',
      label: 'Bundle Analyzer',
    },
    allArtifacts: { url: 'https://ci/all', label: 'All' },
  });
  artifacts.buildArtifactsBody.mockReturnValue('<p>artifacts</p>');
  perf.buildPerformanceBenchmarksSection.mockResolvedValue('<p>perf</p>');
  bundleSize.buildBundleSizeDiffSection.mockResolvedValue('<p>bundle</p>');
  testPlan.buildTestPlanSection.mockResolvedValue(
    '<p>AI generated test plan test-plan-99.0.0.json</p>',
  );
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
    jest.clearAllMocks();
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

    await import('.');
    await flushPromises();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No pull request detected'),
    );
    expect(getMocks().utils.postCommentWithMetamaskBot).not.toHaveBeenCalled();
  });

  it('invokes console.error when required env vars are missing', async () => {
    setEnv({ HOST_URL: undefined });

    await import('.');
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

    await import('.');
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

  it('includes test plan link when TEST_PLAN_VERSION is set', async () => {
    setEnv({ TEST_PLAN_VERSION: '99.0.0' });

    await import('.');
    await flushPromises();

    const { commentBody } =
      getMocks().utils.postCommentWithMetamaskBot.mock.calls[0][0];
    expect(commentBody).toContain('AI generated test plan');
    expect(commentBody).toContain('test-plan-99.0.0.json');
  });

  it('does not include test plan link when TEST_PLAN_VERSION is not set', async () => {
    setEnv();

    await import('.');
    await flushPromises();

    const { commentBody } =
      getMocks().utils.postCommentWithMetamaskBot.mock.calls[0][0];
    expect(commentBody).not.toContain('AI generated test plan');
  });

  it('falls back to HEAD_COMMIT_HASH when BUILDS_FROM_SHA is empty string', async () => {
    setEnv({ BUILDS_FROM_SHA: '' });

    await import('.');
    await flushPromises();

    const { artifacts } = getMocks();
    expect(artifacts.buildArtifactsBody).toHaveBeenCalledWith(
      expect.objectContaining({
        buildsFromSha: 'abc1234',
      }),
    );
  });

  it('falls back to HEAD_COMMIT_HASH when BUILDS_FROM_SHA is not set', async () => {
    setEnv({ BUILDS_FROM_SHA: undefined });

    await import('.');
    await flushPromises();

    const { artifacts } = getMocks();
    expect(artifacts.buildArtifactsBody).toHaveBeenCalledWith(
      expect.objectContaining({
        buildsFromSha: 'abc1234',
      }),
    );
  });

  it('falls back to RUN_ID when BUILDS_FROM_RUN is not set', async () => {
    setEnv({ BUILDS_FROM_RUN: undefined });

    await import('.');
    await flushPromises();

    const { artifacts } = getMocks();
    expect(artifacts.getArtifactLinks).toHaveBeenCalledWith(
      'https://ci.example.com',
      'MetaMask',
      'metamask-extension',
      '99',
    );
  });

  it('uses BUILDS_FROM_RUN for artifact links when set', async () => {
    setEnv({ BUILDS_FROM_RUN: '55' });

    await import('.');
    await flushPromises();

    const { artifacts } = getMocks();
    expect(artifacts.getArtifactLinks).toHaveBeenCalledWith(
      'https://ci.example.com',
      'MetaMask',
      'metamask-extension',
      '55',
    );
  });
});
