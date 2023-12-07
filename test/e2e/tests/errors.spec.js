const { resolve } = require('path');
const { promises: fs } = require('fs');
const { strict: assert } = require('assert');
const { get, has, set, unset } = require('lodash');
const { Browser } = require('selenium-webdriver');
const { format } = require('prettier');
const { isObject } = require('@metamask/utils');
const { SENTRY_UI_STATE } = require('../../../app/scripts/lib/setupSentry');
const FixtureBuilder = require('../fixture-builder');
const { convertToHexValue, withFixtures } = require('../helpers');

/**
 * Derive a UI state field from a background state field.
 *
 * @param {string} backgroundField - The path of a background field.
 * @returns {string} The path for the corresponding UI field.
 */
function backgroundToUiField(backgroundField) {
  // The controller name is lost in the UI due to state flattening
  const [, ...rest] = backgroundField.split('.');
  const flattenedBackgroundField = rest.join('.');
  // Controller state is under the 'metamask' slice in the UI
  return `metamask.${flattenedBackgroundField}`;
}

const maskedBackgroundFields = [
  'CurrencyController.currencyRates.ETH.conversionDate', // This is a timestamp that changes each run
  // App metadata is masked so that we don't have to update the snapshot as
  // part of the release process
  'AppMetadataController.currentAppVersion',
  'AppMetadataController.currentMigrationVersion',
  'AppStateController.browserEnvironment.browser',
  'AppStateController.browserEnvironment.os',
  'AppStateController.outdatedBrowserWarningLastShown',
  'AppStateController.recoveryPhraseReminderLastShown',
  'AppStateController.termsOfUseLastAgreed',
];
const maskedUiFields = maskedBackgroundFields.map(backgroundToUiField);

const removedBackgroundFields = [
  // This property is timing-dependent
  'AccountTracker.currentBlockGasLimit',
  'AccountTracker.currentBlockGasLimitByChainId',
  // These properties are set to undefined, causing inconsistencies between Chrome and Firefox
  'AppStateController.currentPopupId',
  'AppStateController.timeoutMinutes',
  'PPOMController.chainStatus.0x539.lastVisited',
];

const removedUiFields = removedBackgroundFields.map(backgroundToUiField);

/**
 * Transform background state to make it consistent between test runs.
 *
 * @param {unknown} data - The data to transform
 */
function transformBackgroundState(data) {
  for (const field of maskedBackgroundFields) {
    if (has(data, field)) {
      set(data, field, typeof get(data, field));
    }
  }
  for (const field of removedBackgroundFields) {
    if (has(data, field)) {
      unset(data, field);
    }
  }
  return data;
}

/**
 * Transform UI state to make it consistent between test runs.
 *
 * @param {unknown} data - The data to transform
 */
function transformUiState(data) {
  for (const field of maskedUiFields) {
    if (has(data, field)) {
      set(data, field, typeof get(data, field));
    }
  }
  for (const field of removedUiFields) {
    if (has(data, field)) {
      unset(data, field);
    }
  }
  return data;
}

/**
 * Check that the data provided matches the snapshot.
 *
 * @param {object }args - Function arguments.
 * @param {any} args.data - The data to compare with the snapshot.
 * @param {string} args.snapshot - The name of the snapshot.
 * @param {boolean} [args.update] - Whether to update the snapshot if it doesn't match.
 */
async function matchesSnapshot({
  data,
  snapshot,
  update = process.env.UPDATE_SNAPSHOTS === 'true',
}) {
  const snapshotPath = resolve(__dirname, `./state-snapshots/${snapshot}.json`);
  const rawSnapshotData = await fs.readFile(snapshotPath, {
    encoding: 'utf-8',
  });
  const snapshotData = JSON.parse(rawSnapshotData);

  try {
    assert.deepStrictEqual(data, snapshotData);
  } catch (error) {
    if (update && error instanceof assert.AssertionError) {
      const stringifiedData = JSON.stringify(data);
      // filepath specified so that Prettier can infer which parser to use
      // from the file extension
      const formattedData = format(stringifiedData, {
        filepath: 'something.json',
      });
      await fs.writeFile(snapshotPath, formattedData, {
        encoding: 'utf-8',
      });
      console.log(`Snapshot '${snapshot}' updated`);
      return;
    }
    throw error;
  }
}

/**
 * Get an object consisting of all properties in the complete
 * object that are missing from the given object.
 *
 * @param {object} complete - The complete object to compare to.
 * @param {object} object - The object to test for missing properties.
 */
