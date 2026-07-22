jest.mock('./artifacts');
jest.mock('./bundle-size');
jest.mock('./performance-benchmarks');
jest.mock('./utils');
jest.mock('./cherry-picks-section');

const BASE_ENV: Record<string, string> = {
  BUILD_ANNOUNCE_TOKEN: 'token',
  OWNER: 'MetaMask',
  REPOSITORY: 'metamask-extension',
  RUN_ID: '99',
  PR_NUMBER: '42',
  HEAD_COMMIT_HASH: 'abc1234567',
  BUNDLE_SIZE_BASELINE_COMMIT_HASHES: 'def7654321',
  HOST_URL: 'https://ci.example.com',
  BUILDS_FROM_SHA: 'abc1234567',
  BUILDS_FROM_RUN: '99',
};

function setEnv(overrides: Record<string, string | undefined> = {}): void {
  for (const key of [...Object.keys(BASE_ENV), 'TEST_PLAN_VERSION', 'BRANCH']) {
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
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMocks(): Record<string, any> {
  return {
    artifacts: jest.requireMock('./artifacts'),
    bundleSize: jest.requireMock('./bundle-size'),
    perf: jest.requireMock('./performance-benchmarks'),
    utils: jest.requireMock('./utils'),
    cherryPicks: jest.requireMock('./cherry-picks-section'),
  };
}

function configureMocks(): void {
  const { artifacts, bundleSize, perf, utils, cherryPicks } = getMocks();

  cherryPicks.extractWhatsInRc.mockReturnValue({
    cherryPicks: [{ hash: 'abc1234', subject: 'fix: cherry-pick (#123)' }],
    changelog: [{ hash: 'def5678', subject: 'feat: new feature (#456)' }],
    mergeBase: 'base123',
    previousTag: 'v13.32.0',
    changelogFromReleaseBranch: false,
  });
  cherryPicks.buildWhatsInRcSection.mockReturnValue('<p>whats-in-this-rc</p>');
  cherryPicks.buildWhatsInRcFailureSection.mockReturnValue(
    '<p>whats-in-rc-failure</p>',
  );

  artifacts.getArtifactLinks.mockReturnValue({
    link: () => '<a href="#">link</a>',
    bundleSizeStats: { url: 'https://ci/bundle.json', label: 'bundle' },
    bundleSizeDebug: { url: 'https://ci/bundle.debug.json', label: 'debug' },
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
  utils.buildSectionWithFallback.mockImplementation(
    (fn: () => Promise<string | null | undefined>) =>
      fn().then((r: string | null | undefined) => r ?? ''),
  );
  utils.postCommentWithMetamaskBot.mockResolvedValue(null);
}

describe('start() entry point', () => {
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
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

  it('exits with error when required env vars are missing', async () => {
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
    expect(processExitSpy).toHaveBeenCalledWith(1);
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

  it('passes through missing bundle-size baseline hashes', async () => {
    setEnv({ BUNDLE_SIZE_BASELINE_COMMIT_HASHES: undefined });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    expect(
      getMocks().bundleSize.buildBundleSizeDiffSection,
    ).toHaveBeenCalledWith(expect.any(Object), undefined);
    expect(getMocks().utils.postCommentWithMetamaskBot).toHaveBeenCalled();
  });

  it('includes test plan link when TEST_PLAN_VERSION is set', async () => {
    setEnv({ TEST_PLAN_VERSION: '99.0.0' });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    const { commentBody } =
      getMocks().utils.postCommentWithMetamaskBot.mock.calls[0][0];
    expect(commentBody).toContain('AI generated test plan');
    expect(commentBody).toContain('test-plan-99.0.0.json');
  });

  it('does not include test plan link when TEST_PLAN_VERSION is not set', async () => {
    setEnv();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    const { commentBody } =
      getMocks().utils.postCommentWithMetamaskBot.mock.calls[0][0];
    expect(commentBody).not.toContain('AI generated test plan');
  });

  it('falls back to HEAD_COMMIT_HASH when BUILDS_FROM_SHA is empty string', async () => {
    setEnv({ BUILDS_FROM_SHA: '' });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
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

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    const { artifacts } = getMocks();
    expect(artifacts.getArtifactLinks).toHaveBeenCalledWith(
      'https://ci.example.com',
      'MetaMask',
      'metamask-extension',
      '55',
    );
  });

  it('includes "What\'s in this RC" section when BRANCH is a release branch', async () => {
    setEnv({ BRANCH: 'release/13.33.0' });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    const { cherryPicks } = getMocks();
    expect(cherryPicks.extractWhatsInRc).toHaveBeenCalled();
    expect(cherryPicks.buildWhatsInRcSection).toHaveBeenCalledWith(
      expect.any(Object),
      '99',
    );

    const { commentBody } =
      getMocks().utils.postCommentWithMetamaskBot.mock.calls[0][0];
    expect(commentBody).toContain('whats-in-this-rc');
  });

  it('does not include "What\'s in this RC" section when BRANCH is not a release branch', async () => {
    setEnv({ BRANCH: 'main' });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    const { cherryPicks } = getMocks();
    expect(cherryPicks.extractWhatsInRc).not.toHaveBeenCalled();
  });

  it('shows failure section when extractWhatsInRc throws', async () => {
    setEnv({ BRANCH: 'release/13.33.0' });

    const { cherryPicks } = getMocks();
    cherryPicks.extractWhatsInRc.mockImplementation(() => {
      throw new Error('git command failed');
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('.');
    await flushPromises();

    expect(cherryPicks.buildWhatsInRcFailureSection).toHaveBeenCalledWith(
      'git command failed',
      '99',
    );
  });
});
