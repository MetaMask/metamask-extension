import assert from 'assert';
import AppMetadataController from './app-metadata';

const EXPECTED_DEFAULT_STATE = {
  currentAppVersion: '',
  previousAppVersion: '',
  previousMigrationVersion: 0,
  currentMigrationVersion: 0,
};

describe('AppMetadataController', () => {
  describe('constructor', () => {
    it('accepts initial state and does not modify it if currentMigrationVersion and platform.getVersion() match respective values in state', async () => {
      const initState = {
        currentAppVersion: '1',
        previousAppVersion: '1',
        previousMigrationVersion: 1,
        currentMigrationVersion: 1,
      };
      const appMetadataController = new AppMetadataController({
        state: initState,
        currentMigrationVersion: 1,
        currentAppVersion: '1',
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), initState);
    });

    it('sets default state and does not modify it', async () => {
      const appMetadataController = new AppMetadataController({
        state: {},
      });
      assert.deepStrictEqual(
        appMetadataController.store.getState(),
        EXPECTED_DEFAULT_STATE,
      );
    });

    it('sets default state and does not modify it if options version parameters match respective default values', async () => {
      const appMetadataController = new AppMetadataController({
        state: {},
        currentMigrationVersion: 0,
        currentAppVersion: '',
      });
      assert.deepStrictEqual(
        appMetadataController.store.getState(),
        EXPECTED_DEFAULT_STATE,
      );
    });

    it('updates the currentAppVersion state property if options.currentAppVersion does not match the default value', async () => {
      const appMetadataController = new AppMetadataController({
        state: {},
        currentMigrationVersion: 0,
        currentAppVersion: '1',
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '1',
      });
    });

    it('updates the currentAppVersion and previousAppVersion state properties if options.currentAppVersion, currentAppVersion and previousAppVersion are all different', async () => {
      const appMetadataController = new AppMetadataController({
        state: {
          currentAppVersion: '2',
          previousAppVersion: '1',
        },
        currentAppVersion: '3',
        currentMigrationVersion: 0,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '3',
        previousAppVersion: '2',
      });
    });

    it('updates the currentMigrationVersion state property if the currentMigrationVersion param does not match the default value', async () => {
      const appMetadataController = new AppMetadataController({
        state: {},
        currentMigrationVersion: 1,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 1,
      });
    });

    it('updates the currentMigrationVersion and previousMigrationVersion state properties if the currentMigrationVersion param, the currentMigrationVersion state property and the previousMigrationVersion state property are all different', async () => {
      const appMetadataController = new AppMetadataController({
        state: {
          currentMigrationVersion: 2,
          previousMigrationVersion: 1,
        },
        currentMigrationVersion: 3,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 3,
        previousMigrationVersion: 2,
      });
    });
  });
});
