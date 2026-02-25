/**
 * @file This file contains the CLI parser for the webpack build script.
 * It is responsible for parsing the command line arguments and returning a
 * structured object representing the parsed arguments.
 */

import type { Options as YargsOptions } from 'yargs';
import yargs from 'yargs/yargs';
import parser from 'yargs-parser';
import type { BuildTypesConfig } from '../../lib/build-type';
import {
  Browsers,
  type Manifest,
  type Browser,
  uniqueSort,
  toOrange,
} from './helpers';
import { ENVIRONMENTS, MODES } from './constants';

const ENV_PREFIX = 'BUNDLE';
const addFeat = 'addFeature' as const;
const omitFeat = 'omitFeature' as const;
type YargsOptionsMap = { [key: string]: YargsOptions };
type OptionsKeys = keyof Omit<Options, typeof addFeat | typeof omitFeat>;

/**
 * Some options affect the default values of other options.
 */
const prerequisites = {
  mode: {
    array: false,
    default: MODES.DEVELOPMENT,
    description: 'Enables/disables production optimizations/development hints',
    choices: Object.values(MODES),
    group: toOrange('Build options:'),
    type: 'string',
  },
  test: {
    array: false,
    default: false,
    description: 'Enables/disables testing mode',
    group: toOrange('Developer assistance:'),
    type: 'boolean',
  },
  // `as const` makes it easier for developers to see the values of the type
  // when hovering over it in their IDE. `satisfies Options` enables type
  // checking, without loosing the `const` property of the values, which is
  // necessary for yargs to infer the final types
} as const satisfies YargsOptionsMap;

/**
 * Parses the given args from `argv` and returns whether or not the requested
 * build is a production build or not.
 *
 * @param argv - The command line arguments to parse, typically `process.argv.slice(2)`
 * @param opts - The options to parse from the command line arguments
 * @returns An object containing the parsed `mode` and `test` flag
 */
function preParse(argv: string[], opts: typeof prerequisites) {
  const defaults: Record<string, unknown> = {};
  const booleanOptions: string[] = [];
  const stringOptions: string[] = [];

  for (const [arg, config] of Object.entries(opts)) {
    defaults[arg] = config.default;
    if (config.type === 'boolean') {
      booleanOptions.push(arg);
    }
    if (config.type === 'string') {
      stringOptions.push(arg);
    }
  }

  const parsed = parser(argv, {
    envPrefix: ENV_PREFIX,
    boolean: booleanOptions,
    string: stringOptions,
    default: defaults,
  });
  const mode = parsed.mode === 'production' ? 'production' : 'development';
  const test = parsed.test === true;
  return { mode, test } as const;
}

/**
 * Resolves the MetaMask build environment.
 *
 * The environment determines which Sentry project events are sent to,
 * feature flag detection, and other build-specific behaviors.
 *
 * Resolution order:
 * 1. If `--test` is set, returns 'testing'
 * 2. If `--mode development`, returns 'development'
 * 3. Otherwise, auto-detects from git context (release branch, main, PR, or other)
 *
 * NOTE: 'production' environment is NEVER returned as a default. It must be
 * explicitly set via `--env` to prevent accidental pollution of production
 * Sentry with events from local or CI test builds.
 *
 * @param args - The parsed CLI arguments
 * @param args.test - Whether this is a test build
 * @param args.mode - The webpack mode ('development' or 'production')
 * @returns The resolved environment string
 */
export function resolveDefaultBuildEnvironment(args: {
  test: boolean;
  mode: (typeof MODES)[keyof typeof MODES];
}): (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS] {
  // Test builds always use 'testing' environment by default.
  if (args.test) {
    return ENVIRONMENTS.TESTING;
  }

  // Development builds use 'development' environment
  if (args.mode === MODES.DEVELOPMENT) {
    return ENVIRONMENTS.DEVELOPMENT;
  }

  // For production-like builds (--mode production), auto-detect from git
  // context. GITHUB_HEAD_REF is only used in pull_requests, while
  // `GITHUB_REF_NAME` is the name of the branch that triggered the workflow.
  const branch =
    process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';

  // staging builds always come from the `main` branch
  if (branch === 'main') {
    return ENVIRONMENTS.STAGING;
  }

  // release branches are like "release/1.2.0", "release/13.2.1", etc.
  if (/^release\/\d+\.\d+\.\d+$/u.test(branch)) {
    return ENVIRONMENTS.RELEASE_CANDIDATE;
  }

  const eventName = process.env.GITHUB_EVENT_NAME;
  if (eventName === 'pull_request') {
    return ENVIRONMENTS.PULL_REQUEST;
  }

  // Default: local builds or any other source
  return ENVIRONMENTS.OTHER;
}

