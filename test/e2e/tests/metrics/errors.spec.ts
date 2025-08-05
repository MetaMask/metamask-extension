import { resolve } from 'path';
import { promises as fs } from 'fs';
import { strict as assert } from 'assert';
import { get, has, set, unset, cloneDeep } from 'lodash';
import { Browser } from 'selenium-webdriver';
import prettier from 'prettier';
import { isObject, Json, JsonRpcResponse } from '@metamask/utils';
import { Mockttp } from 'mockttp';
import { SENTRY_UI_STATE } from '../../../../app/scripts/constants/sentry-state';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, sentryRegEx } from '../../helpers';
import { PAGES } from '../../webdriver/driver';
import { MOCK_META_METRICS_ID } from '../../constants';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

/**
 * Derive a UI state field from a background state field.
 *
 * @param backgroundField - The path of a background field.
 * @returns The path for the corresponding UI field.
 */
function backgroundToUiField(backgroundField: string): string {
  // The controller name is lost in the UI due to state flattening
  const [, ...rest] = backgroundField.split('.');
  const flattenedBackgroundField = rest.join('.');
  // Controller state is under the 'metamask' slice in the UI
  return `metamask.${flattenedBackgroundField}`;
}

const maskedBackgroundFields = [
  // App metadata is masked so that we don't have to update the snapshot as
  // part of the release process
  'AppMetadataController.currentAppVersion',
  'AppMetadataController.currentMigrationVersion',
  'AppStateController.browserEnvironment.browser',
  'AppStateController.browserEnvironment.os',
  'AppStateController.outdatedBrowserWarningLastShown',
  'AppStateController.surveyLinkLastClickedOrClosed',
  'AppStateController.recoveryPhraseReminderLastShown',
  'AppStateController.termsOfUseLastAgreed',
  // The value in these properties may change each run
  'AppStateController.fullScreenGasPollTokens',
  'AppStateController.notificationGasPollTokens',
  'AppStateController.popupGasPollTokens',
  'CurrencyController.currencyRates.ETH.conversionDate',
  'CurrencyController.currencyRates.LineaETH.conversionDate',
  'CurrencyController.currencyRates.SepoliaETH.conversionDate',
  'CurrencyController.currencyRates.MegaETH.conversionDate',
  'CurrencyController.currencyRates.MON.conversionDate',
];
const maskedUiFields = maskedBackgroundFields.map(backgroundToUiField);

const removedBackgroundFields = [
  // This property is timing-dependent
  'AccountTracker.currentBlockGasLimit',
  'AccountTracker.currentBlockGasLimitByChainId',
  // These properties are set to undefined, causing inconsistencies between Chrome and Firefox
  'AppStateController.currentPopupId',
  'AppStateController.timeoutMinutes',
  'AppStateController.lastInteractedConfirmationInfo',
  'BridgeController.quoteRequest.walletAddress',
  'BridgeController.quoteRequest.slippage',
  'PPOMController.chainStatus.0x539.lastVisited',
  'PPOMController.versionInfo',
  // This property is timing-dependent
  'MetaMetricsController.latestNonAnonymousEventTimestamp',
  // PhishingController properties (except urlScanCache which is masked)
  'PhishingController.c2DomainBlocklistLastFetched',
  'PhishingController.hotlistLastFetched',
  'PhishingController.phishingLists',
  'PhishingController.stalelistLastFetched',
  'PhishingController.whitelist',
];

const ignoredConsoleErrors = [
  // The UI logs the expected error
  "Cannot read properties of undefined (reading 'version')",
];

const removedUiFields = removedBackgroundFields.map(backgroundToUiField);

const WAIT_FOR_SENTRY_MS = 10000;

/**
 * Transform background state to make it consistent between test runs.
 *
 * @param data - The data to transform
 */
