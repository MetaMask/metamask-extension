import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { setEnvironmentVariables } from '../../build/set-environment-variables';
import type { Variables } from '../../lib/variables';
import type { BuildTypesConfig, BuildType } from '../../lib/build-type';
import { type Args } from './cli';
import { getExtensionVersion } from './version';

/**
 * Coerce `"true"`, `"false"`, and `"null"` to their respective JavaScript
 * values. Coerce the empty string (`""`) to `undefined`;
 *
 * @param value
 * @returns
 */
function coerce(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === '') return null;
  return value;
}

/**
 * @returns The definitions loaded from process.env.
 */
function loadEnv(): Map<string, unknown> {
  const definitions = new Map<string, unknown>();
  Object.entries(process.env).forEach(([key, value]) => {
    if (typeof value === 'undefined') return;
    definitions.set(key, coerce(value));
  });
  return definitions;
}

/**
 * @param definitions
 * @param rcFilePath - The path to the rc file.
 */
function addRc(definitions: Map<string, unknown>, rcFilePath: string): void {
  try {
    const rc = parse(readFileSync(rcFilePath, 'utf8'));
    Object.entries(rc).forEach(([key, value]) => {
      if (definitions.has(key)) return;
      definitions.set(key, coerce(value));
    });
  } catch {
    // ignore
  }
}

/**
 * Get the name for the current build.
 *
 * @param type
 * @param build
 * @param isDev
 * @param args
 */
export function getBuildName(
  type: string,
  build: BuildType,
  isDev: boolean,
  args: Pick<Args, 'manifest_version' | 'lavamoat' | 'snow'>,
) {
  const buildName =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    build.buildNameOverride ||
    `MetaMask ${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
  if (isDev) {
    const mv3Str = args.manifest_version === 3 ? ' MV3' : '';
    const lavamoatStr = args.lavamoat ? ' lavamoat' : '';
    const snowStr = args.snow ? ' snow' : '';
    return `${buildName}${mv3Str}${lavamoatStr}${snowStr}`;
  }
  return buildName;
}

/**
 * Computes the `variables` (extension runtime's `process.env.*`).
 *
 * @param args
 * @param args.type
 * @param args.test
 * @param args.env
 * @param buildConfig
 */
export function getVariables(
  { type, env, ...args }: Args,
  buildConfig: BuildTypesConfig,
) {
  const activeBuild = buildConfig.buildTypes[type];
  const variables = loadConfigVars(activeBuild, buildConfig);
  const version = getExtensionVersion(type, activeBuild, args.releaseVersion);
  const isDevBuild = env === 'development';

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
    buildName: getBuildName(type, activeBuild, isDevBuild, args),
    buildType: type,
    environment: env,
    isDevBuild,
    isTestBuild: args.test,
    version: version.versionName,
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
    } as Variables,
  });

  // variables that are used in the webpack build's entry points. Our runtime
  // code checks for the _string_ `"true"`, so we cast to string here.
  variables.set('ENABLE_SENTRY', args.sentry.toString());
  variables.set('ENABLE_SNOW', args.snow.toString());
  variables.set('ENABLE_LAVAMOAT', Boolean(args.lavamoat).toString());

  // convert the variables to a format that can be used by SWC, which expects
  // values be JSON stringified, as it JSON.parses them internally.
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

  return { variables, safeVariables, version };
}

/**
 * Loads configuration variables from process.env, .metamaskrc, and build.yml.
 *
 * The order of precedence is:
 * 1. process.env
 * 2. .metamaskrc
 * 3. build.yml
 *
 * i.e., if a variable is defined in `process.env`, it will take precedence over
 * the same variable defined in `.metamaskrc` or `build.yml`.
 *
 * @param activeBuild
 * @param build
 * @param build.env
 * @returns
 */
function loadConfigVars(
  activeBuild: Pick<BuildType, 'env' | 'features'>,
  { env }: BuildTypesConfig,
) {
  const definitions = loadEnv();
  addRc(definitions, join(__dirname, '../../../.metamaskrc'));
  addVars(activeBuild.env);
  addVars(env);

  function addVars(pairs: Record<string, unknown> = {}): void {
    Object.entries(pairs).forEach(([key, value]) => {
      if (value === undefined) return;
      if (definitions.has(key)) return;
      definitions.set(key, value);
    });
  }

  return definitions;
}