/**
 * Type representing the parsed arguments
 */
export type Args = ReturnType<typeof parseArgv>['args'];
export type Features = ReturnType<typeof parseArgv>['features'];

/**
 * Parses an array of command line arguments into a structured format.
 *
 * @param argv - An array of command line arguments, excluding the program
 * executable and file name. Typically used as
 * `parseArgv(process.argv.slice(2))`.
 * @param buildConfig - The build config.
 * @param buildConfig.buildTypes - The build types.
 * @param buildConfig.features - The features.
 * @returns An object representing the parsed arguments.
 */
export function parseArgv(
  argv: string[],
  { buildTypes, features }: BuildTypesConfig,
) {
  const allBuildTypeNames = Object.keys(buildTypes);
  const allFeatureNames = Object.keys(features);

  // args like `production` may change our CLI defaults, so we pre-parse them
  const preconditions = preParse(argv, prerequisites);
  const options = getOptions(preconditions, allBuildTypeNames, allFeatureNames);
  const args = getCli(options, 'yarn webpack').parseSync(argv);
  // the properties `$0` and `_` are added by yargs, but we don't need them. We
  // transform `add` and `omit`, so we also remove them from the config object.
  const { $0, _, addFeature: add, omitFeature: omit, ...config } = args;

  // set up feature flags
  const active = new Set<string>();
  const defaultFeaturesForBuildType = buildTypes[config.type].features ?? [];
  const setActive = (f: string) => omit.includes(f) || active.add(f);
  [defaultFeaturesForBuildType, add].forEach((feat) => feat.forEach(setActive));

  const ignore = new Set(['$0', 'conf', 'progress', 'stats', 'watch']);
  const cacheKey = Object.entries(args)
    .filter(([key]) => key.length > 1 && !ignore.has(key) && !key.includes('-'))
    .sort(([x], [y]) => x.localeCompare(y));
  return {
    // narrow the `config` type to only the options we're returning
    args: config as { [key in OptionsKeys]: (typeof config)[key] },
    cacheKey: JSON.stringify(cacheKey),
    features: {
      active,
      all: new Set(allFeatureNames),
    },
  };
}

