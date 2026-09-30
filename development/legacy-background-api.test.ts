import { spawn } from 'child_process';
import fs from 'fs';
import * as path from 'path';
import { createSandbox } from '@metamask/utils/node';

/**
 * The result of running the script.
 */
type ScriptResult = {
  /**
   * The exit code of the process.
   */
  exitCode: number | null;
  /**
   * Everything the process wrote to standard output.
   */
  stdout: string;
  /**
   * Everything the process wrote to standard error.
   */
  stderr: string;
};

const REPOSITORY_ROOT_PATH = path.resolve(__dirname, '..');

const SCRIPT_PATH = path.join(__dirname, 'legacy-background-api.ts');

const TSX_PATH = path.join(REPOSITORY_ROOT_PATH, 'node_modules/.bin/tsx');

const CONTROLLER_PATH = 'app/scripts/metamask-controller.js';

const SERVICE_PATH = 'app/scripts/services/legacy-background-api-service.ts';

const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

const EMPTY_CONTROLLER_SOURCE = `
  class MetamaskController {
    getApi() {
      return {};
    }
  }
`;

const EMPTY_SERVICE_SOURCE = `
  export class LegacyBackgroundApiService {}
`;

describe('legacy-background-api.ts', () => {
  describe('check', () => {
    it('succeeds when the legacy background APIs match the snapshot', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  existingProperty: this.existingProperty,
                };
              }
            }
          `,
          serviceSource: `
            export class LegacyBackgroundApiService {
              existingMethod(): void {}
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: ['existingMethod'],
            'MetamaskController.getApi': ['existingProperty'],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(0);
      });
    });

    it('succeeds when the snapshot lists names in a different order', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  a: this.a,
                  b: this.b,
                };
              }
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['b', 'a'],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(0);
      });
    });

    it('rejects properties added to MetamaskController.getApi, advising that they be removed', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  newPropertyB: this.newPropertyB,
                  existingProperty: this.existingProperty,
                  newPropertyA: this.newPropertyA,
                };
              }
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['existingProperty'],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'MetamaskController.getApi has properties which are not listed in legacy-background-api-snapshot.json:\n- newPropertyA\n- newPropertyB',
        );
        expect(result.stderr).toContain(
          'MetamaskController.getApi is frozen, so please remove these properties.',
        );
      });
    });

    it('rejects methods added to LegacyBackgroundApiService, advising that they be removed', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          serviceSource: `
            export class LegacyBackgroundApiService {
              newMethod(): void {}
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'LegacyBackgroundApiService has methods which are not listed in legacy-background-api-snapshot.json:\n- newMethod',
        );
        expect(result.stderr).toContain(
          'LegacyBackgroundApiService is frozen, so please remove these methods.',
        );
      });
    });

    it('rejects properties removed from MetamaskController.getApi, advising that the snapshot be updated', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [
              'obsoletePropertyB',
              'obsoletePropertyA',
            ],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json lists properties which no longer exist in MetamaskController.getApi:\n- obsoletePropertyA\n- obsoletePropertyB',
        );
        expect(result.stderr).toContain(
          'Please run `yarn legacy-background-api:update` to remove them from the snapshot.',
        );
      });
    });

    it('rejects methods removed from LegacyBackgroundApiService, advising that the snapshot be updated', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: ['obsoleteMethod'],
            'MetamaskController.getApi': [],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json lists methods which no longer exist in LegacyBackgroundApiService:\n- obsoleteMethod',
        );
        expect(result.stderr).toContain(
          'Please run `yarn legacy-background-api:update` to remove them from the snapshot.',
        );
      });
    });

    it('reports discrepancies in both APIs at once', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  newProperty: this.newProperty,
                };
              }
            }
          `,
          serviceSource: `
            export class LegacyBackgroundApiService {
              newMethod(): void {}
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.stderr).toContain('- newProperty');
        expect(result.stderr).toContain('- newMethod');
      });
    });

    it('fails when the snapshot does not exist', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({ directoryPath });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json does not exist',
        );
      });
    });

    it('fails when the snapshot is not valid JSON', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({ directoryPath, snapshot: '{' });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json is not valid JSON',
        );
      });
    });

    it('fails when the snapshot does not have an entry for an API', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          snapshot: JSON.stringify({ 'MetamaskController.getApi': [] }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json must have a "LegacyBackgroundApiService" property that is an array of strings',
        );
      });
    });

    it('fails when an entry in the snapshot is not an array of strings', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['a', 1],
          }),
        });

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json must have a "MetamaskController.getApi" property that is an array of strings',
        );
      });
    });
  });

  describe('update', () => {
    it('replaces the snapshot with the sorted names of both APIs', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  propertyB: this.propertyB,
                  propertyA: this.propertyA,
                };
              }
            }
          `,
          serviceSource: `
            export class LegacyBackgroundApiService {
              methodB(): void {}

              methodA(): void {}
            }
          `,
          snapshot: JSON.stringify({
            LegacyBackgroundApiService: ['obsoleteMethod'],
            'MetamaskController.getApi': ['obsoleteProperty'],
          }),
        });

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(0);
        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: ['methodA', 'methodB'],
          'MetamaskController.getApi': ['propertyA', 'propertyB'],
        });
      });
    });

    it('records shorthand, method, and spread properties of MetamaskController.getApi', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return {
                  shorthandProperty,
                  methodProperty() {
                    return true;
                  },
                  ...this.otherApi,
                };
              }
            }
          `,
        });

        await runScript({ directoryPath, args: ['update'] });

        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: [],
          'MetamaskController.getApi': [
            '...this.otherApi',
            'methodProperty',
            'shorthandProperty',
          ],
        });
      });
    });

    it('ignores properties of nested objects and of objects outside of MetamaskController.getApi', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getState() {
                return {
                  stateProperty: true,
                };
              }

              getApi() {
                return {
                  existingProperty: () => ({
                    nestedProperty: true,
                  }),
                };
              }
            }
          `,
        });

        await runScript({ directoryPath, args: ['update'] });

        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: [],
          'MetamaskController.getApi': ['existingProperty'],
        });
      });
    });

    it('records async public methods of LegacyBackgroundApiService', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          serviceSource: `
            export class LegacyBackgroundApiService {
              async asyncMethod(): Promise<void> {}
            }
          `,
        });

        await runScript({ directoryPath, args: ['update'] });

        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: ['asyncMethod'],
          'MetamaskController.getApi': [],
        });
      });
    });

    it('ignores private and protected methods of LegacyBackgroundApiService', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          serviceSource: `
            export class LegacyBackgroundApiService {
              #helper(): void {}

              private privateHelper(): void {}

              protected protectedHelper(): void {}
            }
          `,
        });

        await runScript({ directoryPath, args: ['update'] });

        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: [],
          'MetamaskController.getApi': [],
        });
      });
    });

    it('ignores properties and nested classes of LegacyBackgroundApiService', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          serviceSource: `
            export class LegacyBackgroundApiService {
              readonly messenger: unknown;

              existingMethod(): void {
                class OtherService {
                  otherMethod(): void {}
                }
              }
            }
          `,
        });

        await runScript({ directoryPath, args: ['update'] });

        expect(readSnapshot(directoryPath)).toStrictEqual({
          LegacyBackgroundApiService: ['existingMethod'],
          'MetamaskController.getApi': [],
        });
      });
    });

    it('fails when MetamaskController does not exist', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: 'class OtherController {}',
        });

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('MetamaskController was not found');
      });
    });

    it('fails when MetamaskController.getApi does not exist', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: 'class MetamaskController {}',
        });

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'MetamaskController.getApi was not found',
        );
      });
    });

    it('fails when MetamaskController.getApi does not return an object literal', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          controllerSource: `
            class MetamaskController {
              getApi() {
                return this.api;
              }
            }
          `,
        });

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'MetamaskController.getApi does not return an object literal',
        );
      });
    });

    it('fails when LegacyBackgroundApiService does not exist', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        setUpRepository({
          directoryPath,
          serviceSource: 'export class OtherService {}',
        });

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'LegacyBackgroundApiService was not found',
        );
      });
    });
  });

  it('fails when no command is given', async () => {
    await withinSandbox(async ({ directoryPath }) => {
      setUpRepository({ directoryPath });

      const result = await runScript({ directoryPath, args: [] });

      expect(result.exitCode).toBe(1);
    });
  });
});

