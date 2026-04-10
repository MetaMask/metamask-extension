import { parseSentryDSN, buildPerformanceSentryLogsUrl } from './sentry-utils';

describe('parseSentryDSN', () => {
  it('parses standard Sentry DSN format', () => {
    const dsn = 'https://fake@metamask.sentry.io/4510302346608640';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'metamask',
      projectId: '4510302346608640',
      useRootSentryHost: false,
    });
  });

  it('parses ingest subdomain format', () => {
    const dsn = 'https://key@org.ingest.sentry.io/123456';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'org',
      projectId: '123456',
      useRootSentryHost: false,
    });
  });

  it('parses US regional ingest hostname (o*.ingest.us.sentry.io)', () => {
    const dsn =
      'https://public@o1234567890123456.ingest.us.sentry.io/4510302346608640';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'o1234567890123456',
      projectId: '4510302346608640',
      useRootSentryHost: false,
    });
  });

  it('parses legacy host sentry.io (no org subdomain)', () => {
    const dsn = 'https://public_key@sentry.io/4510302346608640';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: '',
      projectId: '4510302346608640',
      useRootSentryHost: true,
    });
  });

  it('returns null for invalid URL', () => {
    const dsn = 'not-a-valid-url';
    const result = parseSentryDSN(dsn);

    expect(result).toBeNull();
  });

  it('returns null for non-sentry.io hostname', () => {
    const dsn = 'https://key@example.com/123';
    const result = parseSentryDSN(dsn);

    expect(result).toBeNull();
  });

  it('returns null when project ID is missing', () => {
    const dsn = 'https://key@metamask.sentry.io/';
    const result = parseSentryDSN(dsn);

    expect(result).toBeNull();
  });
});

describe('buildPerformanceSentryLogsUrl', () => {
  const mockDsn = 'https://fake@metamask.sentry.io/4510302346608640';

  beforeEach(() => {
    process.env.SENTRY_DSN_PERFORMANCE = mockDsn;
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN_PERFORMANCE;
  });

  it('builds Sentry Logs Explorer URL with branch filter', () => {
    const url = buildPerformanceSentryLogsUrl('feat/my-branch');

    expect(url).toContain('https://metamask.sentry.io/explore/logs/');
    expect(url).toContain('ci.branch%3A%22feat%2Fmy-branch%22');
    expect(url).toContain('project=4510302346608640');
    expect(url).toContain('statsPeriod=2w');
    expect(url).toContain('logsSortBys=-timestamp');
    expect(url).toContain('logsFields=timestamp');
    expect(url).toContain('logsFields=message');
  });

  it('reads DSN from SENTRY_DSN_PERFORMANCE', () => {
    const url = buildPerformanceSentryLogsUrl('main');

    expect(url).toContain('logsQuery=ci.branch%3Amain');
  });

  it('returns null when no branch remains after trim (empty branchName, no orBranches)', () => {
    expect(buildPerformanceSentryLogsUrl('')).toBeNull();
    expect(buildPerformanceSentryLogsUrl('   ')).toBeNull();
  });

  it('allows empty branchName when orBranches supplies a branch', () => {
    const url = buildPerformanceSentryLogsUrl('', { orBranches: ['main'] });

    expect(url).toContain('logsQuery=ci.branch%3Amain');
  });

  it('returns null when SENTRY_DSN_PERFORMANCE is unset', () => {
    delete process.env.SENTRY_DSN_PERFORMANCE;

    const url = buildPerformanceSentryLogsUrl('main');

    expect(url).toBeNull();
  });

  it('returns null when SENTRY_DSN_PERFORMANCE is invalid', () => {
    process.env.SENTRY_DSN_PERFORMANCE = 'invalid-dsn';

    const url = buildPerformanceSentryLogsUrl('main');

    expect(url).toBeNull();
  });

  it('handles branch names with special characters', () => {
    const url = buildPerformanceSentryLogsUrl('feature/add-new-thing');

    expect(url).toContain('ci.branch%3A%22feature%2Fadd-new-thing%22');
  });

  it('includes browser filter when provided', () => {
    const url = buildPerformanceSentryLogsUrl('main', { browser: 'chrome' });

    expect(url).toContain('ci.branch%3Amain');
    expect(url).toContain('ci.browser%3Achrome');
  });

  it('includes buildType filter when provided', () => {
    const url = buildPerformanceSentryLogsUrl('main', {
      buildType: 'browserify',
    });

    expect(url).toContain('ci.buildType%3Abrowserify');
  });

  it('includes exact message filter (same string CI sends to Sentry)', () => {
    const url = buildPerformanceSentryLogsUrl('main', {
      logMessage: 'benchmark.firefox-browserify-startupStandardHome',
    });

    expect(url).toContain(
      'message%3Abenchmark.firefox-browserify-startupStandardHome',
    );
  });

  it('supports userAction.* messages', () => {
    const url = buildPerformanceSentryLogsUrl('main', {
      logMessage: 'userAction.loadNewAccount',
    });

    expect(url).toContain('message%3AuserAction.loadNewAccount');
  });

  it('combines all filters when all options provided', () => {
    const url = buildPerformanceSentryLogsUrl('feat/test', {
      browser: 'firefox',
      buildType: 'webpack',
      logMessage: 'benchmark.test-benchmark',
    });

    expect(url).toContain('ci.branch%3A%22feat%2Ftest%22');
    expect(url).toContain('ci.browser%3Afirefox');
    expect(url).toContain('ci.buildType%3Awebpack');
    expect(url).toContain('message%3Abenchmark.test-benchmark');
  });

  it('uses https://sentry.io/explore/logs for legacy sentry.io DSN host', () => {
    const legacyDsn = 'https://public_key@sentry.io/4510302346608640';
    process.env.SENTRY_DSN_PERFORMANCE = legacyDsn;

    const url = buildPerformanceSentryLogsUrl('main');

    expect(url).toContain('https://sentry.io/explore/logs/');
    expect(url).toContain('project=4510302346608640');
  });

  it('oRs orBranches with branchName when logMessage is set', () => {
    const url = buildPerformanceSentryLogsUrl('feat/xyz', {
      orBranches: ['main'],
      logMessage: 'benchmark.chrome-browserify-startupStandardHome',
    });

    expect(url).toContain('ci.branch%3A%22feat%2Fxyz%22');
    expect(url).toContain('OR');
    expect(url).toContain('ci.branch%3Amain');
    expect(url).toContain(
      'message%3Abenchmark.chrome-browserify-startupStandardHome',
    );
  });

  it('dedupes when branchName is main and orBranches includes main', () => {
    const url = buildPerformanceSentryLogsUrl('main', { orBranches: ['main'] });

    expect(url).toContain('logsQuery=ci.branch%3Amain');
    expect(url).not.toContain('OR');
  });
});
