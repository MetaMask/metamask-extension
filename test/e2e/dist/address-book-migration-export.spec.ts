import path from 'path';
import fs from 'fs-extra';
import { withFixtures } from '../helpers';
import { WINDOW_TITLES } from '../constants';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  hasSchemaDifferences,
  mergeFixtureChanges,
  readFixtureFile,
} from '../fixtures/fixture-validation';

type JsonLike = Record<string, unknown>;

describe('AddressBookController Migration', function () {
  it('export post-migration fixture', async function () {
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

        const validatedState = persistedState as JsonLike;

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(
            POST_MIGRATION_FIXTURE_PATH,
          );
          const schemaDiff = computeSchemaDiff(existingFixture, validatedState);

          if (hasSchemaDifferences(schemaDiff)) {
            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              validatedState,
              schemaDiff,
            );
          } else {
            finalState = existingFixture;
          }
        } catch (error) {
          // If the fixture does not exist or failed to read, write the full validated state
          finalState = validatedState;
        }

        await fs.writeJson(POST_MIGRATION_FIXTURE_PATH, finalState, {
          spaces: 2,
        });
      },
    );
  });
});


