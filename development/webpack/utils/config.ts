import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { parse } from 'dotenv';
import { setEnvironmentVariables } from '../../build/set-environment-variables';
import { type Args } from './cli';
import { getMetaMaskVersion } from './helpers';

const BUILDS_YML_PATH = join(__dirname, '../../../builds.yml');

/**
 * Coerce `"true"`, `"false"`, and `"null"` to their respective JavaScript values.
 *
 * @param value
 * @returns
 */
function coerce(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  return value;
}

/**
 * @param rcFilePath - The path to the rc file.
 * @returns The definitions loaded from the rc file.
 */
function loadEnv(rcFilePath: string): Map<string, unknown> {
  const definitions = new Map<string, unknown>();
  try {
    const rc = parse(readFileSync(rcFilePath, 'utf8'));
    Object.entries(rc).forEach(([key, value]) =>
      definitions.set(key, coerce(value)),
    );
  } catch {
    // ignore
  }
  return definitions;
}

/**
 *
 * @param args
 * @param args.type
 * @param args.test
 * @param args.env
 * @param buildTypes
 * @returns
 */
export function getVariables(args: Args, buildTypes: Build) {
  const { env, test, type, sentry, snow, lavamoat } = args;
  const variables = loadConfigVars(type, buildTypes);
  const version = getMetaMaskVersion();

  function set(key: string, value: unknown): void;
  function set(key: Record<string, unknown>): void;
  function set(key: string | Record<string, unknown>, value?: unknown): void {
    if (typeof key === 'object') {
      Object.entries(key).forEach(([k, v]) => variables.set(k, v));
    } else {
      variables.set(key, value);
    }
  }

  // use the gulp-build's function to set the environment variables
  setEnvironmentVariables({
    buildType: type,
    version: type === 'main' ? `${version}` : `${version}-${type}.0`,
    environment: env,
    variables: {
      set,
      isDefined(key: string): boolean {
        return variables.has(key);
      },
      get(key: string): unknown {
        return variables.get(key);
      },
      getMaybe(key: string): unknown {
        return variables.get(key);
      },
    },
    isDevBuild: env === 'development',
    isTestBuild: test,
    buildName: 'MetaMask',
  });

  // variables that are used in the webpack build's entry points
  variables.set('ENABLE_SENTRY', sentry);
  variables.set('ENABLE_SNOW', snow);
  variables.set('ENABLE_LAVAMOAT', lavamoat);

  // convert the variables to a format that can be used in the webpack build
  const safeVariables: Record<string, string> = {};
  variables.forEach((value, key) => {
    if (value === null || value === undefined) return;
    safeVariables[key] = JSON.stringify(value);
  });

  // special location for the PPOM_URI, as we don't want to copy the wasm file
  // to the build directory like the gulp build does
  variables.set(
    'PPOM_URI',
    `new URL('@blockaid/ppom_release/ppom_bg.wasm', import.meta.url)`,
  );
  // the `PPOM_URI` shouldn't be JSON stringified, as it's actually code
  safeVariables.PPOM_URI = variables.get('PPOM_URI') as string;

  return { variables, safeVariables };
}

export type Build = {
  buildTypes: Record<
    string,
    {
      features?: string[];
      env?: (string | { [k: string]: unknown })[];
    }
  >;
  env: (string | Record<string, unknown>)[];
  features: Record<
    string,
    null | { env?: (string | { [k: string]: unknown })[] }
  >;
};

/**
 *
 */
export function getBuildTypes(): Build {
  return parseYaml(readFileSync(BUILDS_YML_PATH, 'utf8'));
}

/**
 *
 * @param type
 * @param build
 * @param build.env
 * @param build.buildTypes
 * @param build.features
 * @returns
 */
function loadConfigVars(type: string, { env, buildTypes, features }: Build) {
  const activeBuild = buildTypes[type];

  const definitions = loadEnv(join(__dirname, '../../../.metamaskrc'));
  addVars(activeBuild.env);
  activeBuild.features?.forEach((feature) => addVars(features[feature]?.env));
  addVars(env);

  function addVars(pairs?: (string | { [k: string]: unknown })[]): void {
    pairs?.forEach((pair) => {
      if (typeof pair === 'string') return;
      Object.entries(pair).forEach(([key, value]) => {
        if (!definitions.has(key)) {
          definitions.set(key, value);
        }
      });
    });
  }

  return definitions;
}
