import assert from 'assert';
import { AppMetadataController } from './app-metadata';

const MOCK_VERSION = {
  version: '',
};

const EXPECTED_DEFAULT_STATE = {
  currentAppVersion: '',
  previousAppVersion: '',
  previousMigrationVersion: 0,
  currentMigrationVersion: 0,
};

jest.mock(
  '../platforms/extension',
  () =>
    class MockExtensionPlatform {
      getVersion(): string {
        return MOCK_VERSION.version;
      }
    },
);

describe('AppMetadataController', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('constructor', () => {
    it('accepts initial state and does not modify it if currentMigrationVersion and platform.getVersion() match respective values in state', async () => {
      const initState = {
        currentAppVersion: '1',
        previousAppVersion: '1',
        previousMigrationVersion: 1,
        currentMigrationVersion: 1,
      };
      MOCK_VERSION.version = initState.currentAppVersion;
      const appMetadataController = new AppMetadataController({
        state: initState,
        currentMigrationVersion: 1,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), initState);
    });

    it('sets default state and does not modify it if currentMigrationVersion and platform.getVersion() match respective default values', async () => {
      MOCK_VERSION.version = '';
      const appMetadataController = new AppMetadataController({
        state: {},
        currentMigrationVersion: 0,
      });
      assert.deepStrictEqual(
        appMetadataController.store.getState(),
        EXPECTED_DEFAULT_STATE,
      );
    });

    it('updates the currentAppVersion state property if platform.getVersion() does not match the default value', async () => {
      MOCK_VERSION.version = '1';
      const appMetadataController = new AppMetadataController({
        state: {},
        currentMigrationVersion: 0,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '1',
      });
    });

    it('updates the currentAppVersion and previousAppVersion state properties if platform.getVersion(), currentAppVersion and previousAppVersion are all different', async () => {
      MOCK_VERSION.version = '3';
      const appMetadataController = new AppMetadataController({
        state: {
          currentAppVersion: '2',
          previousAppVersion: '1',
        },
        currentMigrationVersion: 0,
      });
      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '3',
        previousAppVersion: '2',
      });
    });

    it('updates the currentMigrationVersion state property if the currentMigrationVersion param does not match the default value', async () => {
      MOCK_VERSION.version = '';
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
      MOCK_VERSION.version = '';
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

  describe('maybeUpdateAppVersion', () => {
    it('updates currentAppVersion and previousAppVersion', async () => {
      MOCK_VERSION.version = '1';
      const appMetadataController = new AppMetadataController({
        state: {
          currentAppVersion: '1',
        },
        currentMigrationVersion: 0,
      });

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '1',
      });

      MOCK_VERSION.version = '2';
      appMetadataController.maybeUpdateAppVersion();

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '2',
        previousAppVersion: '1',
      });
    });

    it('does not update currentAppVersion and previousAppVersion if currentAppVersion matches the value returned by platform.getVersion()', async () => {
      MOCK_VERSION.version = '1';
      const appMetadataController = new AppMetadataController({
        state: {
          currentAppVersion: '1',
        },
        currentMigrationVersion: 0,
      });

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '1',
      });

      appMetadataController.maybeUpdateAppVersion();

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentAppVersion: '1',
      });
    });
  });

  describe('maybeUpdateMigrationVersion', () => {
    it('updates currentMigrationVersion and previousMigrationVersion', async () => {
      MOCK_VERSION.version = '';
      const appMetadataController = new AppMetadataController({
        state: {
          currentMigrationVersion: 1,
        },
        currentMigrationVersion: 1,
      });

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 1,
      });

      appMetadataController.maybeUpdateMigrationVersion(2);

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 2,
        previousMigrationVersion: 1,
      });
    });

    it('does not update currentMigrationVersion and previousMigrationVersion if it is passed a parameter matching currentMigrationVersion', async () => {
      MOCK_VERSION.version = '';
      const appMetadataController = new AppMetadataController({
        state: {
          currentMigrationVersion: 1,
        },
        currentMigrationVersion: 1,
      });

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 1,
      });

      appMetadataController.maybeUpdateMigrationVersion(1);

      assert.deepStrictEqual(appMetadataController.store.getState(), {
        ...EXPECTED_DEFAULT_STATE,
        currentMigrationVersion: 1,
      });
    });
  });
});
