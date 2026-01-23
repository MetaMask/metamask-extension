import fs from 'node:fs';
import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { version } from '../../../package.json';
import { loadBuildTypesConfig } from '../../lib/build-type';
import * as config from '../utils/config';
import { parseArgv } from '../utils/cli';

describe('./utils/config.ts', () => {
  // variables logic is complex, and is "owned" mostly by the other build
  // system, so we don't check for everything, just that the interface is
  // behaving
  describe('variables', () => {
    const originalReadFileSync = fs.readFileSync;
    function mockRc(
      env: Record<string, string> = {},
      prodEnv: Record<string, string> = {},
    ) {
      mock.method(fs, 'readFileSync', (path: string, options: object) => {
        // mock the rc files as users might have customized it which may break our tests
        if (path === resolve(__dirname, '../../../.metamaskrc')) {
          return `
            ${Object.entries(env)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n')}
            `;
        } else if (path === resolve(__dirname, '../../../.metamaskprodrc')) {
          return `
            ${Object.entries(prodEnv)
              .map(([key, value]) => `${key}=${value}`)
              .join('\n')}
            `;
        }
        return originalReadFileSync(path, options);
      });
    }
    afterEach(() => mock.restoreAll());

    it('should return valid build variables for the default build', () => {
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);
      const { variables, safeVariables } = config.getVariables(
        args,
        buildTypes,
      );

      assert.strictEqual(variables.get('METAMASK_VERSION'), version);
      assert.strictEqual(variables.get('IN_TEST'), args.test);
      assert.strictEqual(variables.get('METAMASK_BUILD_TYPE'), args.type);
      assert.strictEqual(variables.get('NODE_ENV'), args.env);

      // PPOM_URI is unique in that it is code, and has not been JSON.stringified, so we check it separately:
      assert.strictEqual(
        safeVariables.PPOM_URI,
        `new URL('@blockaid/ppom_release/ppom_bg.wasm', import.meta.url)`,
      );
    });

    it('should prefer .metamaskprodrc over .metamaskrc', () => {
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);
      const defaultVars = config.getVariables(args, buildTypes);

      // verify the default value of the main build is false
      assert.strictEqual(defaultVars.variables.get('ALLOW_LOCAL_SNAPS'), false);

      mockRc({ ALLOW_LOCAL_SNAPS: 'false' }, { ALLOW_LOCAL_SNAPS: 'true' });

      const overrides = config.getVariables(args, buildTypes);

      // verify the value of the main build is set to the value in .metamaskprodrc
      assert.strictEqual(overrides.variables.get('ALLOW_LOCAL_SNAPS'), true);
    });

    it('should prefer .metamaskrc variables over builds.yml', () => {
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);
      const defaultVars = config.getVariables(args, buildTypes);

      // verify the default value of the main build is false
      assert.strictEqual(defaultVars.variables.get('ALLOW_LOCAL_SNAPS'), false);

      mockRc({ ALLOW_LOCAL_SNAPS: 'true' });

      const overrides = config.getVariables(args, buildTypes);

      // verify the value of the main build is set to the value in .metamaskrc
      assert.strictEqual(overrides.variables.get('ALLOW_LOCAL_SNAPS'), true);
    });

    it('should return valid build variables for a non-default build', () => {
      // required by the `beta` build type
      mockRc({ SEGMENT_BETA_WRITE_KEY: '.' });
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv(
        ['--type', 'beta', '--test', '--env', 'production'],
        buildTypes,
      );
      const { variables } = config.getVariables(args, buildTypes);
      assert.strictEqual(
        variables.get('METAMASK_VERSION'),
        `${version}-${args.type}.0`,
      );
      assert.strictEqual(variables.get('IN_TEST'), args.test);
      assert.strictEqual(variables.get('METAMASK_BUILD_TYPE'), args.type);
      assert.strictEqual(variables.get('NODE_ENV'), args.env);
    });

    it("should handle true/false/null/'' in rc", () => {
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);

      mockRc({
        TESTING_TRUE: 'true',
        TESTING_FALSE: 'false',
        TESTING_NULL: 'null',
        TESTING_MISC: 'MISC',
        TESTING_EMPTY_STRING: '',
      });

      const { variables } = config.getVariables(args, buildTypes);

      assert.strictEqual(variables.get('TESTING_TRUE'), true);
      assert.strictEqual(variables.get('TESTING_FALSE'), false);
      assert.strictEqual(variables.get('TESTING_NULL'), null);
      assert.strictEqual(variables.get('TESTING_MISC'), 'MISC');
      assert.strictEqual(variables.get('TESTING_EMPTY_STRING'), null);
    });

    it('should return buildEnvVarDeclarations with keys from activeBuild.env and buildConfig.env', () => {
      mockRc();
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);
      const { buildEnvVarDeclarations } = config.getVariables(args, buildTypes);

      assert.ok(Array.isArray(buildEnvVarDeclarations));
      assert.ok(buildEnvVarDeclarations.length > 0);

      // Verify it includes keys from the main build type's env (e.g., INFURA_PROD_PROJECT_ID)
      assert.ok(
        buildEnvVarDeclarations.includes('INFURA_PROD_PROJECT_ID'),
        'should include build type specific env vars',
      );

      // Verify it includes keys from the global buildConfig.env (e.g., SENTRY_DSN)
      assert.ok(
        buildEnvVarDeclarations.includes('SENTRY_DSN'),
        'should include global config env vars',
      );
    });

    it('should throw when production environment is missing required variables', () => {
      mockRc();
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv(
        ['--targetEnvironment', 'production'],
        buildTypes,
      );

      assert.throws(
        () => config.getVariables(args, buildTypes),
        (error: Error) => {
          assert.ok(
            error.message.includes(
              'Some variables required to build production target are not defined',
            ),
          );
          return true;
        },
      );
    });

    it('should not throw when all required production variables are defined', () => {
      const buildTypes = loadBuildTypesConfig();
      const activeBuild = buildTypes.buildTypes['main'];
      const requiredVars = Object.keys(activeBuild.env ?? {});

      const rcVars: Record<string, string> = {};
      for (const varName of requiredVars) {
        rcVars[varName] = 'test-value';
      }

      // Some variables require more specific values because of additional validation
      rcVars.SEEDLESS_ONBOARDING_ENABLED = 'false';
      rcVars.INFURA_PROD_PROJECT_ID = 'dd98248f370d4063b81c0299f919dc11';
      rcVars.INFURA_ENV_KEY_REF = 'INFURA_PROD_PROJECT_ID';
      rcVars.SEGMENT_WRITE_KEY_REF = 'SEGMENT_PROD_WRITE_KEY';

      mockRc(rcVars);

      const { args } = parseArgv(
        ['--targetEnvironment', 'production'],
        buildTypes,
      );

      assert.doesNotThrow(() => config.getVariables(args, buildTypes));
    });

    it('should not validate production variables when environment is not production', () => {
      mockRc();
      const buildTypes = loadBuildTypesConfig();

      const { args: devArgs } = parseArgv([], buildTypes);
      assert.doesNotThrow(() => config.getVariables(devArgs, buildTypes));

      const { args: stagingArgs } = parseArgv(
        ['--targetEnvironment', 'staging'],
        buildTypes,
      );
      assert.doesNotThrow(() => config.getVariables(stagingArgs, buildTypes));
    });
  });
});
