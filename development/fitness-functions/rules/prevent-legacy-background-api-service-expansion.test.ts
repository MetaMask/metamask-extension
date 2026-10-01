import fs from 'fs';
import * as path from 'path';
import { withinTemporaryGitRepository } from '../common/temporary-git-repository';
import { generateModifyFilesDiff } from '../common/test-data';
import { preventLegacyBackgroundApiServiceExpansion } from './prevent-legacy-background-api-service-expansion';

const SERVICE_PATH = 'app/scripts/services/legacy-background-api-service.ts';

const REAL_SERVICE_PATH = path.resolve(__dirname, '../../..', SERVICE_PATH);

describe('preventLegacyBackgroundApiServiceExpansion', () => {
  it('passes without reading the base commit when the diff does not modify the service', () => {
    const result = preventLegacyBackgroundApiServiceExpansion(
      generateModifyFilesDiff('ui/example.ts'),
      'commit-which-does-not-exist',
    );

    expect(result).toBe(true);
  });

  it('rejects a new public method', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {}
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            newMethod(): void {}
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('rejects a new async public method', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {}
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            async newMethod(): Promise<void> {}
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('rejects a new public method even when another method is removed', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {
            oldMethod(): void {}
          }
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            newMethod(): void {}
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });

  it('allows changes to an existing public method', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {}
          }
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {
              this.#helper();
            }
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('allows private helper methods to be added', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {}
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            #newHelper(): void {}

            private newPrivateHelper(): void {}

            protected newProtectedHelper(): void {}
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('ignores a method added to a nested class', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {
              class OtherService {}
            }
          }
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {
              class OtherService {
                newMethod(): void {}
              }
            }
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('allows removal of a public method', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {}

            obsoleteMethod(): void {}
          }
        `,
        currentContents: `
          export class LegacyBackgroundApiService {
            existingMethod(): void {}
          }
        `,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('passes when the real service is unchanged', async () => {
    await withinTemporaryGitRepository(({ writeFile, commitAllFiles }) => {
      const realServiceSource = fs.readFileSync(REAL_SERVICE_PATH, 'utf8');
      writeFile(SERVICE_PATH, realServiceSource);
      const baseRef = commitAllFiles();

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(true);
    });
  });

  it('rejects a public method added to the real service', async () => {
    await withinTemporaryGitRepository(({ createFileWithChanges }) => {
      const realServiceSource = fs.readFileSync(REAL_SERVICE_PATH, 'utf8');
      const expandedServiceSource = realServiceSource.replace(
        'export class LegacyBackgroundApiService {\n',
        'export class LegacyBackgroundApiService {\n  newLegacyMethod(): void {}\n',
      );
      expect(expandedServiceSource).not.toBe(realServiceSource);
      const baseRef = createFileWithChanges({
        filePath: SERVICE_PATH,
        baseContents: realServiceSource,
        currentContents: expandedServiceSource,
      });

      const result = preventLegacyBackgroundApiServiceExpansion(
        generateModifyFilesDiff(SERVICE_PATH),
        baseRef,
      );

      expect(result).toBe(false);
    });
  });
});
