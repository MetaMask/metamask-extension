import { checkApiMatchesSnapshot } from './check-api-matches-snapshot';
import { withinTemporaryDirectory } from './temporary-directory';

const SNAPSHOT_PATH = 'legacy-background-api-snapshot.json';

describe('checkApiMatchesSnapshot', () => {
  it('returns true when the API has the same names as the snapshot', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['a', 'b'] }));

      const result = checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['a', 'b']),
      });

      expect(result).toBe(true);
    });
  });

  it('returns true when the snapshot lists the same names in a different order', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['b', 'a'] }));

      const result = checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['a', 'b']),
      });

      expect(result).toBe(true);
    });
  });

  it('passes the parsed file to getMemberNames', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export const a = 1;');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: [] }));
      const getMemberNames = jest.fn().mockReturnValue(new Set());

      checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames,
      });

      expect(getMemberNames).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'api.ts',
          text: 'export const a = 1;',
        }),
      );
    });
  });

  it('returns false when the API has a name that the snapshot does not', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['a'] }));

      const result = checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['a', 'b']),
      });

      expect(result).toBe(false);
    });
  });

  it('logs the names that the API has but the snapshot does not', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['a'] }));

      checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['c', 'a', 'b']),
      });

      expect(log).toHaveBeenCalledWith(
        'SomeApi has names which are not listed in legacy-background-api-snapshot.json:\n- b\n- c',
      );
    });
  });

  it('returns false when the snapshot has a name that the API does not', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['a', 'b'] }));

      const result = checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['a']),
      });

      expect(result).toBe(false);
    });
  });

  it('logs the names that the snapshot has but the API does not', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      const log = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['c', 'a', 'b'] }));

      checkApiMatchesSnapshot({
        filePath: 'api.ts',
        snapshotKey: 'SomeApi',
        getMemberNames: () => new Set(['a']),
      });

      expect(log).toHaveBeenCalledWith(
        'legacy-background-api-snapshot.json lists names which no longer exist in SomeApi. Please remove them from the snapshot:\n- b\n- c',
      );
    });
  });

  it('throws when the snapshot does not exist', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');

      expect(() =>
        checkApiMatchesSnapshot({
          filePath: 'api.ts',
          snapshotKey: 'SomeApi',
          getMemberNames: () => new Set(),
        }),
      ).toThrow('legacy-background-api-snapshot.json does not exist');
    });
  });

  it('throws when the snapshot is not valid JSON', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, '{');

      expect(() =>
        checkApiMatchesSnapshot({
          filePath: 'api.ts',
          snapshotKey: 'SomeApi',
          getMemberNames: () => new Set(),
        }),
      ).toThrow('legacy-background-api-snapshot.json is not valid JSON');
    });
  });

  it('throws when the snapshot does not list the API', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ OtherApi: [] }));

      expect(() =>
        checkApiMatchesSnapshot({
          filePath: 'api.ts',
          snapshotKey: 'SomeApi',
          getMemberNames: () => new Set(),
        }),
      ).toThrow(
        'legacy-background-api-snapshot.json must have a "SomeApi" property that is an array of strings',
      );
    });
  });

  it('throws when the snapshot entry for the API is not an array of strings', async () => {
    await withinTemporaryDirectory(({ writeFile }) => {
      writeFile('api.ts', 'export {};');
      writeFile(SNAPSHOT_PATH, JSON.stringify({ SomeApi: ['a', 1] }));

      expect(() =>
        checkApiMatchesSnapshot({
          filePath: 'api.ts',
          snapshotKey: 'SomeApi',
          getMemberNames: () => new Set(),
        }),
      ).toThrow(
        'legacy-background-api-snapshot.json must have a "SomeApi" property that is an array of strings',
      );
    });
  });
});
