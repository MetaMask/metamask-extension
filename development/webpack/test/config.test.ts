import fs from 'node:fs';
import { describe, it, after, mock } from 'node:test';
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
    function mockRc(env: Record<string, string> = {}) {
      mock.method(fs, 'readFileSync', (path: string, options: object) => {
        if (path === resolve(__dirname, '../../../.metamaskrc')) {
          // mock `.metamaskrc`, as users might have customized it which may
          // break our tests
          return `
${Object.entries(env)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')}
`;
        }
        return originalReadFileSync(path, options);
      });
    }
    after(() => mock.restoreAll());

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

    it('should prefer .metamaskrc variables over others', () => {
      const buildTypes = loadBuildTypesConfig();
      const { args } = parseArgv([], buildTypes);
      const defaultVars = config.getVariables(args, buildTypes);

      // verify the default value of the main build is false
      assert.strictEqual(defaultVars.variables.get('ALLOW_LOCAL_SNAPS'), false);

      mockRc({
        ALLOW_LOCAL_SNAPS: 'true',
      });

      const overrides = config.getVariables(args, buildTypes);

      // verify the value of the main build is set to the value in .metamaskrc
      assert.strictEqual(overrides.variables.get('ALLOW_LOCAL_SNAPS'), true);
    });

    it('should return valid build variables for a non-default build', () => {
      mockRc({
        // required by the `beta` build type
        SEGMENT_BETA_WRITE_KEY: '.',
      });
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
  });
});
