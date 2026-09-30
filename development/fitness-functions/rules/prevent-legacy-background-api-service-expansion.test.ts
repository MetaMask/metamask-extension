import fs from 'fs';
import * as path from 'path';
import { withinTemporaryDirectory } from '../common/temporary-directory';
import { preventLegacyBackgroundApiServiceExpansion } from './prevent-legacy-background-api-service-expansion';

const SERVICE_PATH = 'app/scripts/services/legacy-background-api-service.ts';

const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

const REPOSITORY_ROOT_PATH = path.resolve(__dirname, '../../..');

describe('preventLegacyBackgroundApiServiceExpansion', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  it('passes when the public methods of the service match the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            existingMethod(): void {}

            async existingAsyncMethod(): Promise<void> {}
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({
          LegacyBackgroundApiService: ['existingMethod', 'existingAsyncMethod'],
        }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(true);
    });
  });

  it('rejects a public method that is not in the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            newMethod(): void {}
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: [] }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(false);
    });
  });

  it('rejects an async public method that is not in the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            async newMethod(): Promise<void> {}
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: [] }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(false);
    });
  });

  it('rejects a public method that is in the snapshot but no longer in the service', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            existingMethod(): void {}
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({
          LegacyBackgroundApiService: ['existingMethod', 'obsoleteMethod'],
        }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(false);
    });
  });

  it('ignores private and protected methods', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            #helper(): void {}

            private privateHelper(): void {}

            protected protectedHelper(): void {}
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: [] }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(true);
    });
  });

  it('ignores properties', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            readonly messenger: unknown;
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: [] }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(true);
    });
  });

  it('ignores methods of a nested class', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(
        SERVICE_PATH,
        `
          export class LegacyBackgroundApiService {
            existingMethod(): void {
              class OtherService {
                otherMethod(): void {}
              }
            }
          }
        `,
      );
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: ['existingMethod'] }),
      );

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(true);
    });
  });

  it('throws when LegacyBackgroundApiService does not exist', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(SERVICE_PATH, 'export class OtherService {}');
      writeFile(
        SNAPSHOT_PATH,
        JSON.stringify({ LegacyBackgroundApiService: [] }),
      );

      expect(() => preventLegacyBackgroundApiServiceExpansion()).toThrow(
        'LegacyBackgroundApiService was not found',
      );
    });
  });

  it('passes against the real service and snapshot', async () => {
    const realServiceSource = readRepositoryFile(SERVICE_PATH);
    const realSnapshot = readRepositoryFile(SNAPSHOT_PATH);

    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(SERVICE_PATH, realServiceSource);
      writeFile(SNAPSHOT_PATH, realSnapshot);

      const result = preventLegacyBackgroundApiServiceExpansion();

      expect(result).toBe(true);
    });
  });

  it('rejects a public method added to the real service', async () => {
    const realServiceSource = readRepositoryFile(SERVICE_PATH);
    const realSnapshot = readRepositoryFile(SNAPSHOT_PATH);
    const expandedServiceSource = realServiceSource.replace(
      'export class LegacyBackgroundApiService {\n',
      'export class LegacyBackgroundApiService {\n  newLegacyMethod(): void {}\n',
    );
    expect(expandedServiceSource).not.toBe(realServiceSource);

    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile(SERVICE_PATH, expandedServiceSource);
      writeFile(SNAPSHOT_PATH, realSnapshot);

      const result = preventLegacyBackgroundApiServiceExpansion();

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