/**
 * Gets a yargs instance for parsing CLI arguments.
 *
 * @param options
 * @param name
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
function getCli<T extends YargsOptionsMap = Options>(options: T, name: string) {
  const cli = yargs()
    // Ensure unrecognized commands/options are reported as errors.
    .strict()
    // disable yargs's version, as we use it ourselves
    .version(false)
    // use the scriptName in `--help` output
    .scriptName(name)
    // wrap output at a maximum of 120 characters or `process.stdout.columns`
    .wrap(Math.min(120, process.stdout.columns))
    // enable the `--config` command, which allows the user to specify a custom
    // config file containing webpack options
    .config()
    .parserConfiguration({
      'strip-aliased': true,
      'strip-dashed': true,
    })
    // enable ENV parsing, which allows the user to specify webpack options via
    // environment variables prefixed with `BUNDLE_`
    // TODO: choose a better name than `BUNDLE` (it looks like `MM` is already being used in CI for ✨something✨)
    .env(ENV_PREFIX)
    // TODO: enable completion once https://github.com/yargs/yargs/pull/2422 is released.
    // enable the `completion` command, which outputs a bash completion script
    // .completion(
    //   'completion',
    //   'Enable bash/zsh completions; concat the script generated by running this command to your .bashrc or .bash_profile',
    // )
    .example(
      '$0 --mode development --browser firefox --browser chrome --zip',
      'Builds the extension for development for Chrome & Firefox; generate zip files for both',
    )
    // TODO: enable completion once https://github.com/yargs/yargs/pull/2422 is released.
    // .example(
    //   '$0 completion',
    //   `Generates a bash completion script for the \`${name}\` command`,
    // )
    .updateStrings({
      'Options:': toOrange('Options:'),
      'Examples:': toOrange('Examples:'),
    })
    .options(options);
  return cli;
}

type Options = ReturnType<typeof getOptions>;

function getOptions(
  { mode, test }: ReturnType<typeof preParse>,
  buildTypes: string[],
  allFeatures: string[],
) {
  const isProduction = mode === 'production';
  const prodDefaultDesc =
    "If `mode` is 'production', `true`, otherwise `false`";
  return {
    watch: {
      alias: 'w',
      array: false,
      default: false,
      description: 'Build then watch for files changes',
      group: toOrange('Developer assistance:'),
      type: 'boolean',
    },
    cache: {
      alias: 'c',
      array: false,
      default: true,
      description: 'Cache build for faster rebuilds',
      group: toOrange('Developer assistance:'),
      type: 'boolean',
    },
    progress: {
      alias: 'p',
      array: false,
      default: true,
      description: 'Show build progress',
      group: toOrange('Developer assistance:'),
      type: 'boolean',
    },
    devtool: {
      alias: 'd',
      array: false,
      default: isProduction ? 'hidden-source-map' : 'source-map',
      defaultDescription:
        "If `mode` is 'production', 'hidden-source-map', otherwise 'source-map'",
      description: 'Sourcemap type to generate',
      choices: ['none', 'source-map', 'hidden-source-map'] as const,
      group: toOrange('Developer assistance:'),
      type: 'string',
    },
    sentry: {
      array: false,
      default: isProduction,
      defaultDescription: prodDefaultDesc,
      description: 'Enables/disables Sentry Application Monitoring',
      group: toOrange('Developer assistance:'),
      type: 'boolean',
    },
    reactCompilerVerbose: {
      array: false,
      default: false,
      description:
        'Enables/disables React Compiler verbose mode and statistics',
      group: toOrange('Developer assistance:'),
      type: 'boolean',
    },
    reactCompilerDebug: {
      array: false,
      choices: ['all', 'critical', 'none'] as const,
      default: 'none',
      description:
        'Sets React Compiler panic threshold that fails the build for all errors or critical errors only. If `none`, the build will not fail.',
      group: toOrange('Developer assistance:'),
      type: 'string',
    },

    ...prerequisites,
    zip: {
      alias: 'z',
      array: false,
      default: false,
      description: 'Generate a zip file of the build',
      group: toOrange('Build options:'),
      type: 'boolean',
    },
    minify: {
      alias: 'm',
      array: false,
      default: isProduction,
      defaultDescription:
        "If `mode` is 'production', `true`, otherwise `false`",
      description: 'Minify the output',
      group: toOrange('Build options:'),
      type: 'boolean',
    },
    browser: {
      alias: 'b',
      array: true,
      choices: ['all', ...Browsers],
      coerce: (browsers: (Browser | 'all')[]) => {
        type OneOrMoreBrowsers = [Browser, ...Browser[]];
        // sort browser for determinism (important for caching)
        const set = new Set<Browser | 'all'>(browsers.sort());
        return (set.has('all') ? [...Browsers] : [...set]) as OneOrMoreBrowsers;
      },
      default: 'chrome',
      description: 'Browsers to build for',
      group: toOrange('Build options:'),
      type: 'string',
    },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    manifest_version: {
      alias: 'v',
      array: false,
      choices: [2, 3] as Manifest['manifest_version'][],
      default: 3 as Manifest['manifest_version'],
      description: "Changes manifest.json format to the given version's schema",
      group: toOrange('Build options:'),
      type: 'number',
    },
    releaseVersion: {
      alias: 'r',
      array: false,
      default: 0,
      description:
        'The (pre)release version of the extension, e.g., the `6` in `18.7.25-flask.6`.',
      group: toOrange('Build options:'),
      type: 'number',
    },
    type: {
      alias: 't',
      array: false,
      choices: ['none', ...buildTypes],
      default: 'main' as const,
      description: 'Select the build type (main, beta, etc)',
      group: toOrange('Build options:'),
      type: 'string',
    },
    [addFeat]: {
      alias: 'a',
      array: true,
      choices: allFeatures,
      coerce: uniqueSort,
      default: [] as typeof allFeatures,
      description: 'Add features to be included in the selected build `type`',
      group: toOrange('Build options:'),
      type: 'string',
    },
    [omitFeat]: {
      alias: 'o',
      array: true,
      choices: allFeatures,
      coerce: uniqueSort,
      default: [] as typeof allFeatures,
      description: 'Omit features from the selected build `type`',
      group: toOrange('Build options:'),
      type: 'string',
    },
    env: {
      alias: 'e',
      array: false,
      choices: Object.values(ENVIRONMENTS),
      default: resolveDefaultBuildEnvironment({ mode, test }),
      defaultDescription:
        'Auto-detected from git context (branch name, CI environment), or set to "testing" when --test is used, or "development" when --mode development is used',
      description:
        'The build environment (production, development, testing, staging, release-candidate, pull-request, other). ' +
        'Controls Sentry project targeting and feature flag detection. ' +
        'If not specified, auto-detected from git context or derived from --test / --mode development.',
      group: toOrange('Build options:'),
      type: 'string',
    },
    validateEnv: {
      array: false,
      default: isProduction,
      defaultDescription: prodDefaultDesc,
      description:
        'Validate environment variables against builds.yml declarations',
      group: toOrange('Build options:'),
      type: 'boolean',
    },

    lavamoat: {
      alias: 'l',
      array: false,
      default: isProduction,
      defaultDescription: prodDefaultDesc,
      description: 'Apply LavaMoat to the build assets',
      group: toOrange('Security:'),
      type: 'boolean',
    },
    lavamoatDebug: {
      alias: 'u',
      array: false,
      default: false,
      description:
        'Enables/disables LavaMoat debug mode (ignored if `lavamoat` is not enabled)',
      group: toOrange('Security:'),
      type: 'boolean',
    },
    generatePolicy: {
      alias: 'g',
      array: false,
      default: false,
      description: 'Generate the LavaMoat policy',
      group: toOrange('Security:'),
      type: 'boolean',
    },
    snow: {
      alias: 's',
      array: false,
      default: isProduction,
      defaultDescription: prodDefaultDesc,
      description: 'Apply Snow to the build assets',
      group: toOrange('Security:'),
      type: 'boolean',
    },

    dryRun: {
      array: false,
      default: false,
      description: 'Output the config without building',
      group: toOrange('Options:'),
      type: 'boolean',
    },
    stats: {
      array: false,
      default: false,
      description: 'Display build stats after building',
      group: toOrange('Options:'),
      type: 'boolean',
    },
  } as const satisfies YargsOptionsMap;
}

/**
 * Returns a string representation of the given arguments and features.
 *
 * @param args - The parsed CLI arguments
 * @param features - The active and available features
 */
export function getDryRunMessage(args: Args, features: Features) {
  return `🦊 Build Config 🦊

Mode: ${args.mode}
Environment: ${args.env}
Minify: ${args.minify}
Watch: ${args.watch}
Cache: ${args.cache}
Progress: ${args.progress}
Zip: ${args.zip}
LavaMoat: ${args.lavamoat}
LavaMoat debug: ${args.lavamoatDebug}
Generate policy: ${args.generatePolicy}
Snow: ${args.snow}
Sentry: ${args.sentry}
React Compiler verbose: ${args.reactCompilerVerbose}
React Compiler debug: ${args.reactCompilerDebug}
Validate Env: ${args.validateEnv}
Manifest version: ${args.manifest_version}
Release version: ${args.releaseVersion}
Browsers: ${args.browser.join(', ')}
Devtool: ${args.devtool}
Build type: ${args.type}
Features: ${[...features.active].join(', ')}
Test: ${args.test}
`;
}
