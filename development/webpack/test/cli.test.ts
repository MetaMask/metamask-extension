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
    zip: false,
    minify: false,
    browser: ['chrome'],
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
    assert.deepStrictEqual(args, defaultArgs);
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
});
