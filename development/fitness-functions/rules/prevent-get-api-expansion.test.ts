import fs from 'fs';
import * as path from 'path';
import { withinTemporaryGitRepository } from '../common/temporary-git-repository';
import { generateModifyFilesDiff } from '../common/test-data';
import { preventGetApiExpansion } from './prevent-get-api-expansion';

const CONTROLLER_PATH = 'app/scripts/metamask-controller.js';

const REAL_CONTROLLER_PATH = path.resolve(
  __dirname,
  '../../..',
  CONTROLLER_PATH,
);

describe('preventGetApiExpansion', () => {
  it('passes without reading the base commit when the diff does not modify the controller', () => {
    const result = preventGetApiExpansion(
      generateModifyFilesDiff('ui/example.ts'),
      'commit-which-does-not-exist',
    );

    expect(result).toBe(true);
  });

  it('rejects a new property even when another property is removed', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {
                oldMethod: this.oldMethod,
              };
            }
          }
        `,
        currentContents: `
          class MetamaskController {
            getApi() {
              return {
                newMethod: this.newMethod,
              };
            }
          }
        `,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('rejects a new shorthand property', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {};
            }
          }
        `,
        currentContents: `
          class MetamaskController {
            getApi() {
              return {
                newShorthand,
              };
            }
          }
        `,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('rejects a new method property', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {};
            }
          }
        `,
        currentContents: `
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
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('allows edits to an existing property', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.existingMethod,
              };
            }
          }
        `,
        currentContents: `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.controllerMessenger.call.bind(
                  this.controllerMessenger,
                  'SomeController:existingMethod',
                ),
              };
            }
          }
        `,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('allows removal of a property', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.existingMethod,
                obsoleteMethod: this.obsoleteMethod,
              };
            }
          }
        `,
        currentContents: `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: this.existingMethod,
              };
            }
          }
        `,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('ignores properties added inside a nested object', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getApi() {
              return {
                existingMethod: () => ({}),
              };
            }
          }
        `,
        currentContents: `
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
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('ignores properties added to objects outside of getApi', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: `
          class MetamaskController {
            getState() {
              return {};
            }

            getApi() {
              return {};
            }
          }
        `,
        currentContents: `
          class MetamaskController {
            getState() {
              return {
                newStateProperty: true,
              };
            }

            getApi() {
              return {};
            }
          }
        `,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('passes when the real controller is unchanged', async () => {
    await withinTemporaryGitRepository(({ writeFile, commitAllFiles }) => {
      const realControllerSource = fs.readFileSync(
        REAL_CONTROLLER_PATH,
        'utf8',
      );
      writeFile(CONTROLLER_PATH, realControllerSource);
      const baseRef = commitAllFiles();

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('rejects a property added to the real controller', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const realControllerSource = fs.readFileSync(
        REAL_CONTROLLER_PATH,
        'utf8',
      );
      const expandedControllerSource = realControllerSource.replace(
        /(\n {2}getApi\(\) \{[\s\S]*?\n {4}return \{\n)/u,
        '$1      newLegacyMethod: () => true,\n',
      );
      expect(expandedControllerSource).not.toBe(realControllerSource);
      const baseRef = createFileWithChanges({
        filePath: CONTROLLER_PATH,
        baseContents: realControllerSource,
        currentContents: expandedControllerSource,
      });

      const result = preventGetApiExpansion(
        generateModifyFilesDiff(CONTROLLER_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });
});
