/* eslint-disable jest/no-conditional-expect */
import fs from 'fs';
import { cloneDeep } from 'lodash';
import liveMigrations from '../../migrations';
import data from '../../first-time-state';
import Migrator, { type Migration, type MigrationState } from '.';

const createLegacyMigration = (version: number): Migration => ({
  version,
  async migrate(state: MigrationState): Promise<MigrationState> {
    const clonedData = cloneDeep(state) as MigrationState;
    clonedData.meta.version = version;
    return clonedData;
  },
});

const stubMigrations: Migration[] = [
  createLegacyMigration(1),
  createLegacyMigration(2),
  createLegacyMigration(3),
];

const versionedData: MigrationState = {
  meta: { version: 0 },
  data: { hello: 'world' },
};

const firstTimeState: MigrationState = {
  meta: { version: 0 },
  data: data as Record<string, unknown>,
};

describe('migrations', () => {
  describe('liveMigrations require list', () => {
    let migrationNumbers: number[] = [];

    beforeAll(() => {
      const fileNames = fs.readdirSync('./app/scripts/migrations/');
      migrationNumbers = fileNames
        .reduce<number[]>((acc, filename) => {
          const name = filename.split('.')[0];
          if (/^\d+$/u.test(name)) {
            acc.push(Number.parseInt(name, 10));
          }
          return acc;
        }, []);
    });

    it('should include all migrations', () => {
      migrationNumbers.forEach((num) => {
        const migration = (liveMigrations as Migration[]).find(
          (candidate) => candidate.version === num,
        );
        expect(migration).toBeDefined();
        expect(migration?.version).toStrictEqual(num);
      });
    });

    it('should have tests for all migrations', () => {
      const fileNames = fs.readdirSync('./app/scripts/migrations/');
      const testNumbers = fileNames
        .reduce<number[]>((acc, filename) => {
          const name = filename.split('.test.')[0];
          if (/^\d+$/u.test(name)) {
            acc.push(Number.parseInt(name, 10));
          }
          return acc;
        }, []);

      migrationNumbers.forEach((num) => {
        if (num >= 33) {
          expect(testNumbers).toContain(num);
        }
      });
    });
  });

  describe('Migrator', () => {
    it('migratedData version should be version 3', async () => {
      const migrator = new Migrator({ migrations: stubMigrations });
      const migratedData = await migrator.migrateData(versionedData);
      expect(migratedData.state.meta.version).toStrictEqual(
        stubMigrations[2].version,
      );
    });

    it('should match the last version in live migrations', async () => {
      const migrator = new Migrator({ migrations: liveMigrations as Migration[] });
      const migratedData = await migrator.migrateData(firstTimeState);
      const lastMigration = (liveMigrations as Migration[])[liveMigrations.length - 1];

      expect(migratedData.state.meta.version).toStrictEqual(
        lastMigration.version,
      );
    });

    it('should emit an error', async () => {
      const migrator = new Migrator({
        migrations: [
          {
            version: 1,
            async migrate() {
              throw new Error('test');
            },
          },
        ],
      });
      const onError = jest.fn();
      migrator.on('error', onError);

      const initialState: MigrationState = {
        meta: { version: 0 },
        data: { hello: 'world' },
      };
      const migratedData = await migrator.migrateData(initialState);

      expect(onError).toHaveBeenCalledTimes(1);
      const [error] = onError.mock.calls[0] as [AggregateError];
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toBe('MetaMask Migration Error #1');
      expect((error.errors[0] as Error).message).toBe('test');
      expect(migratedData.state).toBe(initialState);
    });

    it('runs v2 migrations and reports changed controllers', async () => {
      const migrate = jest.fn(
        async (
          state: MigrationState,
          localChangedControllers: Set<string>,
        ): Promise<void> => {
          state.meta.version = 187;
          state.data.foo = 'bar';
          localChangedControllers.add('TestController');
        },
      );

      const migrator = new Migrator({
        migrations: [
          {
            version: 187,
            migrate,
          },
        ],
      });

      const initialState: MigrationState = {
        meta: { version: 186 },
        data: { hello: 'world' },
      };
      const migratedData = await migrator.migrateData(initialState);

      expect(migrate).toHaveBeenCalledTimes(1);
      expect(migrate.mock.calls[0]).toHaveLength(2);
      expect(migratedData.state).not.toBe(initialState);
      // toStrictEqual won't work
      // eslint-disable-next-line jest/prefer-strict-equal
      expect(migratedData.state.data).toEqual({
        hello: 'world',
        foo: 'bar',
      });
      expect(migratedData.changedKeys.has('TestController')).toBe(true);
    });

    it('handles errors thrown when state is cloned for next migration', async () => {
      const migrate = jest.fn();
      const migrator = new Migrator({
        migrations: [
          {
            version: 186,
            migrate,
          },
        ],
      });
      const onError = jest.fn();
      migrator.on('error', onError);

      const initialState: MigrationState = {
        meta: { version: 0 },
        data: {
          // eslint-disable-next-line no-empty-function
          bad: () => {},
        },
      };
      const migratedData = await migrator.migrateData(initialState);

      expect(migrate).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
      const [error] = onError.mock.calls[0] as [AggregateError];
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toBe('MetaMask Migration Error #186');
      expect(error.errors[0]?.constructor?.name).toBe('DOMException');
      expect((error.errors[0] as DOMException).name).toBe('DataCloneError');
      expect((error.errors[0] as DOMException).message).toMatch(
        /could not be cloned/iu,
      );
      expect(migratedData.state).toBe(initialState);
    });
  });
});
