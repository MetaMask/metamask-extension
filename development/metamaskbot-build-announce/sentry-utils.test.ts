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

  it('builds explore/logs URL from SENTRY_DSN_PERFORMANCE with branch and optional filters', () => {
    const url = buildPerformanceSentryLogsUrl(['feat/my-branch'], {
      browser: 'chrome',
      buildType: 'browserify',
      logMessage: 'benchmark.timerName',
    });

    expect(url).toContain('https://metamask.sentry.io/explore/logs/');
    expect(url).toContain('ci.branch%3A%22feat%2Fmy-branch%22');
    expect(url).toContain('ci.browser%3Achrome');
    expect(url).toContain('ci.buildType%3Abrowserify');
    expect(url).toContain('message%3Abenchmark.timerName');
    expect(url).toContain('project=4510302346608640');
    expect(url).toContain('statsPeriod=2w');
    expect(url).toContain('logsSortBys=-timestamp');
    expect(url).toContain('logsFields=timestamp');
    expect(url).toContain('logsFields=message');
  });

  it('returns null when DSN is missing, invalid, or no branch remains after trim', () => {
    expect(buildPerformanceSentryLogsUrl([])).toBeNull();
    expect(buildPerformanceSentryLogsUrl(['', '   '])).toBeNull();

    delete process.env.SENTRY_DSN_PERFORMANCE;
    expect(buildPerformanceSentryLogsUrl(['main'])).toBeNull();

    process.env.SENTRY_DSN_PERFORMANCE = 'invalid-dsn';
    expect(buildPerformanceSentryLogsUrl(['main'])).toBeNull();
  });

  it('does not quote wildcard branch patterns so ci.branch:release/* matches release branches', () => {
    const url = buildPerformanceSentryLogsUrl(['main', 'release/*']);
    expect(url).not.toBeNull();
    const logsQuery = new URL(url as string).searchParams.get('logsQuery');
    expect(logsQuery).toBe('(ci.branch:main OR ci.branch:release/*)');
    expect(logsQuery).not.toContain('"release/*"');

    const singleWildcard = buildPerformanceSentryLogsUrl(['release/*']);
    expect(singleWildcard).not.toBeNull();
    expect(
      new URL(singleWildcard as string).searchParams.get('logsQuery'),
    ).toBe('ci.branch:release/*');
  });

  it('oRs multiple branches, skips empty entries, and dedupes', () => {
    const orUrl = buildPerformanceSentryLogsUrl(['feat/x', 'main'], {
      logMessage: 'm',
    });
    expect(orUrl).toContain('OR');
    expect(orUrl).toContain('ci.branch%3A%22feat%2Fx%22');
    expect(orUrl).toContain('ci.branch%3Amain');

    expect(
      buildPerformanceSentryLogsUrl(['', 'main'], { logMessage: 'm' }),
    ).toContain('logsQuery=ci.branch%3Amain');

    const deduped = buildPerformanceSentryLogsUrl(['main', 'main']);
    expect(deduped).toContain('logsQuery=ci.branch%3Amain');
    expect(deduped).not.toContain('OR');
  });

  it('uses https://sentry.io/explore/logs when DSN host is legacy sentry.io', () => {
    process.env.SENTRY_DSN_PERFORMANCE =
      'https://public_key@sentry.io/4510302346608640';

    expect(buildPerformanceSentryLogsUrl(['main'])).toContain(
      'https://sentry.io/explore/logs/',
    );
  });
});