/**
 * Runs a function inside a new temporary directory, which stands in for the
 * root of the repository.
 *
 * @param callback - The function to run. It receives the path of the
 * directory.
 */
async function withinSandbox(
  callback: (options: { directoryPath: string }) => Promise<void>,
): Promise<void> {
  const sandbox = createSandbox('legacy-background-api');
  await sandbox.withinSandbox(callback);
}

/**
 * Writes the files that the script reads into the given directory.
 *
 * @param options - The options.
 * @param options.directoryPath - The directory standing in for the root of the
 * repository.
 * @param options.controllerSource - The contents of the file that defines
 * `MetamaskController`.
 * @param options.serviceSource - The contents of the file that defines
 * `LegacyBackgroundApiService`.
 * @param options.snapshot - The contents of the snapshot. If omitted, the
 * snapshot is not created.
 */
function setUpRepository({
  directoryPath,
  controllerSource = EMPTY_CONTROLLER_SOURCE,
  serviceSource = EMPTY_SERVICE_SOURCE,
  snapshot,
}: {
  directoryPath: string;
  controllerSource?: string;
  serviceSource?: string;
  snapshot?: string;
}): void {
  writeFile(path.join(directoryPath, CONTROLLER_PATH), controllerSource);
  writeFile(path.join(directoryPath, SERVICE_PATH), serviceSource);
  if (snapshot !== undefined) {
    writeFile(path.join(directoryPath, SNAPSHOT_PATH), snapshot);
  }
}

/**
 * Writes a file, creating any directories leading up to it.
 *
 * @param filePath - The absolute path of the file.
 * @param contents - The contents of the file.
 */
function writeFile(filePath: string, contents: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

/**
 * Reads and parses the snapshot in the given directory.
 *
 * @param directoryPath - The directory standing in for the root of the
 * repository.
 * @returns The parsed snapshot.
 */
function readSnapshot(directoryPath: string): unknown {
  return JSON.parse(
    fs.readFileSync(path.join(directoryPath, SNAPSHOT_PATH), 'utf8'),
  );
}

/**
 * Runs the script in the given directory, as it would be run from the root of
 * the repository.
 *
 * @param options - The options.
 * @param options.directoryPath - The directory to run the script in.
 * @param options.args - The arguments to pass to the script.
 * @returns The exit code and output of the script.
 */
async function runScript({
  directoryPath,
  args,
}: {
  directoryPath: string;
  args: string[];
}): Promise<ScriptResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(TSX_PATH, [SCRIPT_PATH, ...args], {
      cwd: directoryPath,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}
