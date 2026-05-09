import { resolve } from 'path';
import { promises as fs } from 'fs';
import { strict as assert } from 'assert';
import { cloneDeep, get, has, set, unset } from 'lodash';
import { Browser } from 'selenium-webdriver';
import prettier from 'prettier';
import { isObject, Json, JsonRpcResponse } from '@metamask/utils';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { SENTRY_UI_STATE } from '../../../../app/scripts/constants/sentry-state';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { sentryRegEx } from '../../helpers';
import { configureFixtureSession } from '../../helpers/fixture-session';
import { PAGES, type Driver } from '../../webdriver/driver';
import { MOCK_META_METRICS_ID } from '../../constants';
import LoginPage from '../../page-objects/pages/login-page';
import { login } from '../../page-objects/flows/login.flow';
import { mockSpotPrices } from '../tokens/utils/mocks';

type CompletedSentryRequest = Awaited<
  ReturnType<MockedEndpoint['getSeenRequests']>
>[number];
type SentryPersistedState = JsonRpcResponse<Json> & {
  data: JsonRpcResponse<Json>;
};
type SentryAppState = {
  browser: string;
  version: string;
  persistedState: SentryPersistedState;
  state: JsonRpcResponse<Json> &
    Record<
      'MetaMetricsController' | 'metamask',
      { participateInMetaMetrics: boolean }
    >;
};
type SentryRequestJsonBody = {
  breadcrumbs?: { message?: string }[];
  exception: {
    values: { type: string; value: string }[];
  };
  extra: {
    appState: SentryAppState;
    extensionId: string;
    installType: string;
  };
  level: string;
};

type SentrySessionAccessors = {
  getDriver: () => Driver;
  getNextSentryRequest: (driver: Driver) => Promise<CompletedSentryRequest>;
  expectNoSentryRequest: (driver: Driver) => Promise<void>;
};

const FEATURE_FLAGS_RESPONSE = [
  { feature1: true },
  { feature2: false },
  {
    feature3: [
      {
        value: 'valueA',
        name: 'groupA',
        scope: { type: 'threshold', value: 0.3 },
      },
      {
        value: 'valueB',
        name: 'groupB',
        scope: { type: 'threshold', value: 0.5 },
      },
      {
        scope: { type: 'threshold', value: 1 },
        value: 'valueC',
        name: 'groupC',
      },
    ],
  },
];

async function mockRemoteFeatureFlags(server: Mockttp): Promise<void> {
  await server
    .forGet('https://client-config.api.cx.metamask.io/v1/flags')
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => ({
      statusCode: 200,
      json: FEATURE_FLAGS_RESPONSE,
    }));
}

async function mockExchangeRates(mockServer: Mockttp): Promise<void> {
  await mockServer
    .forGet('https://price.api.cx.metamask.io/v1/exchange-rates')
    .withQuery({ baseCurrency: 'usd' })
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          usd: {
            name: 'US Dollar',
            ticker: 'usd',
            value: 1,
            currencyType: 'fiat',
          },
          eth: {
            name: 'Ether',
            ticker: 'eth',
            value: 1 / 1700,
            currencyType: 'crypto',
          },
          mon: {
            name: 'Monad',
            ticker: 'mon',
            value: 1 / 0.2,
            currencyType: 'crypto',
          },
        },
      };
    });
}

async function mockSentrySupportApis(mockServer: Mockttp): Promise<void> {
  await mockRemoteFeatureFlags(mockServer);
  await mockSpotPrices(mockServer, {
    'eip155:1/slip44:60': {
      price: 1700,
      marketCap: 382623505141,
      pricePercentChange1d: 0,
    },
  });
  await mockExchangeRates(mockServer);
}

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
  'AppStateController.shieldSubscriptionError',
  'AppStateController.shieldEndingToastLastClickedOrClosed',
  'AppStateController.shieldPausedToastLastClickedOrClosed',
  // The value in these properties may change each run
  'AppStateController.fullScreenGasPollTokens',
  'AppStateController.notificationGasPollTokens',
  'AppStateController.popupGasPollTokens',
  'CurrencyController.currencyRates.ETH.conversionDate',
  'CurrencyController.currencyRates.LineaETH.conversionDate',
  'CurrencyController.currencyRates.SepoliaETH.conversionDate',
  'CurrencyController.currencyRates.MegaETH.conversionDate',
  'CurrencyController.currencyRates.MON.conversionDate',
  // Network metadata entries vary as networks are added/removed in the codebase
  'NetworkController.networksMetadata',
];
const maskedUiFields = maskedBackgroundFields.map(backgroundToUiField);

