import path from 'path';
import { WINDOW_TITLES, withFixtures } from '../helpers';
import StartOnboardingPage from '../page-objects/pages/onboarding/start-onboarding-page';
import {
  computeSchemaDiff,
  formatSchemaDiff,
  hasSchemaDifferences,
  readFixtureFile,
} from '../fixtures/fixture-validation';

const ONBOARDING_FIXTURE_PATH = path.resolve(
  __dirname,
  '../fixtures',
  'onboarding-fixture.json',
);

describe('Wallet State', function () {
  it('matches the committed onboarding fixture schema', async function () {
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      this.skip();
    }
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

        await driver.waitUntil(
          async () => {
            const state = await driver.executeScript(
              'return window.stateHooks.getPersistedState()',
            );
            if (typeof state?.data !== 'object') {
              return false;
            }
            const dataKeys = Object.keys(state.data).filter(
              (key) => key !== 'config',
            );
            return dataKeys.length > 0;
          },
          { interval: 1000, timeout: 10000 },
        );

        const persistedState = (await driver.executeScript(
          'return window.stateHooks.getPersistedState()',
        )) as Record<string, unknown>;

        const existingFixture = await readFixtureFile(ONBOARDING_FIXTURE_PATH);
        const schemaDiff = computeSchemaDiff(existingFixture, persistedState);

        if (hasSchemaDifferences(schemaDiff)) {
          const message = formatSchemaDiff(schemaDiff);
          console.log(
            '\n=============================================================================\n',
          );
          console.log('⚠️  WALLET FIXTURE STATE VALIDATION FAILED');
          console.log(
            '=============================================================================\n',
          );
          console.log(
            '🤖 Automatic update: comment @metamaskbot update-e2e-fixture',
          );
          console.log(
            '\n🛠️  Manual update steps:\n  yarn dist\n  yarn test:e2e:single test/e2e/fixtures/wallet-fixture-export.spec.ts --browser chrome',
          );
          console.log(
            '\n=============================================================================\n',
          );
          throw new Error(message);
        }
      },
    );
  });
});
