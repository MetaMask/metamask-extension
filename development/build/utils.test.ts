import { getBuildTargetFromTask, getEnvironment } from './utils';

describe('getBuildTargetFromTask', () => {
  it('passes through valid build targets unchanged', () => {
    expect(getBuildTargetFromTask('dev')).toBe('dev');
    expect(getBuildTargetFromTask('test')).toBe('test');
    expect(getBuildTargetFromTask('testDev')).toBe('testDev');
    expect(getBuildTargetFromTask('prod')).toBe('prod');
    expect(getBuildTargetFromTask('dist')).toBe('dist');
  });

  it('extracts build target from script task names', () => {
    expect(getBuildTargetFromTask('scripts:core:dev:standardEntryPoints')).toBe(
      'dev',
    );
    expect(getBuildTargetFromTask('scripts:core:dev:contentscript')).toBe(
      'dev',
    );
    expect(
      getBuildTargetFromTask('scripts:core:test:standardEntryPoints'),
    ).toBe('test');
    expect(getBuildTargetFromTask('scripts:core:test:sentry')).toBe('test');
    expect(
      getBuildTargetFromTask('scripts:core:test-live:standardEntryPoints'),
    ).toBe('testDev');
    expect(
      getBuildTargetFromTask('scripts:core:prod:standardEntryPoints'),
    ).toBe('prod');
    expect(
      getBuildTargetFromTask('scripts:core:dist:standardEntryPoints'),
    ).toBe('dist');
  });

  it('returns original taskName for unknown patterns (backwards compatibility)', () => {
    expect(getBuildTargetFromTask('unknown:task')).toBe('unknown:task');
    expect(getBuildTargetFromTask('manifest:dev')).toBe('manifest:dev');
  });
});

describe('getEnvironment', () => {
  const { env } = process;

  beforeEach(() => {
    process.env = { ...env };
    // Clear GitHub env vars that CI sets
    delete process.env.GITHUB_HEAD_REF;
    delete process.env.GITHUB_REF_NAME;
    delete process.env.GITHUB_EVENT_NAME;
  });

  afterAll(() => {
    process.env = env;
  });

  it('returns correct environment for build targets', () => {
    expect(getEnvironment({ buildTarget: 'prod' as never })).toBe('production');
    expect(getEnvironment({ buildTarget: 'dev' as never })).toBe('development');
    expect(getEnvironment({ buildTarget: 'test' as never })).toBe('testing');
    expect(getEnvironment({ buildTarget: 'testDev' as never })).toBe(
      'development',
    );
    expect(getEnvironment({ buildTarget: 'dist' as never })).toBe('other');
  });

  it('returns RELEASE_CANDIDATE for dist on release branch', () => {
    process.env.GITHUB_REF_NAME = 'release/13.12.0';
    expect(getEnvironment({ buildTarget: 'dist' as never })).toBe(
      'release-candidate',
    );
  });

  it('returns STAGING for dist on main branch', () => {
    process.env.GITHUB_REF_NAME = 'main';
    expect(getEnvironment({ buildTarget: 'dist' as never })).toBe('staging');
  });

  it('returns PULL_REQUEST for dist on pull_request event', () => {
    process.env.GITHUB_EVENT_NAME = 'pull_request';
    expect(getEnvironment({ buildTarget: 'dist' as never })).toBe(
      'pull-request',
    );
  });

  it('returns TESTING for test even with pull_request event', () => {
    process.env.GITHUB_EVENT_NAME = 'pull_request';
    expect(getEnvironment({ buildTarget: 'test' as never })).toBe('testing');
  });

  it('prefers GITHUB_HEAD_REF over GITHUB_REF_NAME', () => {
    process.env.GITHUB_HEAD_REF = 'release/15.0.0';
    process.env.GITHUB_REF_NAME = 'main';
    expect(getEnvironment({ buildTarget: 'dist' as never })).toBe(
      'release-candidate',
    );
  });
});
