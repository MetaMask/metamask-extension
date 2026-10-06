import { spawn } from 'child_process';
import fs from 'fs';
import * as path from 'path';
import { createSandbox } from '@metamask/utils/node';

const REPOSITORY_ROOT_PATH = path.resolve(__dirname, '..');

const SCRIPT_PATH = path.join(__dirname, 'legacy-background-api.ts');
const TSX_PATH = path.join(REPOSITORY_ROOT_PATH, 'node_modules/.bin/tsx');

const METAMASK_CONTROLLER_PATH = 'app/scripts/metamask-controller.js';
const LEGACY_BACKGROUND_API_SERVICE_PATH =
  'app/scripts/services/legacy-background-api-service.ts';
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
    it('succeeds when all legacy background APIs match the snapshot', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
            class MetamaskController {
              getApi() {
                return {
                  existingProperty: this.existingProperty,
                };
              }
            }
          `,
        );
        writeFile(
          LEGACY_BACKGROUND_API_SERVICE_PATH,
          `
            export class LegacyBackgroundApiService {
              existingMethod(): void {}
            }
          `,
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: ['existingMethod'],
            'MetamaskController.getApi': ['existingProperty'],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(0);
      });
    });

    it('succeeds even when the snapshot lists names in a different order', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
            class MetamaskController {
              getApi() {
                return {
                  a: this.a,
                  b: this.b,
                };
              }
            }
          `,
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['b', 'a'],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(0);
      });
    });

    it('rejects properties added to MetamaskController.getApi, advising that they be removed', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
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
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['existingProperty'],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: New methods have been added to some legacy background APIs',
        );
        expect(result.stderr).toContain(
          '- MetamaskController.getApi\n  - newPropertyA\n  - newPropertyB',
        );
        expect(result.stderr).toContain(
          'MetamaskController.getApi is a deprecated legacy API,\nand we do not support extending it further.',
        );
      });
    });

    it('rejects methods added to LegacyBackgroundApiService, advising that they be removed', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          LEGACY_BACKGROUND_API_SERVICE_PATH,
          `
            export class LegacyBackgroundApiService {
              newMethodA(): void {}
              newMethodB(): void {}
            }
          `,
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: New methods have been added to some legacy background APIs',
        );
        expect(result.stderr).toContain(
          '- LegacyBackgroundApiService\n  - newMethodA\n  - newMethodB',
        );
        expect(result.stderr).toContain(
          'LegacyBackgroundApiService is a deprecated legacy API,\nand we do not support extending it further.',
        );
      });
    });

    it('rejects properties removed from MetamaskController.getApi, advising that the snapshot be updated', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [
              'obsoletePropertyB',
              'obsoletePropertyA',
            ],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: Methods have been removed from some legacy background APIs which are not reflected in the snapshot',
        );
        expect(result.stderr).toContain(
          '- MetamaskController.getApi\n  - obsoletePropertyA\n  - obsoletePropertyB',
        );
        expect(result.stderr).toContain(
          'Please run `yarn legacy-background-api:update` to remove them from the snapshot.',
        );
      });
    });

    it('rejects methods removed from LegacyBackgroundApiService, advising that the snapshot be updated', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: ['obsoleteMethodA', 'obsoleteMethodB'],
            'MetamaskController.getApi': [],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: Methods have been removed from some legacy background APIs which are not reflected in the snapshot',
        );
        expect(result.stderr).toContain(
          '- LegacyBackgroundApiService\n  - obsoleteMethodA\n  - obsoleteMethodB',
        );
        expect(result.stderr).toContain(
          'Please run `yarn legacy-background-api:update` to remove them from the snapshot.',
        );
      });
    });

    it('reports extra members in both APIs', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
            class MetamaskController {
              getApi() {
                return {
                  newProperty: this.newProperty,
                };
              }
            }
          `,
        );
        writeFile(
          LEGACY_BACKGROUND_API_SERVICE_PATH,
          `
            export class LegacyBackgroundApiService {
              newMethod(): void {}
            }
          `,
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: New methods have been added to some legacy background APIs',
        );
        expect(result.stderr).toContain(
          '- MetamaskController.getApi\n  - newProperty',
        );
        expect(result.stderr).toContain(
          '- LegacyBackgroundApiService\n  - newMethod',
        );
        expect(result.stderr).toContain(
          'MetamaskController.getApi and LegacyBackgroundApiService are deprecated legacy APIs,\nand we do not support extending them further.',
        );
      });
    });

    it('only reports extra members in both APIs even if there are also removed members', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
            class MetamaskController {
              getApi() {
                return {
                  newProperty: this.newProperty,
                };
              }
            }
          `,
        );
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['obsoleteProperty'],
          }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'ERROR: New methods have been added to some legacy background APIs',
        );
        expect(result.stderr).toContain(
          '- MetamaskController.getApi\n  - newProperty',
        );
        expect(result.stderr).toContain(
          'MetamaskController.getApi is a deprecated legacy API,\nand we do not support extending it further.',
        );
      });
    });

    it('fails when the snapshot does not exist', async () => {
      await withinSandbox(async ({ directoryPath }) => {
        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json does not exist',
        );
      });
    });

    it('fails when the snapshot is not valid JSON', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(SNAPSHOT_PATH, '{');

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json is not valid JSON',
        );
      });
    });

    it('fails when the snapshot does not have an entry for an API', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({ 'MetamaskController.getApi': [] }),
        );

        const result = await runScript({ directoryPath, args: ['check'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'legacy-background-api-snapshot.json must have a "LegacyBackgroundApiService" property that is an array of strings',
        );
      });
    });

    it('fails when an entry in the snapshot is not an array of strings', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          SNAPSHOT_PATH,
          JSON.stringify({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['a', 1],
          }),
        );

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
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            METAMASK_CONTROLLER_PATH,
            `
            class MetamaskController {
              getApi() {
                return {
                  propertyB: this.propertyB,
                  propertyA: this.propertyA,
                };
              }
            }
          `,
          );
          writeFile(
            LEGACY_BACKGROUND_API_SERVICE_PATH,
            `
            export class LegacyBackgroundApiService {
              methodB(): void {}

              methodA(): void {}
            }
          `,
          );
          writeFile(
            SNAPSHOT_PATH,
            JSON.stringify({
              LegacyBackgroundApiService: ['obsoleteMethod'],
              'MetamaskController.getApi': ['obsoleteProperty'],
            }),
          );

          const result = await runScript({ directoryPath, args: ['update'] });

          expect(result.exitCode).toBe(0);
          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: ['methodA', 'methodB'],
            'MetamaskController.getApi': ['propertyA', 'propertyB'],
          });
        },
      );
    });

    it('records shorthand, method, and spread properties of MetamaskController.getApi', async () => {
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            METAMASK_CONTROLLER_PATH,
            `
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
          );

          await runScript({ directoryPath, args: ['update'] });

          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [
              '...this.otherApi',
              'methodProperty',
              'shorthandProperty',
            ],
          });
        },
      );
    });

    it('ignores properties of nested objects and of objects outside of MetamaskController.getApi', async () => {
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            METAMASK_CONTROLLER_PATH,
            `
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
          );

          await runScript({ directoryPath, args: ['update'] });

          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': ['existingProperty'],
          });
        },
      );
    });

    it('records async public methods of LegacyBackgroundApiService', async () => {
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            LEGACY_BACKGROUND_API_SERVICE_PATH,
            `
            export class LegacyBackgroundApiService {
              async asyncMethod(): Promise<void> {}
            }
          `,
          );

          await runScript({ directoryPath, args: ['update'] });

          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: ['asyncMethod'],
            'MetamaskController.getApi': [],
          });
        },
      );
    });

    it('ignores private and protected methods of LegacyBackgroundApiService', async () => {
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            LEGACY_BACKGROUND_API_SERVICE_PATH,
            `
            export class LegacyBackgroundApiService {
              #helper(): void {}

              private privateHelper(): void {}

              protected protectedHelper(): void {}
            }
          `,
          );

          await runScript({ directoryPath, args: ['update'] });

          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: [],
            'MetamaskController.getApi': [],
          });
        },
      );
    });

    it('ignores properties and nested classes of LegacyBackgroundApiService', async () => {
      await withinSandbox(
        async ({ directoryPath, writeFile, readSnapshot }) => {
          writeFile(
            LEGACY_BACKGROUND_API_SERVICE_PATH,
            `
            export class LegacyBackgroundApiService {
              readonly messenger: unknown;

              existingMethod(): void {
                class OtherService {
                  otherMethod(): void {}
                }
              }
            }
          `,
          );

          await runScript({ directoryPath, args: ['update'] });

          expect(readSnapshot()).toStrictEqual({
            LegacyBackgroundApiService: ['existingMethod'],
            'MetamaskController.getApi': [],
          });
        },
      );
    });

    it('fails when MetamaskController does not exist', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(METAMASK_CONTROLLER_PATH, 'class OtherController {}');

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('MetamaskController was not found');
      });
    });

    it('fails when MetamaskController.getApi does not exist', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(METAMASK_CONTROLLER_PATH, 'class MetamaskController {}');

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'MetamaskController.getApi was not found',
        );
      });
    });

    it('fails when MetamaskController.getApi does not return an object literal', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          METAMASK_CONTROLLER_PATH,
          `
            class MetamaskController {
              getApi() {
                return this.api;
              }
            }
          `,
        );

        const result = await runScript({ directoryPath, args: ['update'] });

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain(
          'MetamaskController.getApi does not return an object literal',
        );
      });
    });

    it('fails when LegacyBackgroundApiService does not exist', async () => {
      await withinSandbox(async ({ directoryPath, writeFile }) => {
        writeFile(
          LEGACY_BACKGROUND_API_SERVICE_PATH,
          'export class OtherService {}',
        );

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
      const result = await runScript({ directoryPath, args: [] });

      expect(result.exitCode).toBe(1);
    });
  });
});