const removedBackgroundFields = [
  // These properties are set to undefined, causing inconsistencies between Chrome and Firefox
  'AppStateController.appActiveTab',
  'AppStateController.currentPopupId',
  'AppStateController.timeoutMinutes',
  'AppStateController.lastInteractedConfirmationInfo',
  'AppStateController.lastUpdatedFromVersion',
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
  'PhishingController.whitelistPaths',
  // User preference that can vary between test runs
  'PreferencesController.preferences.avatarType',
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

function buildMetaMetricsFixture({
  metaMetricsId,
  participateInMetaMetrics,
  corruptMeta = false,
  badPreferences = false,
}: {
  metaMetricsId: string | null;
  participateInMetaMetrics: boolean;
  corruptMeta?: boolean;
  badPreferences?: boolean;
}): unknown {
  const builder = new FixtureBuilderV2().withMetaMetricsController({
    metaMetricsId,
    participateInMetaMetrics,
  });

  if (badPreferences) {
    builder.withBadPreferencesControllerState();
  }

  const fixture = builder.build();

  if (corruptMeta) {
    return {
      ...fixture,
      meta: undefined,
    };
  }

  return fixture;
}

function createSentryRequestTracker(
  getMockedEndpoint: () => MockedEndpoint,
): Pick<
  SentrySessionAccessors,
  'expectNoSentryRequest' | 'getNextSentryRequest'
> {
  let expectedRequestCount = 0;

  return {
    async expectNoSentryRequest(driver: Driver) {
      await driver.delay(3000);
      const requests = await getMockedEndpoint().getSeenRequests();
      assert.equal(
        requests.length,
        0,
        'A request to sentry was sent when it should not have been',
      );
    },

    async getNextSentryRequest(driver: Driver) {
      expectedRequestCount += 1;
      await driver.wait(async () => {
        const requests = await getMockedEndpoint().getSeenRequests();
        return requests.length >= expectedRequestCount;
      }, WAIT_FOR_SENTRY_MS);

      const requests = await getMockedEndpoint().getSeenRequests();
      return requests[expectedRequestCount - 1];
    },
  };
}

async function getSentryRequestJsonBody(
  mockedRequest: CompletedSentryRequest,
): Promise<SentryRequestJsonBody> {
  const mockTextBody = (await mockedRequest.body.getText()).split('\n');
  return JSON.parse(mockTextBody[2]);
}

function configureSentryFixtureSession({
  title,
  fixtures,
  mockSentryEndpoint,
  ignoredErrors = [],
  defineSuite,
}: {
  title: string;
  fixtures: unknown;
  mockSentryEndpoint: (mockServer: Mockttp) => Promise<MockedEndpoint>;
  ignoredErrors?: string[];
  defineSuite: (accessors: SentrySessionAccessors) => void;
}): void {
  configureFixtureSession(
    title,
    {
      fixtures,
      testSpecificMock: async (mockServer: Mockttp) => {
        await mockSentrySupportApis(mockServer);
        return await mockSentryEndpoint(mockServer);
      },
      ignoredConsoleErrors: ignoredErrors,
      manifestFlags: {
        sentry: { forceEnable: false },
      },
    },
    ({ getDriver, getFixtures }) => {
      const getMockedEndpoint = () =>
        getFixtures().mockedEndpoint as MockedEndpoint;
      const requestTracker = createSentryRequestTracker(getMockedEndpoint);

      defineSuite({
        getDriver,
        ...requestTracker,
      });
    },
  );
}

describe('Sentry errors', function () {
  const migrationError =
    process.env.SELENIUM_BROWSER === Browser.CHROME
      ? `"type":"TypeError","value":"Cannot read properties of undefined (reading 'version')`
      : 'meta is undefined';

  async function mockSentryMigratorError(mockServer: Mockttp) {
    return await mockServer
      .forPost(sentryRegEx)
      .withBodyIncluding('{"type":"event"')
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
    configureSentryFixtureSession({
      title: 'should NOT send background error events',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: null,
        participateInMetaMetrics: false,
        corruptMeta: true,
      }),
      mockSentryEndpoint: mockSentryMigratorError,
      ignoredErrors: ignoredConsoleErrors,
      defineSuite: ({ getDriver, expectNoSentryRequest }) => {
        it('should NOT send error events in the background', async function () {
          const driver = getDriver();

          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });

          await expectNoSentryRequest(driver);
        });
      },
    });

    configureSentryFixtureSession({
      title: 'should NOT send UI error events',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: null,
        participateInMetaMetrics: false,
      }),
      mockSentryEndpoint: mockSentryTestError,
      ignoredErrors: ['TestError'],
      defineSuite: ({ getDriver, expectNoSentryRequest }) => {
        it('should NOT send error events in the UI', async function () {
          if (process.env.ASSETS_UNIFIED_STATE_ENABLED === 'false') {
            this.skip();
          }

          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();
          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          await expectNoSentryRequest(driver);
        });
      },
    });
  });

  describe('before initialization, after opting into metrics', function () {
    configureSentryFixtureSession({
      title: 'background migration errors',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: MOCK_META_METRICS_ID,
        participateInMetaMetrics: true,
        corruptMeta: true,
      }),
      mockSentryEndpoint: mockSentryMigratorError,
      ignoredErrors: ignoredConsoleErrors,
      defineSuite: ({ getDriver, getNextSentryRequest }) => {
        it('should send error events in background', async function () {
          const driver = getDriver();

          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });

        it('should capture background application state', async function () {
          if (process.env.ASSETS_UNIFIED_STATE_ENABLED === 'false') {
            this.skip();
          }

          const driver = getDriver();

          // we don't wait for the controllers to be loaded
          await driver.navigate(PAGES.HOME, { waitForControllers: false });

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });
      },
    });

    configureSentryFixtureSession({
      title: 'invariant migration breadcrumbs',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: MOCK_META_METRICS_ID,
        participateInMetaMetrics: true,
        badPreferences: true,
      }),
      mockSentryEndpoint: mockSentryInvariantMigrationError,
      defineSuite: ({ getDriver, getNextSentryRequest }) => {
        // todo: reenable this test https://github.com/MetaMask/metamask-extension/issues/21807
        // eslint-disable-next-line mocha/no-skipped-tests
        it.skip('should capture migration log breadcrumbs when there is an invariant state error in a migration', async function () {
          const driver = getDriver();

          await driver.navigate();

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });
      },
    });

    configureSentryFixtureSession({
      title: 'UI errors before initialization',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: MOCK_META_METRICS_ID,
        participateInMetaMetrics: true,
      }),
      mockSentryEndpoint: mockSentryTestError,
      ignoredErrors: ['TestError'],
      defineSuite: ({ getDriver, getNextSentryRequest }) => {
        it('should send error events in UI', async function () {
          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();
          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
          const { level } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
        });

        it('should capture UI application state', async function () {
          if (process.env.ASSETS_UNIFIED_STATE_ENABLED === 'false') {
            this.skip();
          }

          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();

          // Wait for state to settle
          await driver.delay(5_000);

          // Erase `getSentryAppState` hook, simulating a "before initialization" state
          await driver.executeScript(
            'window.stateHooks.getSentryAppState = undefined',
          );

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });
      },
    });
  });

  describe('after initialization, after opting out of metrics', function () {
    configureSentryFixtureSession({
      title: 'errors after opting out',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: null,
        participateInMetaMetrics: false,
      }),
      mockSentryEndpoint: mockSentryTestError,
      ignoredErrors: ['TestError', ...ignoredConsoleErrors],
      defineSuite: ({ getDriver, expectNoSentryRequest }) => {
        it('should NOT send error events in the background', async function () {
          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          await expectNoSentryRequest(driver);
        });

        it('should NOT send error events in the UI', async function () {
          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          await expectNoSentryRequest(driver);
        });
      },
    });
  });

  describe('after initialization, after opting into metrics', function () {
    configureSentryFixtureSession({
      title: 'background errors after initialization',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: MOCK_META_METRICS_ID,
        participateInMetaMetrics: true,
      }),
      mockSentryEndpoint: mockSentryTestError,
      ignoredErrors: [
        "TypeError: Cannot read properties of undefined (reading 'version')",
      ],
      defineSuite: ({ getDriver, getNextSentryRequest }) => {
        it('should send error events in background', async function () {
          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();

          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
          const { level, extra } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          const { participateInMetaMetrics } =
            extra.appState.state.MetaMetricsController;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
          assert.equal(participateInMetaMetrics, true);
        });

        it('should capture background application state', async function () {
          const driver = getDriver();
          await login(driver);

          // Wait for state to settle
          await driver.delay(5_000);
          // Trigger error
          await driver.executeScript(
            'window.stateHooks.throwTestBackgroundError()',
          );

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });
      },
    });

    configureSentryFixtureSession({
      title: 'UI errors after initialization',
      fixtures: buildMetaMetricsFixture({
        metaMetricsId: MOCK_META_METRICS_ID,
        participateInMetaMetrics: true,
      }),
      mockSentryEndpoint: mockSentryTestError,
      ignoredErrors: ['TestError'],
      defineSuite: ({ getDriver, getNextSentryRequest }) => {
        it('should send error events in UI', async function () {
          const driver = getDriver();
          await driver.navigate();
          await new LoginPage(driver).checkPageIsLoaded();

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
          const { level, extra } = mockJsonBody;
          const [{ type, value }] = mockJsonBody.exception.values;
          const { participateInMetaMetrics } = extra.appState.state.metamask;
          // Verify request
          assert.equal(type, 'TestError');
          assert.equal(value, 'Test Error');
          assert.equal(level, 'error');
          assert.equal(participateInMetaMetrics, true);
        });

        it('should capture UI application state', async function () {
          if (process.env.ASSETS_UNIFIED_STATE_ENABLED === 'false') {
            this.skip();
          }

          const driver = getDriver();
          await login(driver);

          // Wait for state to settle
          await driver.delay(5_000);

          // Trigger error
          await driver.executeScript('window.stateHooks.throwTestError()');

          const mockedRequest = await getNextSentryRequest(driver);
          const mockJsonBody = await getSentryRequestJsonBody(mockedRequest);
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
        });
      },
    });
  });

  configureFixtureSession(
    'Sentry UI state mask',
    {
      fixtures: new FixtureBuilderV2().build(),
      manifestFlags: {
        sentry: { forceEnable: false },
      },
      testSpecificMock: async (mockServer: Mockttp) => {
        await mockRemoteFeatureFlags(mockServer);
      },
    },
    ({ getDriver }) => {
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
          allIgnoredAssets: false,
          assetsRates: false,
          smartTransactionsState: {
            fees: {
              approvalTxFees: true, // Initialized as undefined
              tradeTxFees: true, // Initialized as undefined
            },
            userOptIn: true, // Initialized as undefined
            userOptInV2: true, // Initialized as undefined
          },
          // Part of the AuthenticationController store, but initialized as undefined
          // Only populated once the client is authenticated
          srpSessionData: {},
          // This can get erased due to a bug in the app state controller's
          // preferences state change handler
          timeoutMinutes: true,
          lastInteractedConfirmationInfo: undefined,
          connectivityStatus: true,
          rewardsPointsEstimateHistory: false,
          // Filtered from UI state patches (sensitive auth tokens - see state-utils.ts)
          rewardsSubscriptionTokens: false,
          storageWriteErrorType: true,
          // Optional property on AppStateController; only set after a user
          // interacts with a Snap install dialog, so absent from initial state.
          snapsInstallPrivacyWarningShown: true,
        };
        const driver = getDriver();
        await driver.navigate();
        await new LoginPage(driver).checkPageIsLoaded();

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
      });
    },
  );
});
