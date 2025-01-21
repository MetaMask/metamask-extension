import assert from 'assert';
import { readdirSync } from 'fs';
import path from 'path';
import { withFixtures, WALLET_PASSWORD } from '../e2e/helpers';
import { importSRPOnboardingFlow } from '../e2e/page-objects/flows/onboarding.flow';
import {
  E2E_SRP,
  FIXTURE_STATE_METADATA_VERSION,
} from '../e2e/default-fixture';
import FixtureBuilder from '../e2e/fixture-builder';
import { isFixturesStateSchemaValid } from './validate-schema';

// Define a type for the method names
type FixtureBuilderMethods = keyof FixtureBuilder;

describe('Fixture Schema Integrity', function () {
  it('should have matching schema with current wallet state', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
      },
      async ({ driver }) => {
        await driver.waitUntilXWindowHandles(2);
        const windowHandles = await driver.driver.getAllWindowHandles();
        await driver.driver.switchTo().window(windowHandles[2]);

        await importSRPOnboardingFlow({
          driver,
          password: WALLET_PASSWORD,
          seedPhrase: E2E_SRP,
          waitForControllers: false,
        });

        const state = await driver.executeScript(`
          return await window.stateHooks.getPersistedState();
        `);

        const isValid = isFixturesStateSchemaValid(state);
        assert.equal(isValid, true);
      },
    );
  });

  it('should have up-to-date migration version', function () {
    const migrationsPath = path.join(__dirname, '../../app/scripts/migrations');
    const migrationFiles = readdirSync(migrationsPath)
      .filter((file) => /^\d+$/u.test(path.basename(file, path.extname(file))))
      .map((file) => Number(path.basename(file, path.extname(file))))
      .sort((a, b) => b - a);

    const latestMigration = migrationFiles[0];
    assert.equal(
      latestMigration === FIXTURE_STATE_METADATA_VERSION,
      `Fixture state version (${FIXTURE_STATE_METADATA_VERSION}) is behind the latest migration (${latestMigration}). Please update the fixture state version.`,
    );
  });

  it('should maintain valid schema after applying FixtureBuilder custom methods', async function () {
    const builder = new FixtureBuilder();
    const initialFixture = builder.fixture;

    const allMethods = Object.getOwnPropertyNames(
      Object.getPrototypeOf(builder),
    );

    // we need to ignore the generic methods as they accept any data and that's set on the spec files
    const methodsToTest = allMethods.filter((method) => {
      const methodType = (builder as FixtureBuilder)[
        method as FixtureBuilderMethods
      ];
      return (
        typeof methodType === 'function' &&
        ![
          'constructor',
          'build',
          'withAccountTracker',
          'withAddressBookController',
          'withAlertController',
          'withAnnouncementController',
          'withNetworkOrderController',
          'withAccountOrderController',
          'withAppStateController',
          'withCurrencyController',
          'withGasFeeController',
          'withKeyringController',
          'withMetaMetricsController',
          'withNetworkController',
          'withNftController',
          'withTransactionController',
          'withNameController',
          'withPreferencesController',
          'withQueuedRequestController',
          'withSelectedNetworkController',
          'withSmartTransactionsController',
          'withSubjectMetadataController',
          'withTokensController',
          'withIncomingTransactionsPreferences',
          'withIncomingTransactionsCache',
          'withTransactions',
        ].includes(method)
      );
    });

    for (const method of methodsToTest) {
      const callableMethod = (builder as FixtureBuilder)[
        method as FixtureBuilderMethods
      ];
      if (typeof callableMethod === 'function') {
        callableMethod();
      }

      const isValid = isFixturesStateSchemaValid(builder.fixture);
      assert.equal(isValid, true, `Schema is invalid after applying ${method}`);

      builder.fixture = initialFixture;
    }
  });
});
