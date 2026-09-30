import fs from 'fs';
import * as path from 'path';
import { withinTemporaryDirectory } from '../common/temporary-directory';
import { preventGetApiExpansion } from './prevent-get-api-expansion';

const CONTROLLER_PATH = 'app/scripts/metamask-controller.js';

const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

const REPOSITORY_ROOT_PATH = path.resolve(__dirname, '../../..');

describe('preventGetApiExpansion', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('passes when the properties of getApi match the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.existingMethod,
                existingShorthand,
                existingMethodProperty() {
                  return true;
                },
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({
          'MetamaskController.getApi': [
            'existingMethod',
            'existingShorthand',
            'existingMethodProperty',
          ],
        }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(true);
    });
  });

  it('rejects a property that is not in the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                newMethod: this.newMethod,
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(false);
    });
  });

  it('rejects a shorthand property that is not in the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                newShorthand,
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(false);
    });
  });

  it('rejects a method property that is not in the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                newMethod() {
                  return true;
                },
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(false);
    });
  });

  it('rejects a property that is in the snapshot but no longer in getApi', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.existingMethod,
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({
          'MetamaskController.getApi': ['existingMethod', 'obsoleteMethod'],
        }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(false);
    });
  });

  it('identifies a spread property by its source text', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                ...this.otherApi,
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': ['...this.otherApi'] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(true);
    });
  });

  it('ignores properties inside a nested object', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: () => ({
                  extraOption: true,
                }),
              };
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': ['existingMethod'] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(true);
    });
  });

  it('ignores properties of objects outside of getApi', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getState() {
              return {
                stateProperty: true,
              };
            }

            getApi() {
              return {};
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      const result = preventGetApiExpansion();

      expect(result).toBe(true);
    });
  });

  it('throws when MetamaskController does not exist', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(CONTROLLER_PATH, 'class OtherController {}');
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      expect(() => preventGetApiExpansion()).toThrow(
        'MetamaskController was not found',
      );
    });
  });

  it('throws when MetamaskController.getApi does not exist', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(CONTROLLER_PATH, 'class MetamaskController {}');
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      expect(() => preventGetApiExpansion()).toThrow(
        'MetamaskController.getApi was not found',
      );
    });
  });

  it('throws when MetamaskController.getApi does not return an object literal', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        CONTROLLER_PATH,
        `
          class MetamaskController {
            getApi() {
              return this.api;
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ 'MetamaskController.getApi': [] }),
      );

      expect(() => preventGetApiExpansion()).toThrow(
        'MetamaskController.getApi does not return an object literal',
      );
    });
  });

  it('passes against the real controller and snapshot', async () => {
    const realControllerSource = readRepositoryFile(CONTROLLER_PATH);
    const realSnapshot = readRepositoryFile(SNAPSHOT_PATH);

    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(CONTROLLER_PATH, realControllerSource);
      writeFile(SNAPSHOT_PATH, realSnapshot);

      const result = preventGetApiExpansion();

      expect(result).toBe(true);
    });
  });

  it('rejects a property added to the real controller', async () => {
    const realControllerSource = readRepositoryFile(CONTROLLER_PATH);
    const realSnapshot = readRepositoryFile(SNAPSHOT_PATH);
    const expandedControllerSource = realControllerSource.replace(
      /(\n {2}getApi\(\) \{[\s\S]*?\n {4}return \{\n)/u,
      '$1      newLegacyMethod: () => true,\n',
    );
    expect(expandedControllerSource).not.toBe(realControllerSource);

    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(CONTROLLER_PATH, expandedControllerSource);
      writeFile(SNAPSHOT_PATH, realSnapshot);

      const result = preventGetApiExpansion();

      expect(result).toBe(false);
    });
  });
});

/**
 * Reads a file from the real repository, so that tests can check the committed
 * API against the committed snapshot.
 *
 * @param filePath - The repository-relative path of the file.
 * @returns The contents of the file.
 */
function readRepositoryFile(filePath: string): string {
  return fs.readFileSync(path.join(REPOSITORY_ROOT_PATH, filePath), 'utf8');
}
