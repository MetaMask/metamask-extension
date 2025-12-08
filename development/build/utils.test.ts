import { getEnvironment, getBuildTargetFromTask } from './utils';
import { TASKS } from './constants';

describe('getBuildTargetFromTask', () => {
  it('passes through valid build targets', () => {
    expect(getBuildTargetFromTask('dev')).toBe('dev');
    expect(getBuildTargetFromTask('test')).toBe('test');
    expect(getBuildTargetFromTask('prod')).toBe('prod');
    expect(getBuildTargetFromTask('dist')).toBe('dist');
    expect(getBuildTargetFromTask('testDev')).toBe('testDev');
  });

  it('extracts build target from task names', () => {
    expect(
      getBuildTargetFromTask(TASKS.SCRIPTS_CORE_DEV_STANDARD_ENTRY_POINTS),
    ).toBe('dev');
    expect(
      getBuildTargetFromTask(TASKS.SCRIPTS_CORE_TEST_STANDARD_ENTRY_POINTS),
    ).toBe('test');
    expect(
      getBuildTargetFromTask(TASKS.SCRIPTS_CORE_PROD_STANDARD_ENTRY_POINTS),
    ).toBe('prod');
    expect(
      getBuildTargetFromTask(TASKS.SCRIPTS_CORE_DIST_STANDARD_ENTRY_POINTS),
    ).toBe('dist');
    expect(
      getBuildTargetFromTask(
        TASKS.SCRIPTS_CORE_TEST_LIVE_STANDARD_ENTRY_POINTS,
      ),
    ).toBe('testDev');
  });

  it('returns unknown patterns unchanged', () => {
    expect(getBuildTargetFromTask('unknown:task')).toBe('unknown:task');
    expect(getBuildTargetFromTask(TASKS.MANIFEST_DEV)).toBe(TASKS.MANIFEST_DEV);
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

  describe('with explicit git context (pure function usage)', () => {
    it('returns correct environment for build targets', () => {
      const git = { branch: '', eventName: '' };
      expect(getEnvironment({ buildTarget: 'prod' as never, git })).toBe(
        'production',
      );
      expect(getEnvironment({ buildTarget: 'dev' as never, git })).toBe(
        'development',
      );
      expect(getEnvironment({ buildTarget: 'test' as never, git })).toBe(
        'testing',
      );
      expect(getEnvironment({ buildTarget: 'testDev' as never, git })).toBe(
        'development',
      );
      expect(getEnvironment({ buildTarget: 'dist' as never, git })).toBe(
        'other',
      );
    });

    it('returns RELEASE_CANDIDATE for dist on release branch', () => {
      const git = { branch: 'release/13.12.0', eventName: '' };
      expect(getEnvironment({ buildTarget: 'dist' as never, git })).toBe(
        'release-candidate',
      );
    });

    it('returns STAGING for dist on main branch', () => {
      const git = { branch: 'main', eventName: '' };
      expect(getEnvironment({ buildTarget: 'dist' as never, git })).toBe(
        'staging',
      );
    });

    it('returns PULL_REQUEST for dist on pull_request event', () => {
      const git = { branch: '', eventName: 'pull_request' };
      expect(getEnvironment({ buildTarget: 'dist' as never, git })).toBe(
        'pull-request',
      );
    });

    it('returns TESTING for test even with pull_request event', () => {
      const git = { branch: '', eventName: 'pull_request' };
      expect(getEnvironment({ buildTarget: 'test' as never, git })).toBe(
        'testing',
      );
    });

    it('prioritizes release branch over pull_request event', () => {
      const git = { branch: 'release/14.0.0', eventName: 'pull_request' };
      expect(getEnvironment({ buildTarget: 'dist' as never, git })).toBe(
        'release-candidate',
      );
    });
  });

  describe('with process.env fallback (backwards compatibility)', () => {
    it('returns correct environment for build targets', () => {
      expect(getEnvironment({ buildTarget: 'prod' as never })).toBe(
        'production',
      );
      expect(getEnvironment({ buildTarget: 'dev' as never })).toBe(
        'development',
      );
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
});
