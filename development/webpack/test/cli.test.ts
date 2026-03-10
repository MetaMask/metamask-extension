import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { loadBuildTypesConfig } from '../../lib/build-type';
import { getDryRunMessage, parseArgv } from '../utils/cli';
import { Browsers } from '../utils/helpers';

describe('./utils/cli.ts', () => {
  const defaultArgs = {
    mode: 'development',
    env: 'development',
    watch: false,
    cache: true,
    progress: true,
    releaseVersion: 0,
    devtool: 'source-map',
    sentry: false,
    test: false,
    reactCompilerVerbose: false,
    reactCompilerDebug: 'none',
    threads: 'auto',
    jobsPerThread: 'auto',
    zip: false,
    minify: false,
    browser: ['chrome'],
    manifest_version: 3,
    type: 'main',
    validateEnv: false,
    lavamoat: false,
    lavamoatDebug: false,
    generatePolicy: false,
    snow: false,
    dryRun: false,
    stats: false,
  };

  it('should return defaults', () => {
    const { args, cacheKey, features } = parseArgv([], loadBuildTypesConfig());
    const { resolvedThreads, resolvedJobs, ...rest } = args;
    assert.deepStrictEqual(rest, defaultArgs);
    assert.strictEqual(typeof resolvedThreads, 'number');
    assert.strictEqual(typeof resolvedJobs, 'number');
    assert(resolvedThreads >= 0, 'resolvedThreads should be non-negative');
    assert(resolvedJobs >= 0, 'resolvedJobs should be non-negative');
    assert.strictEqual(
      typeof cacheKey,
      'string',
      'cacheKey should be a string',
    );
    assert(cacheKey.length > 0, 'cacheKey should not be empty');
    // features come from build.yml, and change often, so let's just check the shape
    assert(features, 'features should be defined');
    assert(features.all instanceof Set, 'features.all should be a Set');
    assert(features.active instanceof Set, 'features.active should be a Set');
  });

  it('getDryRunMessage', () => {
    const { args, features } = parseArgv([], loadBuildTypesConfig());
    const message = getDryRunMessage(args, features);
    // testing the exact message could be nice, but verbose and maybe a bit
    // brittle, so we just check that it returns a string
    assert.strictEqual(
      typeof message,
      'string',
      'Dry run message should be a string',
    );
    assert(message.length > 0, 'Dry run message should not be empty');
  });

  it('should allow for build types with no features', () => {
    const buildTypesConfig = loadBuildTypesConfig();
    delete buildTypesConfig.buildTypes.main.features;
    const { features } = parseArgv([], buildTypesConfig);
    assert.strictEqual(
      features.active.size,
      0,
      'features.active should be an empty Set',
    );
  });

  it('should allow for a build type with no features section', () => {
    const buildTypesConfig = loadBuildTypesConfig();
    delete buildTypesConfig.buildTypes.main.features;
    const { features } = parseArgv([], buildTypesConfig);
    assert.strictEqual(
      features.active.size,
      0,
      'features.active should be an empty Set',
    );
  });

  it('should return all browsers when `--browser all` is specified', () => {
    const { args } = parseArgv(['--browser', 'all'], loadBuildTypesConfig());
    assert.deepStrictEqual(args.browser, Browsers);
  });

  describe('build environment defaulting', () => {
    const originalEnv = process.env;

    function setGitHubContext(
      context: Partial<
        Pick<
          NodeJS.ProcessEnv,
          'GITHUB_HEAD_REF' | 'GITHUB_REF_NAME' | 'GITHUB_EVENT_NAME'
        >
      >,
    ) {
      process.env = { ...originalEnv };
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REF_NAME;
      delete process.env.GITHUB_EVENT_NAME;
      Object.assign(process.env, context);
    }

    afterEach(() => {
      process.env = originalEnv;
    });

    it('defaults to testing when --test is specified', () => {
      setGitHubContext({
        GITHUB_HEAD_REF: 'release/13.0.0',
        GITHUB_REF_NAME: 'main',
        GITHUB_EVENT_NAME: 'pull_request',
      });
      const { args } = parseArgv(
        ['--mode', 'production', '--test'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'testing');
    });

    it('defaults to development in development mode', () => {
      setGitHubContext({
        GITHUB_REF_NAME: 'main',
        GITHUB_EVENT_NAME: 'pull_request',
      });
      const { args } = parseArgv(
        ['--mode', 'development'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'development');
    });

    it('defaults to release-candidate on release branches', () => {
      setGitHubContext({
        GITHUB_HEAD_REF: 'release/13.0.0',
        GITHUB_REF_NAME: 'main',
        GITHUB_EVENT_NAME: 'pull_request',
      });
      const { args } = parseArgv(
        ['--mode', 'production'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'release-candidate');
    });

    it('defaults to staging on main branch', () => {
      setGitHubContext({ GITHUB_REF_NAME: 'main' });
      const { args } = parseArgv(
        ['--mode', 'production'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'staging');
    });

    it('defaults to pull-request on pull_request events', () => {
      setGitHubContext({
        GITHUB_REF_NAME: 'feature/my-branch',
        GITHUB_EVENT_NAME: 'pull_request',
      });
      const { args } = parseArgv(
        ['--mode', 'production'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'pull-request');
    });

    it('defaults to other when CI context does not match known environments', () => {
      setGitHubContext({
        GITHUB_REF_NAME: 'feature/my-branch',
        GITHUB_EVENT_NAME: 'push',
      });
      const { args } = parseArgv(
        ['--mode', 'production'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'other');
    });

    it('allows explicit --env values from cli options', () => {
      setGitHubContext({ GITHUB_REF_NAME: 'main' });
      const { args } = parseArgv(
        ['--mode', 'production', '--env', 'production'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.env, 'production');
    });
  });

  describe('thread-loader options', () => {
    it('parses --threads with explicit number', () => {
      const { args } = parseArgv(['--threads', '4'], loadBuildTypesConfig());
      assert.strictEqual(args.threads, 4);
      assert.strictEqual(args.jobsPerThread, 'auto');
    });

    it('parses --jobsPerThread with explicit number when threads enabled', () => {
      const { args } = parseArgv(
        ['--threads', '4', '--jobsPerThread', '20'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.threads, 4);
      assert.strictEqual(args.jobsPerThread, 20);
    });

    it('getDryRunMessage includes thread resolution for auto', () => {
      const { args, features } = parseArgv([], loadBuildTypesConfig());
      const message = getDryRunMessage(args, features);
      assert.ok(
        message.includes('Threads:') && message.includes('Jobs per thread:'),
        'Dry run message should include thread-related output',
      );
    });

    it('getDryRunMessage shows resolved values for explicit threads', () => {
      const { args, features } = parseArgv(
        ['--threads', '2'],
        loadBuildTypesConfig(),
      );
      const message = getDryRunMessage(args, features);
      assert.ok(
        message.includes('Threads: 2'),
        'Dry run message should show explicit thread count',
      );
    });
  });

  describe('thread-loader option validation', () => {
    it('throws when --jobsPerThread is used with --threads 0', () => {
      assert.throws(
        () =>
          parseArgv(
            ['--threads', '0', '--jobsPerThread', '15'],
            loadBuildTypesConfig(),
          ),
        {
          message:
            /Invalid combination.*jobsPerThread.*thread-loader is disabled/u,
        },
      );
    });

    it('throws when --jobsPerThread is used with --generatePolicy', () => {
      assert.throws(
        () =>
          parseArgv(
            ['--generatePolicy', '--jobsPerThread', '20'],
            loadBuildTypesConfig(),
          ),
        {
          message:
            /Invalid combination.*jobsPerThread.*thread-loader is disabled/u,
        },
      );
    });

    it('throws when --jobsPerThread is used with --reactCompilerVerbose', () => {
      assert.throws(
        () =>
          parseArgv(
            ['--reactCompilerVerbose', '--jobsPerThread', '10'],
            loadBuildTypesConfig(),
          ),
        {
          message:
            /Invalid combination.*jobsPerThread.*thread-loader is disabled/u,
        },
      );
    });

    it('throws when --threads is invalid (non-numeric)', () => {
      assert.throws(
        () => parseArgv(['--threads', 'abc'], loadBuildTypesConfig()),
        {
          message: /Invalid --threads value "abc"/u,
        },
      );
    });

    it('allows --jobsPerThread auto with --threads 0', () => {
      const { args } = parseArgv(
        ['--threads', '0', '--jobsPerThread', 'auto'],
        loadBuildTypesConfig(),
      );
      assert.strictEqual(args.threads, 0);
      assert.strictEqual(args.jobsPerThread, 'auto');
    });
  });
});
