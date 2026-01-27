/* eslint-disable jest/no-conditional-expect */
import fs from 'fs';
import { cloneDeep } from 'lodash';
import liveMigrations from '../../migrations';
import data from '../../first-time-state';
import Migrator from '.';

const stubMigrations = [
  {
    version: 1,
    migrate: (state) => {
      // clone the data just like we do in migrations
      const clonedData = cloneDeep(state);
      clonedData.meta.version = 1;
      return Promise.resolve(clonedData);
    },
  },
  {
    version: 2,
    migrate: (state) => {
      const clonedData = cloneDeep(state);
      clonedData.meta.version = 2;
      return Promise.resolve(clonedData);
    },
  },
  {
    version: 3,
    migrate: (state) => {
      const clonedData = cloneDeep(state);
      clonedData.meta.version = 3;
      return Promise.resolve(clonedData);
    },
  },
];
const versionedData = { meta: { version: 0 }, data: { hello: 'world' } };

const firstTimeState = {
  meta: { version: 0 },
  data,
};

describe('migrations', () => {
  describe('liveMigrations require list', () => {
    let migrationNumbers;

    beforeAll(() => {
      const fileNames = fs.readdirSync('./app/scripts/migrations/');
      migrationNumbers = fileNames
        .reduce((acc, filename) => {
          const name = filename.split('.')[0];
          if (/^\d+$/u.test(name)) {
            acc.push(name);
          }
          return acc;
        }, [])
        .map((num) => parseInt(num, 10));
    });

    it('should include all migrations', () => {
      migrationNumbers.forEach((num) => {
        const migration = liveMigrations.find((m) => m.version === num);
        expect(migration.version).toStrictEqual(num);
      });
    });

    it('should have tests for all migrations', () => {
      const fileNames = fs.readdirSync('./app/scripts/migrations/');
      const testNumbers = fileNames
        .reduce((acc, filename) => {
          const name = filename.split('.test.')[0];
          // eslint-disable-next-line jest/no-if
          if (/^\d+$/u.test(name)) {
            acc.push(name);
          }
          return acc;
        }, [])
        .map((num) => parseInt(num, 10));

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
      const migrator = new Migrator({ migrations: liveMigrations });
      const migratedData = await migrator.migrateData(firstTimeState);
      const last = liveMigrations.length - 1;

      expect(migratedData.state.meta.version).toStrictEqual(
        liveMigrations[last].version,
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

      const initialState = { meta: { version: 0 }, data: { hello: 'world' } };
      const migratedData = await migrator.migrateData(initialState);

      expect(onError).toHaveBeenCalledTimes(1);
      const [error] = onError.mock.calls[0];
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toBe('MetaMask Migration Error #1');
      expect(error.errors[0].message).toBe('test');
      expect(migratedData.state).toBe(initialState);
    });

    it('runs v2 migrations and reports changed controllers', async () => {
      const migrate = jest.fn(async (state, localChangedControllers) => {
        state.meta.version = 187;
        state.data.foo = 'bar';
        localChangedControllers.add('TestController');
      });

      const migrator = new Migrator({
        migrations: [
          {
            version: 187,
            migrate,
          },
        ],
      });

      const initialState = { meta: { version: 186 }, data: { hello: 'world' } };
      const migratedData = await migrator.migrateData(initialState);

      expect(migrate).toHaveBeenCalledTimes(1);
      expect(migrate.mock.calls[0]).toHaveLength(2);
      expect(migratedData.state).not.toBe(initialState);
      // eslint-disable-next-line jest/prefer-strict-equal toStrictEqual won't work
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

      const initialState = {
        meta: { version: 0 },
        // Regression test for https://github.com/MetaMask/metamask-extension/issues/39567
        // `bad` is a function, and cannot be serialized by `structuredClone`
        // this will throw a DOMException, which doesn't allow its `message`
        // property to be mutated
        // eslint-disable-next-line no-empty-function
        data: { bad: () => {} },
      };
      const migratedData = await migrator.migrateData(initialState);

      expect(migrate).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledTimes(1);
      const [error] = onError.mock.calls[0];
      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toBe('MetaMask Migration Error #186');
      expect(error.errors[0]?.constructor?.name).toBe('DOMException');
      expect(error.errors[0].name).toBe('DataCloneError');
      expect(error.errors[0].message).toBe('() => {} could not be cloned.');
      expect(migratedData.state).toBe(initialState);
    });
  });
});
