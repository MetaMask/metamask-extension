import path from 'path';
import fs from 'fs-extra';
import { WINDOW_TITLES, withFixtures } from '../helpers';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  hasSchemaDifferences,
  mergeFixtureChanges,
  readFixtureFile,
} from '../fixtures/fixture-validation';

type JsonLike = Record<string, unknown>;

describe('Wallet State', function () {
  it('export onboarding fixture', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // we don't need to use navigate since MM will automatically open a new window in prod build
        await driver.waitAndSwitchToWindowWithTitle(
          2,
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();

        // Add hardcoded delay to stabilize the test and ensure values for properties are loaded
        await driver.delay(10000);

        const persistedState = (await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        )) as JsonLike;

        const outDir = path.resolve(process.cwd(), 'test', 'e2e', 'fixtures');
        await fs.ensureDir(outDir);
        const outPath = path.join(outDir, 'onboarding-fixture.json');
        console.log(
          '\n=============================================================================\n',
        );
        console.log('📁 WALLET FIXTURE STATE EXPORT');
        console.log(
          '=============================================================================\n',
        );

        // Try to read existing fixture and compute diff
        let finalState: JsonLike;
        try {
          const existingFixture = await readFixtureFile(outPath);
          const schemaDiff = computeSchemaDiff(existingFixture, persistedState);

          if (hasSchemaDifferences(schemaDiff)) {
            console.log('📊 Schema differences detected:');
            if (schemaDiff.newKeys.length > 0) {
              console.log(`  ✨ New keys: ${schemaDiff.newKeys.length}`);
              schemaDiff.newKeys.forEach((key) => console.log(`     + ${key}`));
            }
            if (schemaDiff.missingKeys.length > 0) {
              console.log(
                `  🗑️  Missing keys: ${schemaDiff.missingKeys.length}`,
              );
              schemaDiff.missingKeys.forEach((key) =>
                console.log(`     - ${key}`),
              );
            }
            if (schemaDiff.typeMismatches.length > 0) {
              console.log(
                `  🔄 Type mismatches: ${schemaDiff.typeMismatches.length}`,
              );
              schemaDiff.typeMismatches.forEach((entry) =>
                console.log(`     ~ ${entry}`),
              );
            }

            // Merge only the changes into the existing fixture
            finalState = mergeFixtureChanges(
              existingFixture,
              persistedState,
              schemaDiff,
            );
            console.log(
              '\n✅ Merged changes into existing fixture (preserving ignored keys)',
            );
          } else {
            console.log(
              '✅ No schema differences detected - fixture is up to date',
            );
            finalState = existingFixture;
          }
        } catch {
          // No existing fixture, use the new state as-is
          console.log('📝 No existing fixture found - creating new fixture');
          finalState = persistedState;
        }

        console.log(`\n📂 Output: ${outPath}`);
        console.log(
          '\n=============================================================================\n',
        );

        await fs.writeJson(outPath, finalState, { spaces: 2 });
      },
    );
  });
});
