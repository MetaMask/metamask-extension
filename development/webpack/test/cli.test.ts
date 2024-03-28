import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getDryRunMessage, parseArgv } from '../utils/cli';
import { getBuildTypes } from '../utils/config';
import { Browsers } from '../utils/helpers';

describe('./utils/cli.ts', () => {
  const defaultArgs = {
    env: 'development',
    watch: false,
    cache: true,
    progress: true,
    devtool: 'source-map',
    sentry: false,
    test: false,
    zip: false,
    minify: false,
    browser: ['chrome'],
    manifest_version: 2,
    type: 'main',
    'add-feature': [],
    'omit-feature': [],
    lavamoat: false,
    snow: false,
    'dry-run': false,
    dryRun: false,
    stats: false,
  };

  it('should return defaults', () => {
    const { args, cacheKey, features } = parseArgv([], getBuildTypes());
    // args has some single-letter aliases, added by yargs, but they aren't
    // part of our official API (the type returned by `parseArgv`), so we ignore them here
    for (const [key, value] of Object.entries(defaultArgs)) {
      assert.deepStrictEqual(
        args[key as keyof typeof args],
        value,
        `args.${key} should be ${value}`,
      );
    }
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
    const { args, features } = parseArgv([], getBuildTypes());
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
    const buildTypesConfig = getBuildTypes();
    delete buildTypesConfig.buildTypes.main.features;
    const { features } = parseArgv([], buildTypesConfig);
    assert.strictEqual(
      features.active.size,
      0,
      'features.active should be an empty Set',
    );
  });

  it('should allow for a build type with no features section', () => {
    const buildTypesConfig = getBuildTypes();
    delete buildTypesConfig.buildTypes.main.features;
    const { features } = parseArgv([], buildTypesConfig);
    assert.strictEqual(
      features.active.size,
      0,
      'features.active should be an empty Set',
    );
  });

  it('should return all browsers when `--browser all` is specified', () => {
    const { args } = parseArgv(['--browser', 'all'], getBuildTypes());
    assert.deepStrictEqual(args.browser, Browsers);
  });
});