/**
 * Runs a function inside a new temporary directory, which stands in for the
 * root of the repository.
 *
 * @param callback - The function to run. It receives the sandbox path and
 * helpers for writing files and reading the snapshot within that sandbox.
 */
async function withinSandbox(
  callback: (options: {
    directoryPath: string;
    writeFile: (filePath: string, contents: string) => void;
    readSnapshot: () => unknown;
  }) => Promise<void>,
): Promise<void> {
  const sandbox = createSandbox('legacy-background-api');
  await sandbox.withinSandbox(async ({ directoryPath }) => {
    const writeFile = (filePath: string, contents: string): void => {
      const absoluteFilePath = path.join(directoryPath, filePath);
      fs.mkdirSync(path.dirname(absoluteFilePath), { recursive: true });
      fs.writeFileSync(absoluteFilePath, contents);
    };

    writeFile(METAMASK_CONTROLLER_PATH, EMPTY_CONTROLLER_SOURCE);
    writeFile(LEGACY_BACKGROUND_API_SERVICE_PATH, EMPTY_SERVICE_SOURCE);

    await callback({
      directoryPath,
      writeFile,
      readSnapshot: () =>
        JSON.parse(
          fs.readFileSync(path.join(directoryPath, SNAPSHOT_PATH), 'utf8'),
        ),
    });
  });
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
}): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
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
