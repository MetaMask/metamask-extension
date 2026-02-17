import path from 'path';
import fs from 'fs-extra';
import { withFixtures } from '../helpers';
import { WINDOW_TITLES } from '../constants';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  formatSchemaDiff,
  hasSchemaDifferences,
  readFixtureFile,
} from '../fixtures/fixture-validation';

describe('AddressBookController Migration', function () {
  it('migrated state matches committed migration fixture schema', async function () {
    // Skip on Firefox - this.skip() throws immediately and prevents withFixtures() from running
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }

    const PRE_MIGRATION_FIXTURE_PATH = path.resolve(
      __dirname,
      '../fixtures',
      'address-book-pre-migration.json',
    );
    const POST_MIGRATION_FIXTURE_PATH = path.resolve(
      __dirname,
      '../fixtures',
      'address-book-post-migration.json',
    );

    const preMigrationState = await fs.readJson(PRE_MIGRATION_FIXTURE_PATH);

    await withFixtures(
      {
        fixtures: preMigrationState,
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // Open extension window (prod build opens a fullscreen window automatically)
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // Allow time for migrations and state initialization to complete
        await driver.delay(10000);

        const persistedState = await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        );

        if (
          persistedState === null ||
          persistedState === undefined ||
          typeof persistedState !== 'object'
        ) {
          throw new Error(
            `Expected getPersistedState() to return an object, but got: ${typeof persistedState}`,
          );
        }

        const validatedState = persistedState as Record<string, unknown>;

        const expectedPostMigration = await readFixtureFile(
          POST_MIGRATION_FIXTURE_PATH,
        );
        const schemaDiff = computeSchemaDiff(
          expectedPostMigration,
          validatedState,
        );

        if (hasSchemaDifferences(schemaDiff)) {
          throw new Error(formatSchemaDiff(schemaDiff));
        }
      },
    );
  });
});