function transformBackgroundState(
  data: JsonRpcResponse<Json>,
): JsonRpcResponse<Json> {
  const clonedData = cloneDeep(data);
  for (const field of maskedBackgroundFields) {
    if (has(clonedData, field)) {
      set(clonedData, field, typeof get(clonedData, field));
    }
  }
  for (const field of removedBackgroundFields) {
    if (has(clonedData, field)) {
      unset(clonedData, field);
    }
  }
  return clonedData;
}

/**
 * Transform UI state to make it consistent between test runs.
 *
 * @param data - The data to transform
 */
function transformUiState(data: JsonRpcResponse<Json>): JsonRpcResponse<Json> {
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
 * @param args - Function arguments.
 * @param args.data - The data to compare with the snapshot.
 * @param args.snapshot - The name of the snapshot.
 * @param [args.update] - Whether to update the snapshot if it doesn't match.
 */
async function matchesSnapshot({
  data,
  snapshot,
  update = process.env.UPDATE_SNAPSHOTS === 'true',
}: {
  data: JsonRpcResponse<Json>;
  snapshot: string;
  update?: boolean;
}): Promise<void> {
  const snapshotPath = resolve(__dirname, `./state-snapshots/${snapshot}.json`);
  console.log('snapshotPath', snapshotPath);
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
      const formattedData = await prettier.format(stringifiedData, {
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
 * @param complete - The complete object to compare to.
 * @param object - The object to test for missing properties.
 */
function getMissingProperties(complete: object, object: object): object {
  const missing: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(complete)) {
    if (key in object) {
      const objectValue = (object as Record<string, unknown>)[key];
      if (isObject(value) && isObject(objectValue)) {
        const missingNestedProperties = getMissingProperties(
          value,
          objectValue as object,
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
      ? `"type":"TypeError","value":"Cannot read properties of undefined (reading 'version')`
      : 'meta is undefined';
  async function mockSentryMigratorError(mockServer: Mockttp) {
    return await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding(migrationError)
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  async function mockSentryInvariantMigrationError(mockServer: Mockttp) {
    return await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('typeof state.PreferencesController is number')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

  async function mockSentryTestError(mockServer: Mockttp) {
    return await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('Test Error')
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {},
        };
      });
  }

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
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryMigratorError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors,
        },
        async ({ driver, mockedEndpoint }) => {
          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });

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
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();
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

  describe('before initialization, after opting into metrics', function () {
    it('should send error events in background', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: MOCK_META_METRICS_ID,
                participateInMetaMetrics: true,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryMigratorError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors,
        },
        async ({ driver, mockedEndpoint }) => {
          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });
          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          // Verify request
          const escapedMigrationError = migrationError.replace(
            /[.*+?^${}()|[\]\\]/gu,
            '\\$&',
          );
          const migrationErrorRegex = new RegExp(escapedMigrationError, 'u');
          assert.match(
            JSON.stringify(mockJsonBody.exception),
            migrationErrorRegex,
          );
        },
      );
    });

    it('should capture background application state', async function () {
      await withFixtures(
        {
          fixtures: {
            ...new FixtureBuilder()
              .withMetaMetricsController({
                metaMetricsId: MOCK_META_METRICS_ID,
                participateInMetaMetrics: true,
              })
              .build(),
            // Intentionally corrupt state to trigger migration error during initialization
            meta: undefined,
          },
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryMigratorError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors,
        },
        async ({ driver, mockedEndpoint }) => {
          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
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
                metaMetricsId: MOCK_META_METRICS_ID,
                participateInMetaMetrics: true,
              })
              .withBadPreferencesControllerState()
              .build(),
          },
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryInvariantMigrationError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);

          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const breadcrumbs = mockJsonBody?.breadcrumbs ?? [];
          const migrationLogBreadcrumbs = breadcrumbs.filter(
            (breadcrumb: { message?: string }) => {
              return breadcrumb.message?.match(/Running migration \d+/u);
            },
          );
          const migrationLogMessages = migrationLogBreadcrumbs.map(
            (breadcrumb: { message?: string }) =>
              breadcrumb.message?.match(/(Running migration \d+)/u)?.[1] ?? '',
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
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          ignoredConsoleErrors: ['TestError'],
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();
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
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
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
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          ignoredConsoleErrors: ['TestError'],
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();
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
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
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
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors,
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();

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
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          ignoredConsoleErrors: ['TestError'],
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();

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

  describe('after initialization, after opting into metrics', function () {
    it('should send error events in background', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder()
            .withMetaMetricsController({
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
          ignoredConsoleErrors: [
            // The UI logs the expected error
            "TypeError: Cannot read properties of undefined (reading 'version')",
          ],
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
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
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await loginWithBalanceValidation(driver);

          await driver.delay(2000);
          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          const { extensionId, installType } = mockJsonBody.extra;
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
          assert.ok(
            typeof extensionId === 'string' && extensionId.length > 0,
            `${extensionId} is not a valid extension ID`,
          );
          assert.equal(installType, 'development');
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
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          ignoredConsoleErrors: ['TestError'],
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await driver.navigate();
          await new LoginPage(driver).check_pageIsLoaded();

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
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
              metaMetricsId: MOCK_META_METRICS_ID,
              participateInMetaMetrics: true,
            })
            .build(),
          title: this.test?.fullTitle(),
          testSpecificMock: mockSentryTestError,
          ignoredConsoleErrors: ['TestError'],
          manifestFlags: {
            sentry: { forceEnable: false },
          },
        },
        async ({ driver, mockedEndpoint }) => {
          await loginWithBalanceValidation(driver);

          await driver.delay(2000);

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          // Wait for Sentry request
          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, WAIT_FOR_SENTRY_MS);
          const [mockedRequest] = await mockedEndpoint.getSeenRequests();
          const mockTextBody = (await mockedRequest.body.getText()).split('\n');
          const mockJsonBody = JSON.parse(mockTextBody[2]);
          const appState = mockJsonBody?.extra?.appState;
          const { extensionId, installType } = mockJsonBody.extra;
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
          assert.ok(
            typeof extensionId === 'string' && extensionId.length > 0,
            `${extensionId} is not a valid extension ID`,
          );
          assert.equal(installType, 'development');
          await matchesSnapshot({
            data: transformUiState(appState.state),
            snapshot: 'errors-after-init-opt-in-ui-state',
          });
        },
      );
    });
  });

  it('should not have extra properties in UI state mask', async function () {
    const expectedMissingState = {
      // This can get wiped out during initialization due to a bug in
      // the "resetState" method
      quoteRequest: {
        destChainId: true,
        destTokenAddress: true,
        srcChainId: true,
        srcTokenAmount: true,
        walletAddress: false,
        slippage: true,
      },
      quotesLastFetched: true,
      quotesLoadingStatus: true,
      quotesRefreshCount: true,
      quoteFetchError: true,
      quotesInitialLoadTime: true,
      currentPopupId: false, // Initialized as undefined
      // Part of transaction controller store, but missing from the initial
      // state
      lastFetchedBlockNumbers: false,
      preferences: {
        autoLockTimeLimit: true, // Initialized as undefined
        showConfirmationAdvancedDetails: true,
        privacyMode: false,
      },
      balances: false,
      accountsAssets: false,
      assetsMetadata: false,
      assetsRates: false,
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
      // Part of the AuthenticationController store, but initialized as undefined
      // Only populated once the client is authenticated
      srpSessionData: {},
      // This can get erased due to a bug in the app state controller's
      // preferences state change handler
      timeoutMinutes: true,
      lastInteractedConfirmationInfo: undefined,
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          sentry: { forceEnable: false },
        },
      },
      async ({ driver }) => {
        await driver.navigate();
        await new LoginPage(driver).check_pageIsLoaded();

        const fullUiState = await driver.executeScript(() =>
          (
            window as { stateHooks?: { getCleanAppState?: () => unknown } }
          ).stateHooks?.getCleanAppState?.(),
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
