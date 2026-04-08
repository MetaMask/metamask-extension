import { parseSentryDSN, buildSentryLogsUrl } from './sentry-utils';

describe('parseSentryDSN', () => {
  it('parses standard Sentry DSN format', () => {
    const dsn = 'https://fake@metamask.sentry.io/4510302346608640';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'metamask',
      projectId: '4510302346608640',
    });
  });

  it('parses ingest subdomain format', () => {
    const dsn = 'https://key@org.ingest.sentry.io/123456';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'org',
      projectId: '123456',
    });
  });

  it('parses US regional ingest hostname (o*.ingest.us.sentry.io)', () => {
    const dsn =
      'https://public@o1234567890123456.ingest.us.sentry.io/4510302346608640';
    const result = parseSentryDSN(dsn);

    expect(result).toStrictEqual({
      organization: 'o1234567890123456',
      projectId: '4510302346608640',
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

describe('buildSentryLogsUrl', () => {
  const mockDsn = 'https://fake@metamask.sentry.io/4510302346608640';

  beforeEach(() => {
    delete process.env.SENTRY_DSN_PERFORMANCE;
  });

  afterEach(() => {
    delete process.env.SENTRY_DSN_PERFORMANCE;
  });

  it('builds Sentry Logs Explorer URL with branch filter', () => {
    const url = buildSentryLogsUrl('feat/my-branch', mockDsn);

    expect(url).toContain('https://metamask.sentry.io/explore/logs/');
    expect(url).toContain('logsQuery=ci.branch%3Afeat%2Fmy-branch');
    expect(url).toContain('project=4510302346608640');
    expect(url).toContain('statsPeriod=2w');
    expect(url).toContain('logsSortBys=-timestamp');
    expect(url).toContain('logsFields=timestamp');
    expect(url).toContain('logsFields=message');
  });

  it('uses SENTRY_DSN_PERFORMANCE env var when DSN not provided', () => {
    process.env.SENTRY_DSN_PERFORMANCE = mockDsn;

    const url = buildSentryLogsUrl('main');

    expect(url).toContain('logsQuery=ci.branch%3Amain');
  });

  it('returns null when DSN is not provided and env var not set', () => {
    const url = buildSentryLogsUrl('main');

    expect(url).toBeNull();
  });

  it('returns null when DSN is invalid', () => {
    const url = buildSentryLogsUrl('main', 'invalid-dsn');

    expect(url).toBeNull();
  });

  it('handles branch names with special characters', () => {
    const url = buildSentryLogsUrl('feature/add-new-thing', mockDsn);

    expect(url).toContain('logsQuery=ci.branch%3Afeature%2Fadd-new-thing');
  });

  it('includes browser filter when provided', () => {
    const url = buildSentryLogsUrl('main', mockDsn, { browser: 'chrome' });

    expect(url).toContain('ci.branch%3Amain');
    expect(url).toContain('ci.browser%3Achrome');
  });

  it('includes buildType filter when provided', () => {
    const url = buildSentryLogsUrl('main', mockDsn, {
      buildType: 'browserify',
    });

    expect(url).toContain('ci.buildType%3Abrowserify');
  });

  it('includes benchmark name filter with message:Contains format', () => {
    const url = buildSentryLogsUrl('main', mockDsn, {
      benchmarkName: 'firefox-browserify-startupStandardHome',
    });

    expect(url).toContain('message');
    expect(url).toContain('Contains');
    expect(url).toContain('benchmark.firefox-browserify-startupStandardHome');
  });

  it('combines all filters when all options provided', () => {
    const url = buildSentryLogsUrl('feat/test', mockDsn, {
      browser: 'firefox',
      buildType: 'webpack',
      benchmarkName: 'test-benchmark',
    });

    expect(url).toContain('ci.branch%3Afeat%2Ftest');
    expect(url).toContain('ci.browser%3Afirefox');
    expect(url).toContain('ci.buildType%3Awebpack');
    expect(url).toContain('message');
    expect(url).toContain('benchmark.test-benchmark');
  });
});