function getMissingProperties(complete, object) {
  const missing = {};
  for (const [key, value] of Object.entries(complete)) {
    if (key in object) {
      if (isObject(value) && isObject(object[key])) {
        const missingNestedProperties = getMissingProperties(
          value,
          object[key],
        );
        if (Object.keys(missingNestedProperties).length > 0) {
          missing[key] = missingNestedProperties;
        } else {
          // no missing nested properties
        }
      } else {
        // Skip non-object values, they are considered as present
        // even if they represent masked data structures
      }
    } else {
      missing[key] = value;
    }
  }
  return missing;
}

describe('Sentry errors', function () {
  const migrationError =
    process.env.SELENIUM_BROWSER === Browser.CHROME
      ? `Cannot read properties of undefined (reading 'version')`
      : 'meta is undefined';
  async function mockSentryMigratorError(mockServer) {
    return await mockServer
      .forPost('https://sentry.io/api/0000000/envelope/')
      .withBodyIncluding(migrationError)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  async function mockSentryInvariantMigrationError(mockServer) {
    return await mockServer
      .forPost('https://sentry.io/api/0000000/envelope/')
      .withBodyIncluding('typeof state.PreferencesController is number')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  async function mockSentryTestError(mockServer) {
    return await mockServer
      .forPost('https://sentry.io/api/0000000/envelope/')
      .withBodyIncluding('Test Error')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  describe('before initialization, after opting out of metrics', function () {
    it('should NOT send error events in the background', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: null,
                participateInMetaMetrics: false,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryMigratorError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.delay(3000);
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });

    it('should NOT send error events in the UI', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: null,
              participateInMetaMetrics: false,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');
          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          // Wait for Sentry request
          await driver.delay(3000);
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });
  });

  describe('before initialization, after opting into metrics @no-mmi', function () {
    it('should send error events in background', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: 'fake-metrics-id',
                participateInMetaMetrics: true,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryMigratorError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const { level } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          // Verify request
          assert.equal(type, 'TypeError');
          assert(value.includes(migrationError));
          assert.equal(level, 'error');
        },
      );
    });

    it('should capture background application state', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: 'fake-metrics-id',
                participateInMetaMetrics: true,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryMigratorError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          assert.deepStrictEqual(Object.keys(appState), [
            'browser',
            'version',
            'persistedState',
          ]);
          assert.ok(
            typeof appState?.browser === 'string' &&
              appState?.browser.length > 0,
            'Invalid browser state',
          );
          assert.ok(
            typeof appState?.version === 'string' &&
              appState?.version.length > 0,
            'Invalid version state',
          );
          await matchesSnapshot({
            data: {
              ...appState.persistedState,
              data: transformBackgroundState(appState.persistedState.data),
            },
            snapshot: 'errors-before-init-opt-in-background-state',
          });
        },
      );
    });

    // todo: reenable this test https://github.com/MetaMask/metamask-extension/issues/21807
    // eslint-disable-next-line mocha/no-skipped-tests
    it.skip('should capture migration log breadcrumbs when there is an invariant state error in a migration', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: 'fake-metrics-id',
                participateInMetaMetrics: true,
              })
              .withBadPreferencesControllerState()
              .build(),
          },
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryInvariantMigrationError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const breadcrumbs = mockJsonBody?.breadcrumbs ?? [];
          const migrationLogBreadcrumbs = breadcrumbs.filter((breadcrumb) => {
            return breadcrumb.message?.match(/Running migration \d+/u);
          });
          const migrationLogMessages = migrationLogBreadcrumbs.map(
            (breadcrumb) =>
              breadcrumb.message.match(/(Running migration \d+)/u)[1],
          );

          const firstMigrationLog = migrationLogMessages[0];
          const lastMigrationLog =
            migrationLogMessages[migrationLogMessages.length - 1];

          assert.equal(migrationLogMessages.length, 8);
          assert.equal(firstMigrationLog, 'Running migration 75');
          assert.equal(lastMigrationLog, 'Running migration 82');
        },
      );
    });

    it('should send error events in UI', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');
          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const { level } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
        },
      );
    });

    it('should capture UI application state', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');
          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          assert.deepStrictEqual(Object.keys(appState), [
            'browser',
            'version',
            'persistedState',
          ]);
          assert.ok(
            typeof appState?.browser === 'string' &&
              appState?.browser.length > 0,
            'Invalid browser state',
          );
          assert.ok(
            typeof appState?.version === 'string' &&
              appState?.version.length > 0,
            'Invalid version state',
          );
          await matchesSnapshot({
            data: {
              ...appState.persistedState,
              data: transformBackgroundState(appState.persistedState.data),
            },
            snapshot: 'errors-before-init-opt-in-ui-state',
          });
        },
      );
    });
  });

  describe('after initialization, after opting out of metrics', function () {
    it('should NOT send error events in the background', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: null,
              participateInMetaMetrics: false,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          // Wait for Sentry request
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });

    it('should NOT send error events in the UI', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: null,
              participateInMetaMetrics: false,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          const isPending = await mockedEndpoint.isPending();
          assert.ok(
            isPending,
            'A request to sentry was sent when it should not have been',
          );
        },
      );
    });
  });

  describe('after initialization, after opting into metrics @no-mmi', function () {
    it('should send error events in background', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const { level, extra } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          const { participateInMetaMetrics } =
            extra.appState.state.MetaMetricsController;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
          assert.equal(participateInMetaMetrics, true);
        },
      );
    });

    it('should capture background application state', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          assert.deepStrictEqual(Object.keys(appState), [
            'browser',
            'version',
            'state',
          ]);
          assert.ok(
            typeof appState?.browser === 'string' &&
              appState?.browser.length > 0,
            'Invalid browser state',
          );
          assert.ok(
            typeof appState?.version === 'string' &&
              appState?.version.length > 0,
            'Invalid version state',
          );
          await matchesSnapshot({
            data: transformBackgroundState(appState.state),
            snapshot: 'errors-after-init-opt-in-background-state',
          });
        },
      );
    });

    it('should send error events in UI', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const { level, extra } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          const { participateInMetaMetrics } = extra.appState.state.metamask;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
          assert.equal(participateInMetaMetrics, true);
        },
      );
    });

    it('should capture UI application state', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: 'fake-metrics-id',
              participateInMetaMetrics: true,
            })
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
          failOnConsoleError: false,
          testSpecificMock: mockSentryTestError,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await driver.findElement('#password');

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, 3000);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = mockedRequest.body.text.split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          assert.deepStrictEqual(Object.keys(appState), [
            'browser',
            'version',
            'state',
          ]);
          assert.ok(
            typeof appState?.browser === 'string' &&
              appState?.browser.length > 0,
            'Invalid browser state',
          );
          assert.ok(
            typeof appState?.version === 'string' &&
              appState?.version.length > 0,
            'Invalid version state',
          );
          await matchesSnapshot({
            data: transformUiState(appState.state),
            snapshot: 'errors-after-init-opt-in-ui-state',
          });
        },
      );
    });
  });

  it('should have no policy gaps for UI controller state @no-mmi', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.findElement('#password');

        const fullUiState = await driver.executeScript(() =>
          window.stateHooks?.getCleanAppState?.(),
        );

        const missingState = getMissingProperties(
          fullUiState.metamask,
          SENTRY_UI_STATE.metamask,
        );
        assert.deepEqual(missingState, {});
      },
    );
  });

  it('should not have extra properties in UI state mask @no-mmi', async function () {
    const expectedMissingState = {
      currentPopupId: false, // Initialized as undefined
      // Part of transaction controller store, but missing from the initial
      // state
      lastFetchedBlockNumbers: false,
      preferences: {
        autoLockTimeLimit: true, // Initialized as undefined
      },
      smartTransactionsState: {
        fees: {
          approvalTxFees: true, // Initialized as undefined
          tradeTxFees: true, // Initialized as undefined
        },
        userOptIn: true, // Initialized as undefined
        userOptInV2: true, // Initialized as undefined
      },
      swapsState: {
        // This can get wiped out during initialization due to a bug in
        // the "resetState" method
        swapsFeatureFlags: true,
      },
      // This can get erased due to a bug in the app state controller's
      // preferences state change handler
      timeoutMinutes: true,
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.findElement('#password');

        const fullUiState = await driver.executeScript(() =>
          window.stateHooks?.getCleanAppState?.(),
        );

        const extraMaskProperties = getMissingProperties(
          SENTRY_UI_STATE.metamask,
          fullUiState.metamask,
        );
        const unexpectedExtraMaskProperties = getMissingProperties(
          extraMaskProperties,
          expectedMissingState,
        );
        assert.deepEqual(unexpectedExtraMaskProperties, {});
      },
    );
  });
});
